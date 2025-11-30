import { GET } from "@/app/api/leaderboard/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma");

describe("Leaderboard API", () => {
  it("should fetch leaderboard data", async () => {
    const req = new Request("http://localhost/api/leaderboard");

    const mockUsers = [
      {
        id: "u1",
        name: "User 1",
        score: 100,
        _count: { submissions: 10 },
      },
      {
        id: "u2",
        name: "User 2",
        score: 50,
        _count: { submissions: 5 },
      },
    ];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      id: "u1",
      name: "User 1",
      score: 100,
      problemsSolved: 10,
    });
  });

  it("should return 500 on database error", async () => {
    const req = new Request("http://localhost/api/leaderboard");
    (prisma.user.findMany as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to fetch leaderboard");
  });
});
