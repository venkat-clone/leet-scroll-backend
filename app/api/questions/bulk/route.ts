import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { questions } = body; // Expecting array of questions

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 },
      );
    }

    const createdQuestions = await prisma.question.createMany({
      data: questions.map((q: Prisma.QuestionCreateInput) => ({
        title: q.title,
        description: q.description,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        difficulty: q.difficulty,
        category: q.category,
        tags: q.tags,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(
      { count: createdQuestions.count },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to bulk create questions" },
      { status: 500 },
    );
  }
}
