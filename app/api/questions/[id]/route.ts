import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.question.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const question = await prisma.question.update({
      where: { id: (await params).id },
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

    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: (await params).id },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 },
    );
  }
}
