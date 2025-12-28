import { authenticated } from "@/lib/authenticatedHandler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const GET = authenticated(
  async (request: NextRequest, userId: string) => {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 15;

    const result = await prisma.submission.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        question: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return Response.json({ result });
  },
);
