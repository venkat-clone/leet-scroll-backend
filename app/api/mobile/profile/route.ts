import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { authenticated } from "@/lib/authenticatedHandler";

export const GET = authenticated(
  async (request: NextRequest, userId: string) => {
    try {
      const [
        user,
        submissionsCount,
        questionsAttemptedCount,
        correctAnswersCount,
        wrongAnswersCount,
        correctAnswersBreakdown,
        wrongAnswersBreakdown,
        attemptedQuestionsBreakdown,
        preferences,
      ] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            score: true,
            role: true,
            id: true,
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
        prisma.question.groupBy({
          by: ["difficulty"],
          where: {
            submissions: {
              some: {
                userId: userId,
                isCorrect: true,
              },
            },
          },
        }),
        prisma.question.groupBy({
          by: ["difficulty"],
          where: {
            submissions: {
              some: {
                userId: userId,
                isCorrect: false,
              },
            },
          },
        }),
        prisma.question.groupBy({
          by: ["difficulty"],
          where: {
            submissions: {
              some: {
                userId: userId,
              },
            },
          },
        }),
        prisma.userPreferences.findUnique({
          where: {
            userId,
          },
        }),
      ]);

      return NextResponse.json({
        user,
        stats: {
          score: user?.score,
          submissions: submissionsCount,
          questionsAttempted: questionsAttemptedCount,
          correctAnswers: correctAnswersCount,
          wrongAnswers: wrongAnswersCount,
          correctAnswersBreakdown,
          wrongAnswersBreakdown,
          attemptedQuestionsBreakdown,
        },
        preferences,
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
