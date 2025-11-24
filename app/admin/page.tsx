import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const [userCount, questionCount, submissionCount] = await Promise.all([
        prisma.user.count(),
        prisma.question.count(),
        prisma.submission.count(),
    ])

    return (
        <div>
            <h2 className="text-3xl font-bold text-green-500 mb-8 font-mono">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] p-6 rounded-lg shadow-lg border border-gray-800">
                    <h3 className="text-gray-400 text-sm font-medium uppercase font-mono">Total Users</h3>
                    <p className="text-3xl font-bold text-gray-100 mt-2 font-mono">{userCount}</p>
                </div>
                <div className="bg-[#111] p-6 rounded-lg shadow-lg border border-gray-800">
                    <h3 className="text-gray-400 text-sm font-medium uppercase font-mono">Total Questions</h3>
                    <p className="text-3xl font-bold text-gray-100 mt-2 font-mono">{questionCount}</p>
                </div>
                <div className="bg-[#111] p-6 rounded-lg shadow-lg border border-gray-800">
                    <h3 className="text-gray-400 text-sm font-medium uppercase font-mono">Total Submissions</h3>
                    <p className="text-3xl font-bold text-gray-100 mt-2 font-mono">{submissionCount}</p>
                </div>
            </div>
        </div>
    )
}
