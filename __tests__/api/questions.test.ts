import { GET, POST } from '@/app/api/questions/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('@/lib/prisma')
jest.mock('next-auth')
jest.mock('@/lib/auth', () => ({
    authOptions: {},
}))

describe('Questions API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET', () => {
        it('should fetch questions with pagination', async () => {
            const req = new Request('http://localhost/api/questions?page=1&limit=10')

            const mockQuestions = [
                { id: '1', title: 'Q1' },
                { id: '2', title: 'Q2' },
            ]
            const mockTotal = 2

                ; (prisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions)
                ; (prisma.question.count as jest.Mock).mockResolvedValue(mockTotal)

            const res = await GET(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.questions).toEqual(mockQuestions)
            expect(data.metadata).toEqual({
                total: mockTotal,
                page: 1,
                limit: 10,
                totalPages: 1,
            })
            expect(prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 0,
                take: 10,
            }))
        })

        it('should filter by category and difficulty', async () => {
            const req = new Request('http://localhost/api/questions?category=Arrays&difficulty=EASY')

                ; (prisma.question.findMany as jest.Mock).mockResolvedValue([])
                ; (prisma.question.count as jest.Mock).mockResolvedValue(0)

            await GET(req)

            expect(prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    category: 'Arrays',
                    difficulty: 'EASY',
                },
            }))
        })

        it('should return 500 on database error', async () => {
            const req = new Request('http://localhost/api/questions')
                ; (prisma.question.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const res = await GET(req)
            const data = await res.json()

            expect(res.status).toBe(500)
            expect(data.error).toBe('Failed to fetch questions')
        })
    })

    describe('POST', () => {
        it('should create a question if user is ADMIN', async () => {
            // Mock admin session
            ; (getServerSession as jest.Mock).mockResolvedValue({
                user: { role: 'ADMIN' },
            })

            const body = {
                title: 'New Question',
                description: 'Desc',
                options: ['A', 'B'],
                correctOption: 0,
                difficulty: 'EASY',
                category: 'Arrays',
            }

            const req = new Request('http://localhost/api/questions', {
                method: 'POST',
                body: JSON.stringify(body),
            })

                ; (prisma.question.create as jest.Mock).mockResolvedValue({
                    id: 'q1',
                    ...body,
                })

            const res = await POST(req)
            const data = await res.json()

            expect(res.status).toBe(201)
            expect(data.title).toBe(body.title)
            expect(prisma.question.create).toHaveBeenCalled()
        })

        it('should return 401 if user is not ADMIN', async () => {
            // Mock user session
            ; (getServerSession as jest.Mock).mockResolvedValue({
                user: { role: 'USER' },
            })

            const req = new Request('http://localhost/api/questions', {
                method: 'POST',
                body: JSON.stringify({}),
            })

            const res = await POST(req)
            const data = await res.json()

            expect(res.status).toBe(401)
            expect(data.error).toBe('Unauthorized')
            expect(prisma.question.create).not.toHaveBeenCalled()
        })

        it('should return 401 if not authenticated', async () => {
            // Mock no session
            ; (getServerSession as jest.Mock).mockResolvedValue(null)

            const req = new Request('http://localhost/api/questions', {
                method: 'POST',
                body: JSON.stringify({}),
            })

            const res = await POST(req)

            expect(res.status).toBe(401)
        })
    })
})
