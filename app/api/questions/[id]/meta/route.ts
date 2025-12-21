import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TEN_MINUTES_MS = 10 * 60 * 1000;

// return nos views co
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  const userId = session?.user.id;

  // get Views count
  // get Likes count
  // get Comments count
  // get Submissions count
  // get Submissions correct count

  const question = await prisma.question.findUnique({
    where: { id: (await params).id },
    select: {
      _count: {
        select: {
          views: true,
          likes: true,
          comments: true,
          submissions: true,
        },
      },
    },
  });

  const mostRecentView = await prisma.view.findFirst({
    where: { questionId: (await params).id, userId },
    orderBy: { createdAt: "desc" },
  });

  const viewedJustNow =
    mostRecentView !== null &&
    mostRecentView.createdAt.getTime() > Date.now() - TEN_MINUTES_MS;

  if (!viewedJustNow) {
    await prisma.view.create({
      data: {
        userId: userId as string,
        questionId: (await params).id,
      },
    });
  }

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...question._count,
    viewedJustNow,
  });
}
