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

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    const isCorrect = question.correctOption === selectedOption;

    // Check if already answered correctly BEFORE creating the new submission
    const previousCorrect = await prisma.submission.findFirst({
      where: {
        userId: userId as string,
        questionId,
        isCorrect: true,
      },
    });

    // Record submission
    await prisma.submission.create({
      data: {
        userId: userId as string,
        questionId,
        isCorrect,
      },
    });

    // Update score if correct and not previously answered correctly
    if (isCorrect && !previousCorrect) {
      await prisma.user.update({
        where: { id: userId as string },
        data: { score: { increment: 10 } }, // 10 points per question
      });
    }

    return NextResponse.json({
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 },
    );
  }
}
