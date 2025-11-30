import { GET, POST } from "@/app/api/questions/[id]/like/route";
import { initMockUserRole } from "../mock.test";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("@/lib/prisma");
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

initMockUserRole();

describe("POST /api/questions/[id]/like", () => {
  it("should return like true and like created", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/like", {
      method: "POST",
      headers: {
        "x-user-id": "1",
      },
      body: JSON.stringify({}),
    });
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: "1" } });
    (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.like.create as jest.Mock).mockResolvedValue({ id: "1" });
    const res = await POST(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ liked: true });
  });

  it("should return liked false and like deleted", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/like", {
      method: "POST",
      headers: {
        "x-user-id": "1",
      },
      body: JSON.stringify({}),
    });
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: "1" } });
    (prisma.like.create as jest.Mock).mockResolvedValue({ id: "1" });
    (prisma.like.findUnique as jest.Mock).mockResolvedValue({ id: "1" });
    const res = await POST(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ liked: false });
  });
  it("should return 401 if user is not authenticated", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/like", {
      method: "POST",
      headers: {},
      body: JSON.stringify({}),
    });

    (getServerSession as jest.Mock).mockReturnValue(null);
    (prisma.like.create as jest.Mock).mockRejectedValue(new Error("DB Error"));
    const res = await POST(req, { params: { id: "1" } });
    expect(res.status).toBe(401);
    expect(res.body).toBeDefined();
  });

  it("should return 500 on database error", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/like", {
      method: "POST",
      headers: {
        "x-user-id": "1",
      },
      body: JSON.stringify({
        questionId: "1",
      }),
    });

    (getServerSession as jest.Mock).mockReturnValue({ user: { id: "1" } });
    (prisma.like.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );
    const res = await POST(req, { params: { id: "1" } });
    expect(res.status).toBe(500);
    expect(res.body).toBeDefined();
  });
});

describe("GET /api/questions/[id]/like", () => {
  it("should return 200 and likes count", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/like", {
      method: "GET",
      headers: {
        "x-user-id": "1",
      },
    });

    (getServerSession as jest.Mock).mockReturnValue({ user: { id: "1" } });
    (prisma.like.count as jest.Mock).mockResolvedValue(1);
    (prisma.like.findUnique as jest.Mock).mockResolvedValue({ id: "1" });

    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it("should return 500 on database error", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/like", {
      method: "GET",
      headers: {
        "x-user-id": "1",
      },
    });
    (prisma.like.count as jest.Mock).mockRejectedValue(new Error("DB Error"));
    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(500);
    expect(res.body).toBeDefined();
  });
  it("should return user likes null and likes count 0", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/like", {
      method: "GET",
      headers: {},
    });
    (getServerSession as jest.Mock).mockReturnValue(null);
    (prisma.like.count as jest.Mock).mockResolvedValue(0);
    (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
