import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // Allow mobile auth via header for this specific endpoint
  const mobileUserId = req.headers.get("x-user-id");
  const userId = session?.user?.id || mobileUserId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      user,
      submissionsCount,
      questionsAttemptedCount,
      correctAnswersCount,
      wrongAnswersCount,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          score: true,
          role: true,
        },
      }),
      prisma.submission.count({
        where: { userId: userId },
      }),
      prisma.submission
        .groupBy({
          by: ["questionId"],
          where: { userId: userId },
        })
        .then((groups) => groups.length),
      prisma.submission.count({
        where: { userId: userId, isCorrect: true },
      }),
      prisma.submission.count({
        where: { userId: userId, isCorrect: false },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      stats: {
        score: user.score,
        submissions: submissionsCount,
        questionsAttempted: questionsAttemptedCount,
        correctAnswers: correctAnswersCount,
        wrongAnswers: wrongAnswersCount,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
