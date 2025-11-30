import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h2 className="text-3xl font-bold text-green-500 mb-8 font-mono">
        Users
      </h2>
      <div className="bg-[#111] rounded-lg shadow-lg border border-gray-800 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#111] divide-y divide-gray-800">
            {users.map((user: any) => (
              <tr
                key={user.id}
                className="hover:bg-gray-900/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200 font-mono">
                  {user.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border
                    ${user.role === "ADMIN" ? "bg-purple-900/20 text-purple-400 border-purple-900" : "bg-gray-800 text-gray-400 border-gray-700"}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-bold font-mono">
                  {user.score}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
