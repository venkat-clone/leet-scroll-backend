// app/admin/questions/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BulkUpload from "@/components/admin/BulkUpload";
import DeleteButton from "@/components/admin/DeleteButton";
import Pagination from "@/components/admin/Pagination";
import SearchFilters from "@/components/admin/SearchFilters";

export const dynamic = "force-dynamic";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    difficulty?: string;
  }>;
}) {
  const { page = "1", q = "", category, difficulty } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  // Build dynamic where clause
  const where: any = {
    ...(q && {
      title: { contains: q, mode: "insensitive" } as const,
    }),
    ...(category && { category: { equals: category, mode: "insensitive" } }),
    ...(difficulty && { difficulty: { equals: difficulty } }),
  };

  const [questions, totalItems] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.question.count({ where }),
  ]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-green-500 font-mono">
          Questions
        </h2>
        <div className="flex items-center gap-3">
          <BulkUpload />
          <Link
            href="/admin/questions/new"
            className="bg-green-600 text-black px-4 py-2 rounded-md hover:bg-green-500 transition font-bold font-mono text-sm flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New Question
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <SearchFilters
        currentSearch={q}
        currentCategory={category}
        currentDifficulty={difficulty}
      />

      {/* Questions Table */}
      <div className="bg-[#111] rounded-lg shadow-lg border border-gray-800 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Difficulty
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {questions.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No questions found matching your filters.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id} className="hover:bg-gray-900/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-200 font-mono max-w-md truncate">
                    {q.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {q.category || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        q.difficulty === "EASY"
                          ? "text-green-400 border-green-800 bg-green-900/30"
                          : q.difficulty === "MEDIUM"
                            ? "text-yellow-400 border-yellow-800 bg-yellow-900/30"
                            : "text-red-400 border-red-800 bg-red-900/30"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-4">
                      <Link
                        href={`/admin/questions/${q.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={q.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        totalItems={totalItems}
        pageSize={pageSize}
        currentPage={currentPage}
      />
    </div>
  );
}
