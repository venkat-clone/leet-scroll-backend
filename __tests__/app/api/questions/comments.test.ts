import { GET, POST } from "@/app/api/questions/[id]/comments/route";
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

describe("GET /api/questions/[id]/comments", () => {
  it("should return 200 and comments", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/comments");
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it("should return 500 on database error", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/comments");
    (prisma.comment.findMany as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );
    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(500);
    expect(res.body).toBeDefined();
  });

  it("should return 401 if user is not authenticated", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/comments");
    (prisma.comment.findMany as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );
    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(500);
    expect(res.body).toBeDefined();
  });
});

describe("POST /api/questions/[id]/comments", () => {
  it("should return 200 and comments", async () => {
    const body = {
      content: "test",
    };
    const req = new Request("http://localhost:3000/api/questions/1/comments", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "x-user-id": "1",
      },
    });
    initMockUserRole();
    (prisma.comment.create as jest.Mock).mockResolvedValue(body);
    const res = await POST(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(body);
  });

  it("should return 500 on database error", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/comments");
    (prisma.comment.create as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );
    const res = await POST(req, { params: { id: "1" } });
    expect(res.status).toBe(500);
    expect(res.body).toBeDefined();
  });

  it("should return 400 if content is not provided", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/comments", {
      method: "POST",
      headers: {
        "x-user-id": "1",
      },
      body: JSON.stringify({}),
    });
    (prisma.comment.create as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );
    initMockUserRole();
    const res = await POST(req, { params: { id: "1" } });
    expect(res.status).toBe(400);
    expect(res.body).toBeDefined();
  });

  it("should return 401 if user is not authenticated", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/comments", {
      method: "POST",

      body: JSON.stringify({}),
    });

    (getServerSession as jest.Mock).mockReturnValue(null);
    (prisma.comment.create as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );
    const res = await POST(req, { params: { id: "1" } });
    expect(res.status).toBe(401);
    expect(res.body).toBeDefined();
  });
});
