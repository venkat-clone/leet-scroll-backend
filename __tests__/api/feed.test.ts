import { GET } from "@/app/api/feed/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Difficulty } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/prisma");
jest.mock("next-auth");
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Mock fs to provide the feed query
jest.mock("fs", () => ({
  readFileSync: jest.fn(() => "MOCK_SQL_QUERY"),
}));

describe("Feed API", () => {
  const mockUserId = "user-test-123";
  const mockSession = {
    user: {
      id: mockUserId,
      name: "Test User",
      email: "test@example.com",
      role: "USER",
      score: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("GET /api/feed", () => {
    it("should return unauthorized if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/feed");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should fetch personalized feed with preferredTopics and interestedTopics ranking", async () => {
      const mockQuestions = [
        {
          id: "q1",
          title: "Two Sum",
          description: "Find two numbers",
          options: { A: "Hash Table", B: "Array" },
          difficulty: "EASY" as Difficulty,
          category: "arrays",
          tags: ["array", "hash-table"],
          codeSnippet: null,
          userAttempts: 0,
          userCorrectAttempts: 0,
          userLastCorrect: null,
          userLastShownAt: null,
          viewsCount: 10,
          likesCount: 5,
          commentsCount: 2,
          matchingTagsCount: 2, // From preferredTopics
          interestedTagsCount: 0, // From interestedTopics
          difficultyMatches: true,
          priority: 0,
          userRanking: 8, // (2*3) + (0*2) + (1*2) + (0*2) = 8
        },
        {
          id: "q2",
          title: "Palindrome",
          description: "Find palindrome",
          options: { A: "DP" },
          difficulty: "MEDIUM" as Difficulty,
          category: "strings",
          tags: ["string", "dynamic-programming"],
          codeSnippet: null,
          userAttempts: 0,
          userCorrectAttempts: 0,
          userLastCorrect: null,
          userLastShownAt: null,
          viewsCount: 20,
          likesCount: 8,
          commentsCount: 4,
          matchingTagsCount: 1, // dynamic-programming from preferredTopics
          interestedTagsCount: 1, // string from interestedTopics
          difficultyMatches: true,
          priority: 0,
          userRanking: 7, // (1*3) + (1*2) + (1*2) + (0*2) = 7
        },
      ];

      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockQuestions);
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions).toHaveLength(2);

      // Verify ranking and tag counts
      expect(data.questions[0].matchingTagsCount).toBe(2);
      expect(data.questions[0].interestedTagsCount).toBe(0);
      expect(data.questions[0].userRanking).toBe(8);

      expect(data.questions[1].matchingTagsCount).toBe(1);
      expect(data.questions[1].interestedTagsCount).toBe(1);
      expect(data.questions[1].userRanking).toBe(7);
    });

    it("should handle cursor-based pagination", async () => {
      const mockResult = [
        {
          id: "q3",
          title: "Test",
          description: "Test",
          options: {},
          difficulty: "EASY" as Difficulty,
          category: "arrays",
          tags: ["array"],
          codeSnippet: null,
          userAttempts: 0,
          userCorrectAttempts: 0,
          userLastCorrect: null,
          userLastShownAt: null,
          viewsCount: 0,
          likesCount: 0,
          commentsCount: 0,
          matchingTagsCount: 1,
          interestedTagsCount: 0,
          difficultyMatches: true,
          priority: 0,
          userRanking: 5,
        },
      ];

      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockResult);

      const req = new Request("http://localhost/api/feed?limit=10&cursor=7_q2");
      await GET(req);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        mockUserId,
        expect.any(Date),
        7, // cursor ranking
        "q2", // cursor id
        11,
      );
    });

    it("should detect hasMore when results exceed limit", async () => {
      const mockResults = Array.from({ length: 11 }, (_, i) => ({
        id: `q${i + 1}`,
        title: `Question ${i + 1}`,
        description: "Test",
        options: {},
        difficulty: "EASY" as Difficulty,
        category: "arrays",
        tags: ["array"],
        codeSnippet: null,
        userAttempts: 0,
        userCorrectAttempts: 0,
        userLastCorrect: null,
        userLastShownAt: null,
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        matchingTagsCount: 1,
        interestedTagsCount: 0,
        difficultyMatches: true,
        priority: 0,
        userRanking: 5,
      }));

      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockResults);
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions).toHaveLength(10);
      expect(data.hasMore).toBe(true);
      expect(data.nextCursor).toBe("5_q10");
    });

    it("should calculate cursor from last submission", async () => {
      const mockSubmission = {
        userId: mockUserId,
        questionId: "q-last",
        attempts: 2,
        correctAttempts: 1,
        isCorrect: true,
        lastShownAt: new Date("2025-12-15"),
        question: {
          id: "q-last",
          title: "Last Question",
          description: "Test",
          options: {},
          correctOption: 0,
          explanation: null,
          difficulty: "EASY" as Difficulty,
          category: "arrays",
          tags: ["array"],
          codeSnippet: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const mockUserPreferences = {
        id: "pref1",
        userId: mockUserId,
        preferredDifficulties: ["EASY" as Difficulty],
        preferredTopics: ["array"],
        interestedTopics: ["string"],
        feedSize: 10,
        preferredLanguages: ["javascript"],
      };

      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(
        mockSubmission,
      );
      (prisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockUserPreferences,
      );
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = new Request("http://localhost/api/feed?limit=10");
      await GET(req);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        mockUserId,
        expect.any(Date),
        expect.any(Number), // calculated ranking
        "q-last",
        11,
      );
    });

    it("should default to ranking 0 when no submissions", async () => {
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = new Request("http://localhost/api/feed?limit=10");
      await GET(req);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        mockUserId,
        expect.any(Date),
        0,
        null,
        11,
      );
    });

    it("should include all ranking metadata in response", async () => {
      const mockQuestion = {
        id: "q1",
        title: "Test",
        description: "Test",
        options: {},
        difficulty: "EASY" as Difficulty,
        category: "arrays",
        tags: ["array"],
        codeSnippet: null,
        userAttempts: 3,
        userCorrectAttempts: 2,
        userLastCorrect: true,
        userLastShownAt: new Date("2025-12-20"),
        viewsCount: 10,
        likesCount: 5,
        commentsCount: 2,
        matchingTagsCount: 2,
        interestedTagsCount: 1,
        difficultyMatches: true,
        priority: 4,
        userRanking: 14,
      };

      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([mockQuestion]);
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions[0]).toMatchObject({
        matchingTagsCount: 2,
        interestedTagsCount: 1,
        userRanking: 14,
        userProgress: {
          attempts: 3,
          correctAttempts: 2,
          isCorrect: true,
        },
      });
    });

    it("should handle empty feed", async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions).toEqual([]);
      expect(data.hasMore).toBe(false);
      expect(data.nextCursor).toBeNull();
    });

    it("should handle database errors", async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch feed");
    });
  });
});
