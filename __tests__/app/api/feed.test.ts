/* eslint-disable @typescript-eslint/no-require-imports */
import { GET } from "@/app/api/feed/route";
import { getServerSession } from "next-auth";
import { Difficulty } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Mock next-auth
jest.mock("next-auth");
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/prisma", () => {
  const { Prisma } = require("@prisma/client");
  const createPrismaMock =
    require("prisma-mock").default || require("prisma-mock");
  const { mockDeep } = require("jest-mock-extended");

  return {
    prisma: createPrismaMock({
      datamodel: Prisma.dmmf.datamodel,
      mockClient: mockDeep(),
      enableIndexes: true,
    }),
  };
});

const prismock = prisma as any;

// Mock fs to provide the feed query
jest.mock("fs", () => {
  const originalFs = jest.requireActual("fs");
  return {
    ...originalFs,
    readFileSync: jest.fn((path, options) => {
      if (typeof path === "string" && path.includes("feed.pgsql")) {
        return `
    WITH user_prefs AS (
      SELECT 
        COALESCE(up."preferredTopics", ARRAY[]::text[]) AS topics,
        COALESCE(up."interestedTopics", ARRAY[]::text[]) AS interestedTopics,
        COALESCE(up."preferredDifficulties", ARRAY[]::"Difficulty"[]) AS difficulties
      FROM "UserPreferences" up
      WHERE up."user_id" = $1
    ),
    ranked_questions AS (
      SELECT 
        q.id,
        q.title,
        q.description,
        q.options,
        q.difficulty,
        q.category,
        q.tags,
        q."codeSnippet",
        
        COALESCE(s.attempts, 0) AS "userAttempts",
        COALESCE(s."correctAttempts", 0) AS "userCorrectAttempts",
        s."isCorrect" AS "userLastCorrect",
        s."last_shown_at" AS "userLastShownAt",
        
        (SELECT COUNT(*)::INTEGER FROM "View" v WHERE v."questionId" = q.id) AS "viewsCount",
        (SELECT COUNT(*)::INTEGER FROM "Like" l WHERE l."questionId" = q.id) AS "likesCount",
        (SELECT COUNT(*)::INTEGER FROM "Comment" c WHERE c."questionId" = q.id) AS "commentsCount",
        
        COALESCE((
          SELECT COUNT(*)::INTEGER
          FROM unnest(p.topics) AS t
          WHERE t = ANY(q.tags)
        ), 0) AS "matchingTagsCount",
        COALESCE((
          SELECT COUNT(*)::INTEGER
          FROM unnest(p.interestedTopics) AS t
          WHERE t = ANY(q.tags)
        ), 0) AS "interestedTagsCount",
        
        (q.difficulty = ANY(p.difficulties)) AS "difficultyMatches",
        
        CASE
          WHEN s.id IS NULL THEN 0
          WHEN s.attempts > 2 AND s."correctAttempts" = 0 THEN 1
          WHEN s."isCorrect" = true AND s."last_shown_at" < $2 THEN 2
          WHEN s."last_shown_at" < $2 THEN 3
          ELSE 4
        END AS priority,
        
        (
          COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM unnest(p.topics) AS t
            WHERE t = ANY(q.tags)
          ), 0) * 3
          + COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM unnest(p.interestedTopics) AS t
            WHERE t = ANY(q.tags)
          ), 0) * 2
          + (q.difficulty = ANY(p.difficulties))::int * 2
          + CASE
              WHEN s.id IS NULL THEN 0
              WHEN s.attempts > 2 AND s."correctAttempts" = 0 THEN 1
              WHEN s."isCorrect" = true AND s."last_shown_at" < $2 THEN 2
              WHEN s."last_shown_at" < $2 THEN 3
              ELSE 4
            END * 2
        ) AS "userRanking"
      
      FROM "Question" q
      CROSS JOIN user_prefs p
      LEFT JOIN "Submission" s 
        ON q.id = s."questionId" 
        AND s."userId" = $1
    )
    
    SELECT *
    FROM ranked_questions
    WHERE 
    ($3::numeric IS NULL OR $4::text IS NULL)
      OR 
      "userRanking" < $3::numeric
      OR 
      ("userRanking" = $3::numeric AND id > $4::text)
    ORDER BY 
      "userRanking" DESC,
      id ASC
    LIMIT $5;
  `;
      }
      return originalFs.readFileSync(path, options);
    }),
  };
});

describe("Feed API with Prismock", () => {
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

  beforeEach(async () => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    // Reset prismock database
    // await prismock.$reset();
    await prismock.comment.deleteMany();
    await prismock.like.deleteMany();
    await prismock.view.deleteMany();
    await prismock.submission.deleteMany();
    await prismock.userPreferences.deleteMany();
    await prismock.question.deleteMany();
    await prismock.user.deleteMany();

    // Create test user
    await prismock.user.create({
      data: {
        id: mockUserId,
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        score: 0,
      },
    });

    // Create user preferences with preferredTopics and interestedTopics
    await prismock.userPreferences.create({
      data: {
        userId: mockUserId,
        preferredDifficulties: ["EASY", "MEDIUM"],
        preferredTopics: ["array", "hash-table", "dynamic-programming"],
        interestedTopics: ["string", "tree"],
        feedSize: 10,
        preferredLanguages: ["javascript", "python"],
      },
    });

    // Create test questions
    await prismock.question.createMany({
      data: [
        {
          id: "q1",
          title: "Two Sum",
          description: "Find two numbers that add up to target",
          options: { A: "Hash Table", B: "Array", C: "Both", D: "None" },
          correctOption: 2,
          explanation: "Use hash table for O(n) solution",
          difficulty: "EASY",
          category: "arrays",
          tags: ["array", "hash-table"], // Matches 2 preferredTopics
          codeSnippet: null,
        },
        {
          id: "q2",
          title: "Longest Palindromic Substring",
          description: "Find the longest palindromic substring",
          options: { A: "DP", B: "Two Pointers", C: "Both", D: "None" },
          correctOption: 2,
          explanation: "Can use DP or expand around center",
          difficulty: "MEDIUM",
          category: "strings",
          tags: ["string", "dynamic-programming"], // 1 preferredTopic + 1 interestedTopic
          codeSnippet: "def longestPalindrome(s: str) -> str:\n    pass",
        },
        {
          id: "q3",
          title: "Binary Tree Inorder Traversal",
          description: "Traverse binary tree in order",
          options: { A: "Recursive", B: "Iterative", C: "Both", D: "None" },
          correctOption: 2,
          explanation: "Both approaches work",
          difficulty: "EASY",
          category: "trees",
          tags: ["tree", "depth-first-search"], // 1 interestedTopic only
          codeSnippet: null,
        },
        {
          id: "q4",
          title: "Graph Problem",
          description: "Solve a graph problem",
          options: { A: "BFS", B: "DFS", C: "Both", D: "None" },
          correctOption: 2,
          explanation: "Both approaches work",
          difficulty: "HARD",
          category: "graphs",
          tags: ["graph", "breadth-first-search"], // No matching tags
          codeSnippet: null,
        },
      ],
    });
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

    it("should fetch personalized feed with ranking based on preferredTopics and interestedTopics", async () => {
      // Mock the raw SQL query result based on our test data
      const mockFeedResults = [
        {
          id: "q1",
          title: "Two Sum",
          description: "Find two numbers that add up to target",
          options: { A: "Hash Table", B: "Array", C: "Both", D: "None" },
          difficulty: "EASY" as Difficulty,
          category: "arrays",
          tags: ["array", "hash-table"],
          codeSnippet: null,
          userAttempts: 0,
          userCorrectAttempts: 0,
          userLastCorrect: null,
          userLastShownAt: null,
          viewsCount: 0,
          likesCount: 0,
          commentsCount: 0,
          matchingTagsCount: 2, // array + hash-table from preferredTopics
          interestedTagsCount: 0, // no match from interestedTopics
          difficultyMatches: true, // EASY is in preferredDifficulties
          priority: 0, // never seen
          userRanking: 8, // (2*3) + (0*2) + (1*2) + (0*2) = 8
        },
        {
          id: "q2",
          title: "Longest Palindromic Substring",
          description: "Find the longest palindromic substring",
          options: { A: "DP", B: "Two Pointers", C: "Both", D: "None" },
          difficulty: "MEDIUM" as Difficulty,
          category: "strings",
          tags: ["string", "dynamic-programming"],
          codeSnippet: "def longestPalindrome(s: str) -> str:\n    pass",
          userAttempts: 0,
          userCorrectAttempts: 0,
          userLastCorrect: null,
          userLastShownAt: null,
          viewsCount: 0,
          likesCount: 0,
          commentsCount: 0,
          matchingTagsCount: 1, // dynamic-programming from preferredTopics
          interestedTagsCount: 1, // string from interestedTopics
          difficultyMatches: true, // MEDIUM is in preferredDifficulties
          priority: 0,
          userRanking: 7, // (1*3) + (1*2) + (1*2) + (0*2) = 7
        },
        {
          id: "q3",
          title: "Binary Tree Inorder Traversal",
          description: "Traverse binary tree in order",
          options: { A: "Recursive", B: "Iterative", C: "Both", D: "None" },
          difficulty: "EASY" as Difficulty,
          category: "trees",
          tags: ["tree", "depth-first-search"],
          codeSnippet: null,
          userAttempts: 0,
          userCorrectAttempts: 0,
          userLastCorrect: null,
          userLastShownAt: null,
          viewsCount: 0,
          likesCount: 0,
          commentsCount: 0,
          matchingTagsCount: 0, // no match from preferredTopics
          interestedTagsCount: 1, // tree from interestedTopics
          difficultyMatches: true, // EASY is in preferredDifficulties
          priority: 0,
          userRanking: 4, // (0*3) + (1*2) + (1*2) + (0*2) = 4
        },
      ];

      // Mock $queryRawUnsafe
      prismock.$queryRawUnsafe = jest
        .fn()
        .mockResolvedValue(mockFeedResults) as any;

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions).toHaveLength(3);

      // Verify ranking order (highest to lowest)
      expect(data.questions[0].id).toBe("q1");
      expect(data.questions[0].userRanking).toBe(8);
      expect(data.questions[0].matchingTagsCount).toBe(2);
      expect(data.questions[0].interestedTagsCount).toBe(0);

      expect(data.questions[1].id).toBe("q2");
      expect(data.questions[1].userRanking).toBe(7);
      expect(data.questions[1].matchingTagsCount).toBe(1);
      expect(data.questions[1].interestedTagsCount).toBe(1);

      expect(data.questions[2].id).toBe("q3");
      expect(data.questions[2].userRanking).toBe(4);
      expect(data.questions[2].matchingTagsCount).toBe(0);
      expect(data.questions[2].interestedTagsCount).toBe(1);
    });

    it("should handle cursor-based pagination correctly", async () => {
      const mockResults = [
        {
          id: "q4",
          title: "Graph Problem",
          description: "Solve a graph problem",
          options: { A: "BFS", B: "DFS", C: "Both", D: "None" },
          difficulty: "HARD" as Difficulty,
          category: "graphs",
          tags: ["graph", "breadth-first-search"],
          codeSnippet: null,
          userAttempts: 0,
          userCorrectAttempts: 0,
          userLastCorrect: null,
          userLastShownAt: null,
          viewsCount: 0,
          likesCount: 0,
          commentsCount: 0,
          matchingTagsCount: 0,
          interestedTagsCount: 0,
          difficultyMatches: false,
          priority: 0,
          userRanking: 0,
        },
      ];

      prismock.$queryRawUnsafe = jest
        .fn()
        .mockResolvedValue(mockResults) as any;

      const req = new Request("http://localhost/api/feed?limit=10&cursor=7_q2");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        mockUserId,
        expect.any(Date),
        7, // cursor ranking
        "q2", // cursor id
        11,
      );
    });

    it("should calculate initial cursor from last submission when no cursor provided", async () => {
      // Create a submission for the user
      await prismock.submission.create({
        data: {
          userId: mockUserId,
          questionId: "q2",
          attempts: 2,
          correctAttempts: 1,
          isCorrect: true,
          lastShownAt: new Date("2025-12-15"),
        },
      });

      prismock.$queryRawUnsafe = jest.fn().mockResolvedValue([]) as any;

      const req = new Request("http://localhost/api/feed?limit=10");
      await GET(req);

      // Verify it fetched the last submission and calculated ranking
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        mockUserId,
        expect.any(Date),
        expect.any(Number), // calculated ranking
        "q2", // last submission's questionId
        11,
      );
    });

    it("should default to ranking 0 when no submissions exist", async () => {
      prismock.$queryRawUnsafe = jest.fn().mockResolvedValue([]) as any;

      const req = new Request("http://localhost/api/feed?limit=10");
      await GET(req);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        mockUserId,
        expect.any(Date),
        0, // default ranking
        null, // no cursor id
        11,
      );
    });

    it("should indicate hasMore when results exceed limit", async () => {
      // Create 11 results (limit + 1)
      const mockResults = Array.from({ length: 11 }, (_, i) => ({
        id: `q${i + 1}`,
        title: `Question ${i + 1}`,
        description: "Test",
        options: { A: "A" },
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

      prismock.$queryRawUnsafe = jest
        .fn()
        .mockResolvedValue(mockResults) as any;

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions).toHaveLength(10);
      expect(data.hasMore).toBe(true);
      expect(data.nextCursor).toBe("5_q10");
    });

    it("should include all user progress and engagement metadata", async () => {
      // Create engagement data
      await prismock.view.createMany({
        data: [
          { userId: mockUserId, questionId: "q1" },
          { userId: "other-user", questionId: "q1" },
        ],
      });

      await prismock.like.create({
        data: { userId: mockUserId, questionId: "q1" },
      });

      await prismock.comment.createMany({
        data: [
          { userId: mockUserId, questionId: "q1", content: "Great question!" },
          { userId: "other-user", questionId: "q1", content: "Nice!" },
        ],
      });

      const mockResults = [
        {
          id: "q1",
          title: "Two Sum",
          description: "Find two numbers that add up to target",
          options: { A: "Hash Table", B: "Array", C: "Both", D: "None" },
          difficulty: "EASY" as Difficulty,
          category: "arrays",
          tags: ["array", "hash-table"],
          codeSnippet: null,
          userAttempts: 3,
          userCorrectAttempts: 2,
          userLastCorrect: true,
          userLastShownAt: new Date("2025-12-20"),
          viewsCount: 2,
          likesCount: 1,
          commentsCount: 2,
          matchingTagsCount: 2,
          interestedTagsCount: 0,
          difficultyMatches: true,
          priority: 4,
          userRanking: 16,
        },
      ];

      prismock.$queryRawUnsafe = jest
        .fn()
        .mockResolvedValue(mockResults) as any;

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions[0]).toMatchObject({
        id: "q1",
        title: "Two Sum",
        viewsCount: 2,
        likesCount: 1,
        commentsCount: 2,
        matchingTagsCount: 2,
        interestedTagsCount: 0,
        userProgress: {
          attempts: 3,
          correctAttempts: 2,
          isCorrect: true,
          lastShownAt: expect.any(String),
        },
      });
    });

    it("should handle empty feed gracefully", async () => {
      prismock.$queryRawUnsafe = jest.fn().mockResolvedValue([]) as any;

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions).toEqual([]);
      expect(data.hasMore).toBe(false);
      expect(data.nextCursor).toBeNull();
      expect(data.metadata.count).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      prismock.$queryRawUnsafe = jest
        .fn()
        .mockRejectedValue(new Error("Database error")) as any;

      const req = new Request("http://localhost/api/feed?limit=10");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch feed");
    });

    it("should respect custom limit parameter", async () => {
      prismock.$queryRawUnsafe = jest.fn().mockResolvedValue([]) as any;

      const customLimit = 20;
      const req = new Request(`http://localhost/api/feed?limit=${customLimit}`);
      await GET(req);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        mockUserId,
        expect.any(Date),
        expect.any(Number),
        null,
        customLimit + 1,
      );
    });
  });
});
