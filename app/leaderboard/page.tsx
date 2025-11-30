import { prisma } from "@/lib/prisma";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    orderBy: { score: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      score: true,
      email: true,
      _count: {
        select: {
          submissions: {
            where: { isCorrect: true },
          },
        },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-500 mb-8 text-center font-mono">
          &lt;Leaderboard /&gt;
        </h1>

        <div className="bg-[#111] shadow-xl rounded-lg overflow-hidden border border-gray-800 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-900">
              <tr>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono"
                >
                  Rank
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono"
                >
                  Solved
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono"
                >
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#111] divide-y divide-gray-800">
              {users.map((user: any, index: number) => (
                <tr
                  key={user.id}
                  className={
                    index < 3
                      ? "bg-green-900/10"
                      : "hover:bg-gray-900/50 transition-colors"
                  }
                >
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm font-mono
                                            ${
                                              index === 0
                                                ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"
                                                : index === 1
                                                  ? "bg-gray-400/20 text-gray-400 border border-gray-400/50"
                                                  : index === 2
                                                    ? "bg-orange-500/20 text-orange-500 border border-orange-500/50"
                                                    : "text-gray-500"
                                            }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-200 font-mono">
                      {user.name || "Anonymous"}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                    {user._count.submissions}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-green-500 font-bold font-mono">
                    {user.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
