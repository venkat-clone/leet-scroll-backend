import { GET } from "@/app/api/questions/[id]/meta/route";
import { initMockUserRole } from "../mock.test";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

const TEN_MINUTES_MS = 10 * 60 * 1000;

jest.mock("@/lib/prisma");
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
initMockUserRole();
describe("GET /api/questions/[id]/meta", () => {
  it("should return 200 and question meta", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/meta", {
      method: "GET",
      headers: {
        "x-user-id": "1",
      },
    });
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: "1" } });
    (prisma.question.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      _count: {
        like: 1,
        view: 1,
      },
    });
    (prisma.view.findFirst as jest.Mock).mockResolvedValue({
      createdAt: new Date(Date.now() - TEN_MINUTES_MS * 2),
    });
    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      like: 1,
      view: 1,
      viewedJustNow: false,
    });
  });
  it("should return 200 and question meta and viewedJustNow true", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/meta", {
      method: "GET",
      headers: {
        "x-user-id": "1",
      },
    });
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: "1" } });
    (prisma.question.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      _count: {
        like: 1,
        view: 1,
      },
    });
    (prisma.view.findFirst as jest.Mock).mockResolvedValue({
      createdAt: new Date(Date.now() - TEN_MINUTES_MS * 0.5),
    });
    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      like: 1,
      view: 1,
      viewedJustNow: true,
    });
  });

  it("should return 404 if question not found", async () => {
    const req = new Request("http://localhost:3000/api/questions/1/meta", {
      method: "GET",
      headers: {
        "x-user-id": "1",
      },
    });
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: "1" } });
    (prisma.question.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(req, { params: { id: "1" } });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: "Question not found",
    });
  });
});
