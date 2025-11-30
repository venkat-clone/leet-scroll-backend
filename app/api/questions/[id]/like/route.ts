import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || req.headers.get("x-user-id");
    const queryParams = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("userId", userId);
    console.log("questionId", queryParams.id);

    const questionId = queryParams.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_questionId: {
          userId: userId,
          questionId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.like.create({
        data: {
          userId: userId,
          questionId,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const queryParams = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || req.headers.get("x-user-id");
    const questionId = queryParams.id;

    const [likesCount, userLike] = await Promise.all([
      prisma.like.count({
        where: { questionId },
      }),
      userId
        ? prisma.like.findUnique({
            where: {
              userId_questionId: {
                userId: userId as string,
                questionId,
              },
            },
          })
        : null,
    ]);

    return NextResponse.json({
      likes: likesCount,
      isLiked: !!userLike,
    });
  } catch (error) {
    console.error("Error fetching like count:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
