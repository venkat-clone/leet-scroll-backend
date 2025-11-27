import { POST } from '@/app/api/register/route'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Mock the prisma client
jest.mock('@/lib/prisma')

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}))

describe('Register API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should register a new user successfully', async () => {
        const body = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
        }

        const req = new Request('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(body),
        })

            // Mock findUnique to return null (user doesn't exist)
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

            // Mock create to return the new user
            ; (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user_123',
                email: body.email,
                name: body.name,
                password: 'hashed_password',
                role: 'USER',
                score: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(201)
        expect(data).toEqual({
            id: 'user_123',
            email: body.email,
        })
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: body.email },
        })
        expect(prisma.user.create).toHaveBeenCalled()
    })

    it('should return 400 if fields are missing', async () => {
        const body = {
            email: 'test@example.com',
            // password missing
        }

        const req = new Request('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(body),
        })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe('Missing fields')
        expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should return 400 if user already exists', async () => {
        const body = {
            email: 'existing@example.com',
            password: 'password123',
            name: 'Existing User',
        }

        const req = new Request('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(body),
        })

            // Mock findUnique to return an existing user
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'existing_id',
                email: body.email,
            })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe('User already exists')
        expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should return 500 if database error occurs', async () => {
        const body = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
        }

        const req = new Request('http://localhost/api/register', {
            method: 'POST',
            body: JSON.stringify(body),
        })

            ; (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(500)
        expect(data.error).toBe('Failed to register user')
    })
})
