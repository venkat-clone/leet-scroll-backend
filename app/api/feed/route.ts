import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Difficulty } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { calculateQuestionRanking } from "@/lib/utils/calculateQuestionRanking";

// Type for the feed query result
interface FeedQuestion {
  id: string;
  title: string;
  description: string;
  options: Record<string, string>;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  codeSnippet: string | null;
  userAttempts: number;
  userCorrectAttempts: number;
  userLastCorrect: boolean | null;
  userLastShownAt: Date | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  matchingTagsCount: number;
  difficultyMatches: boolean;
  priority: number;
  userRanking: number;
  interestedTagsCount: number;
}

// Load the feed query once at module level
let feedQueryCache: string | null = null;

function getFeedQuery(): string {
  if (!feedQueryCache) {
    const queryPath = join(process.cwd(), "prisma", "feed.pgsql");
    feedQueryCache = readFileSync(queryPath, "utf-8");
  }
  return feedQueryCache;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Cursor format: "ranking_id" (e.g., "15_question-123")
  const cursorParam = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "10");

  // Parse cursor
  let cursorRanking: number | null = null;
  let cursorId: string | null = null;

  // Calculate seven days ago for spaced repetition
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (cursorParam) {
    const parts = cursorParam.split("_");
    if (parts.length === 2) {
      cursorRanking = parseFloat(parts[0]);
      cursorId = parts[1];
    }
  } else {
    const lastSubmission = await prisma.submission.findFirst({
      where: {
        userId,
      },
      orderBy: {
        lastShownAt: "desc",
      },
      include: {
        question: true,
      },
    });
    const userPreferences = await prisma.userPreferences.findUnique({
      where: {
        userId,
      },
    });

    if (lastSubmission && userPreferences) {
      cursorRanking = calculateQuestionRanking(
        lastSubmission.question,
        userPreferences,
        lastSubmission,
        sevenDaysAgo,
      );
      cursorId = lastSubmission.question.id;
    } else {
      cursorRanking = 0;
      cursorId = null;
    }
  }

  console.log("cursorRanking", cursorRanking);
  console.log("cursorId", cursorId);

  try {
    const feedQuery = getFeedQuery();

    // Execute the feed query
    const questions = await prisma.$queryRawUnsafe<FeedQuestion[]>(
      feedQuery,
      userId, // $1: userId
      sevenDaysAgo, // $2: sevenDaysAgo
      cursorRanking, // $3: cursor ranking (null for first page)
      cursorId, // $4: cursor id (null for first page)
      limit + 1, // $5: limit (+1 to check if there's more)
    );

    // Pagination
    const hasMore = questions.length > limit;
    const nextQuestions = hasMore ? questions.slice(0, limit) : questions;

    // Generate next cursor from last question
    const nextCursor =
      hasMore && nextQuestions.length > 0
        ? `${nextQuestions[nextQuestions.length - 1].userRanking}_${nextQuestions[nextQuestions.length - 1].id}`
        : null;

    // Format response
    return Response.json({
      questions: nextQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        options: q.options,
        difficulty: q.difficulty,
        category: q.category,
        tags: q.tags,
        codeSnippet: q.codeSnippet,

        // User progress
        userProgress: {
          attempts: q.userAttempts,
          correctAttempts: q.userCorrectAttempts,
          isCorrect: q.userLastCorrect,
          lastShownAt: q.userLastShownAt,
        },

        // Engagement stats
        viewsCount: q.viewsCount,
        likesCount: q.likesCount,
        commentsCount: q.commentsCount,

        // Ranking metadata (useful for debugging/analytics)
        matchingTagsCount: q.matchingTagsCount,
        difficultyMatches: q.difficultyMatches,
        priority: q.priority,
        userRanking: q.userRanking,
        interestedTagsCount: q.interestedTagsCount,
      })),
      nextCursor,
      hasMore,
      metadata: {
        count: nextQuestions.length,
        limit,
      },
    });
  } catch (error) {
    console.error("Feed query error:", error);
    return Response.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
