import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const userId = session?.user?.id;
  const questionId = id;

  try {
    // Fetch question with social metadata counts
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        title: true,
        description: true,
        options: true,
        difficulty: true,
        category: true,
        tags: true,
        codeSnippet: true,
        explanation: true,
        correctOption: true,
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    let userLiked = false;
    let userProgress = null;
    let shouldShowExplanation = false;

    if (userId) {
      // Check if user has liked this question
      const like = await prisma.like.findUnique({
        where: {
          userId_questionId: {
            userId,
            questionId,
          },
        },
      });
      userLiked = !!like;

      // Check if we should increment view count (10-minute deduplication)
      const mostRecentView = await prisma.view.findFirst({
        where: { questionId, userId },
        orderBy: { createdAt: "desc" },
      });

      const viewedJustNow =
        mostRecentView !== null &&
        mostRecentView.createdAt.getTime() > Date.now() - TEN_MINUTES_MS;

      // Perform side effects in a transaction
      // Build transaction operations conditionally
      const transactionOps: any[] = [];

      // Increment view count if not viewed recently
      if (!viewedJustNow) {
        transactionOps.push(
          prisma.view.create({
            data: {
              userId,
              questionId,
            },
          }),
        );
      }

      // Always upsert submission to update lastShownAt
      const submissionUpsert = prisma.submission.upsert({
        where: {
          userId_questionId: {
            userId,
            questionId,
          },
        },
        update: {
          lastShownAt: new Date(),
          noOfSkips: {
            increment: 1,
          },
        },
        create: {
          userId,
          questionId,
          attempts: 0,
          correctAttempts: 0,
          isCorrect: false,
          lastShownAt: new Date(),
        },
      });
      transactionOps.push(submissionUpsert);

      // Execute transaction
      const results = await prisma.$transaction(transactionOps);

      // Get submission from results (last item) - it's always the submission
      const submission = results[results.length - 1];

      // Build user progress snapshot
      userProgress = {
        attempts: submission!.attempts,
        correctAttempts: submission!.correctAttempts,
        lastAttemptCorrect: submission!.lastCorrect,
        hasAttempted: submission!.attempts > 0,
      };

      // Show explanation if user has answered correctly
      shouldShowExplanation = submission!.correctAttempts > 0;
    } else {
      console.log("no submission");
    }

    // Build response
    const response: any = {
      id: question.id,
      title: question.title,
      description: question.description,
      options: question.options,
      difficulty: question.difficulty,
      category: question.category,
      tags: question.tags,
      codeSnippet: question.codeSnippet,
      userLiked,
      isBookmarked: false,
      likes: question._count.likes,
      views: question._count.views,
      comments: question._count.comments,
    };

    // Only include explanation if user has earned it
    if (shouldShowExplanation && question.explanation) {
      response.explanation = question.explanation;
    }

    // Only include user progress if authenticated
    if (userProgress) {
      response.userProgress = userProgress;
    }

    // Don't expose correct option to client
    // (only shown after submission via /api/submit)

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching question info:", error);
    return NextResponse.json(
      { error: "Failed to fetch question info" },
      { status: 500 },
    );
  }
}
