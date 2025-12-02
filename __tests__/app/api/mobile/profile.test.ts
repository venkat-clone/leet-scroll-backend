import { GET } from "@/app/api/mobile/profile/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma");

jest.mock("next-auth");

describe("GET /api/mobile/profile", () => {
  it("should return 200 and user data", async () => {
    const req = new Request("http://localhost/api/mobile/profile", {
      method: "GET",
      headers: {
        Authorization: "Bearer mock-jwt-token-1",
      },
    });

    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        score: 0,
      },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
      score: 0,
    });
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);
    (prisma.submission.groupBy as jest.Mock).mockResolvedValueOnce([]);
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      stats: {
        score: 0,
        submissions: 0,
        questionsAttempted: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
      },
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        score: 0,
      },
    });
  });
  it("Should return 401 on invalid token", async () => {
    const req = new Request("http://localhost/api/mobile/profile", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    (getServerSession as jest.Mock).mockReturnValueOnce(null);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
  it("Should return 404 when userid is not found", async () => {
    const req = new Request("http://localhost/api/mobile/profile", {
      method: "GET",
      headers: {
        Authorization: "Bearer mock-jwt-token-1",
      },
    });

    (getServerSession as jest.Mock).mockReturnValueOnce({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        score: 0,
      },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);
    (prisma.submission.groupBy as jest.Mock).mockResolvedValueOnce([]);
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("User not found");
  });
  it("Should return 500 on database error", async () => {
    const req = new Request("http://localhost/api/mobile/profile", {
      method: "GET",
      headers: {
        Authorization: "Bearer mock-jwt-token-1",
      },
    });
    (getServerSession as jest.Mock).mockReturnValueOnce({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        score: 0,
      },
    });
    (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(
      new Error("DB Error"),
    );
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);
    (prisma.submission.groupBy as jest.Mock).mockResolvedValueOnce([]);
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);
    (prisma.submission.count as jest.Mock).mockResolvedValueOnce(0);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
