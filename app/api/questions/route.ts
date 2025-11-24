import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const difficulty = searchParams.get("difficulty")

    const skip = (page - 1) * limit

    const where: any = {}
    if (category) where.category = category
    if (difficulty) where.difficulty = difficulty

    try {
        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    options: true,
                    difficulty: true,
                    category: true,
                    tags: true,
                    // Exclude correctOption and explanation for normal users?
                    // Actually, for the feed we might need them if we validate on client, 
                    // but better to validate on server or send them and hide in UI.
                    // For security, we should probably NOT send correctOption if we validate on server.
                    // But the requirement says "view questions... and hints", "solution reveal".
                    // So we can send them but maybe in a separate field or just send everything for now 
                    // and trust the client (not secure for competitive, but fine for practice).
                    // Let's send everything for simplicity of "reveal solution".
                    correctOption: true,
                    explanation: true,
                    codeSnippet: true,
                }
            }),
            prisma.question.count({ where }),
        ])

        return NextResponse.json({
            questions,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { title, description, options, correctOption, explanation, difficulty, category, tags, codeSnippet } = body

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
        })

        return NextResponse.json(question, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
    }
}
