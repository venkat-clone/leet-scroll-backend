import { POST } from '@/app/api/submit/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

jest.mock('@/lib/prisma')
jest.mock('next-auth')
jest.mock('@/lib/auth', () => ({
    authOptions: {},
}))

describe('Submit API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should submit correct answer and update score for new submission', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } })

        const body = { questionId: 'q1', selectedOption: 1 }
        const req = new Request('http://localhost/api/submit', {
            method: 'POST',
            body: JSON.stringify(body),
        })

            ; (prisma.question.findUnique as jest.Mock).mockResolvedValue({
                id: 'q1',
                correctOption: 1,
                explanation: 'Exp',
            })
            ; (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null) // Not answered correctly before

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.isCorrect).toBe(true)
        expect(prisma.submission.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ isCorrect: true }),
        }))
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'user1' },
            data: { score: { increment: 10 } },
        }))
    })

    it('should submit correct answer but NOT update score if already answered correctly', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } })

        const body = { questionId: 'q1', selectedOption: 1 }
        const req = new Request('http://localhost/api/submit', {
            method: 'POST',
            body: JSON.stringify(body),
        })

            ; (prisma.question.findUnique as jest.Mock).mockResolvedValue({
                id: 'q1',
                correctOption: 1,
            })
            ; (prisma.submission.findFirst as jest.Mock).mockResolvedValue({ id: 'sub1' }) // Already answered

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.isCorrect).toBe(true)
        expect(prisma.submission.create).toHaveBeenCalled()
        expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should submit incorrect answer', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } })

        const body = { questionId: 'q1', selectedOption: 0 } // Wrong option
        const req = new Request('http://localhost/api/submit', {
            method: 'POST',
            body: JSON.stringify(body),
        })

            ; (prisma.question.findUnique as jest.Mock).mockResolvedValue({
                id: 'q1',
                correctOption: 1,
            })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.isCorrect).toBe(false)
        expect(prisma.submission.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ isCorrect: false }),
        }))
        expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should return 401 if not authenticated', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue(null)
        const req = new Request('http://localhost/api/submit', { headers: new Headers() }) // No x-user-id

        const res = await POST(req)
        expect(res.status).toBe(401)
    })

    it('should return 404 if question not found', async () => {
        ; (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } })
        const req = new Request('http://localhost/api/submit', {
            method: 'POST',
            body: JSON.stringify({ questionId: 'bad_id', selectedOption: 0 }),
        })

            ; (prisma.question.findUnique as jest.Mock).mockResolvedValue(null)

        const res = await POST(req)
        expect(res.status).toBe(404)
    })
})
