import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const questionId = await params;

  if (!questionId) {
    notFound();
  }
  const question = await prisma.question.findUnique({
    where: { id: questionId.id },
  });

  if (!question) {
    notFound();
  }

  return <EditForm question={question} />;
}
