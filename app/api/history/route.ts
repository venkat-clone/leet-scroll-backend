import { authenticated } from "@/lib/authenticatedHandler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const GET = authenticated(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "";

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const whereClause: any = { userId };

  if (search) {
    whereClause.question = {
      title: {
        contains: search,
        mode: "insensitive",
      },
    };
  }

  if (filter === "solved") {
    whereClause.isCorrect = true;
  } else if (filter === "unsolved") {
    whereClause.isCorrect = false;
    whereClause.submittedAt = { not: null };
  } else if (filter === "skipped") {
    whereClause.submittedAt = null;
  }

  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: {
      question: true,
      attemptsHistory: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
    skip,
    take,
  });

  // // Map to the desired output format
  // const result = submissions.map((sub) => ({
  //     questionTitle: sub.question.title,
  //     numCorrect: sub.correctAttempts,
  //     numAttempts: sub.attempts,
  //     lastSubmissionDate: sub.submittedAt,
  // }));

  return Response.json({ submissions: submissions });
});
