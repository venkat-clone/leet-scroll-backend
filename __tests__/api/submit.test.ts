import { POST } from "@/app/api/submit/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock next-auth
jest.mock("next-auth");
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    question: {
      findUnique: jest.fn(),
    },
    submission: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    userAttempt: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  },
}));

describe("Submit API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should submit correct answer and update score for new submission", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    const body = { questionId: "q1", selectedOption: 1 };
    const req = new Request("http://localhost/api/submit", {
      method: "POST",
      body: JSON.stringify(body),
    });

    (prisma.question.findUnique as jest.Mock).mockResolvedValue({
      id: "q1",
      correctOption: 1,
      explanation: "Exp",
      difficulty: "MEDIUM",
    });
    // Mock no existing submission
    (prisma.submission.findUnique as jest.Mock).mockResolvedValue(null);

    // Mock transaction result
    // first op is userAttempt.create, second is submission.upsert
    (prisma.userAttempt.create as jest.Mock).mockResolvedValue({});
    (prisma.submission.upsert as jest.Mock).mockResolvedValue({
      attempts: 1,
      correctAttempts: 1,
      isCorrect: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isCorrect).toBe(true);
    expect(data.attempts).toBe(1);

    // Check inputs to upsert
    expect(prisma.submission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_questionId: { userId: "user1", questionId: "q1" },
        }),
        create: expect.objectContaining({
          isCorrect: true,
          correctAttempts: 1,
        }),
        update: expect.objectContaining({ isCorrect: true }),
      }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user1" },
        data: { score: { increment: 10 } }, // questions mocked as MEDIUM (10 pts)
      }),
    );
  });

  it("should submit correct answer but NOT update score if already answered correctly", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    const body = { questionId: "q1", selectedOption: 1 };
    const req = new Request("http://localhost/api/submit", {
      method: "POST",
      body: JSON.stringify(body),
    });

    (prisma.question.findUnique as jest.Mock).mockResolvedValue({
      id: "q1",
      correctOption: 1,
      difficulty: "MEDIUM",
    });
    // Already answered
    (prisma.submission.findUnique as jest.Mock).mockResolvedValue({
      id: "sub1",
      correctAttempts: 1, // Already has correct attempts
    });

    (prisma.userAttempt.create as jest.Mock).mockResolvedValue({});
    (prisma.submission.upsert as jest.Mock).mockResolvedValue({
      attempts: 2,
      correctAttempts: 2,
      isCorrect: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isCorrect).toBe(true);
    expect(prisma.submission.upsert).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should submit incorrect answer", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    const body = { questionId: "q1", selectedOption: 0 }; // Wrong option
    const req = new Request("http://localhost/api/submit", {
      method: "POST",
      body: JSON.stringify(body),
    });

    (prisma.question.findUnique as jest.Mock).mockResolvedValue({
      id: "q1",
      correctOption: 1,
      difficulty: "MEDIUM",
    });

    (prisma.submission.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.userAttempt.create as jest.Mock).mockResolvedValue({});
    (prisma.submission.upsert as jest.Mock).mockResolvedValue({
      attempts: 1,
      correctAttempts: 0,
      isCorrect: false,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isCorrect).toBe(false);
    expect(prisma.submission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ isCorrect: false }),
      }),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should return 401 if not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/submit", {
      headers: new Headers(),
    }); // No x-user-id

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 404 if question not found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });
    const req = new Request("http://localhost/api/submit", {
      method: "POST",
      body: JSON.stringify({ questionId: "bad_id", selectedOption: 0 }),
    });

    (prisma.question.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
