import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  const where: any = {};
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;

  // fetch attempted correct questions
  const attemptedCorrect = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      isCorrect: true,
    },
    select: { questionId: true },
  });
  const excludeIds = attemptedCorrect.map((s) => s.questionId);

  // fetch random questions excluding them
  const questions = await prisma.question.findMany({
    where: {
      ...where,
      id: { notIn: excludeIds },
    },
    take: limit,
    // orderBy: [{ options:{random: "asc"} }],
    select: {
      id: true,
      title: true,
      description: true,
      options: true,
      difficulty: true,
      category: true,
      tags: true,
      correctOption: true,
      explanation: true,
      codeSnippet: true,
    },
  });

  return NextResponse.json({ questions });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      options,
      correctOption,
      explanation,
      difficulty,
      category,
      tags,
      codeSnippet,
    } = body;

    const question = await prisma.question.create({
      data: {
        title,
        description,
        options,
        correctOption,
        explanation,
        difficulty,
        category,
        tags,
        codeSnippet,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 },
    );
  }
}
