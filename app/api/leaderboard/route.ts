import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const users = await prisma.user.findMany({
            orderBy: { score: "desc" },
            take: 50,
            select: {
                id: true,
                name: true,
                score: true,
                _count: {
                    select: {
                        submissions: {
                            where: { isCorrect: true }
                        }
                    }
                }
            },
        })

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            score: user.score,
            problemsSolved: user._count.submissions
        }))

        return NextResponse.json(formattedUsers)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }
}
