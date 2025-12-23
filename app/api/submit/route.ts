import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { questionId, selectedOption } = body;

    // Validate input
    if (!questionId || selectedOption === undefined) {
      return NextResponse.json(
        { error: "questionId and selectedOption are required" },
        { status: 400 },
      );
    }

    // Fetch question with correct option
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        correctOption: true,
        explanation: true,
        difficulty: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    // Determine if answer is correct
    const isCorrect = question.correctOption === selectedOption;

    // Get existing submission to check if this is first correct (before transaction)
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        userId_questionId: {
          userId: userId as string,
          questionId,
        },
      },
    });

    const isFirstCorrect =
      isCorrect &&
      (!existingSubmission || existingSubmission.correctAttempts === 0);

    // Perform all database operations in a transaction
    const [, updatedSubmission] = await prisma.$transaction([
      // 1. Create UserAttempt record (detailed history)
      prisma.userAttempt.create({
        data: {
          userId: userId as string,
          questionId,
          selectedOption: String(selectedOption),
          isCorrect,
        },
      }),

      // 2. Upsert Submission summary
      prisma.submission.upsert({
        where: {
          userId_questionId: {
            userId: userId as string,
            questionId,
          },
        },
        update: {
          attempts: {
            increment: 1,
          },
          correctAttempts: isCorrect
            ? {
                increment: 1,
              }
            : undefined,
          lastCorrect: isCorrect,
          isCorrect: isCorrect,
          submittedAt: new Date(),
          lastShownAt: new Date(),
        },
        create: {
          userId: userId as string,
          questionId,
          attempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          lastCorrect: isCorrect,
          isCorrect: isCorrect,
          submittedAt: new Date(),
          lastShownAt: new Date(),
        },
      }),
    ]);

    // Award points only on first correct attempt (outside transaction for safety)
    if (isFirstCorrect) {
      // Award points based on difficulty
      const points =
        question.difficulty === "HARD"
          ? 15
          : question.difficulty === "MEDIUM"
            ? 10
            : 5;

      await prisma.user.update({
        where: { id: userId as string },
        data: { score: { increment: points } },
      });
    }

    // Return response
    return NextResponse.json({
      success: true,
      isCorrect,
      attempts: updatedSubmission.attempts,
      correctAttempts: updatedSubmission.correctAttempts,
      correctOption: question.correctOption,
      explanation: question.explanation,
      message: isCorrect
        ? isFirstCorrect
          ? "Correct! Points awarded."
          : "Correct! You've already solved this."
        : "Incorrect. Try again!",
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 },
    );
  }
}
