import { initMockAdminRole, initMockUserRole } from "../mock.test";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { POST } from "@/app/api/questions/bulk/route";

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/lib/prisma");

initMockUserRole();

describe("POST /api/questions/bulk", () => {
  it("should return 200 and questions created", async () => {
    const req = new Request("http://localhost:3000/api/questions/bulk", {
      method: "POST",
      headers: {
        "x-user-id": "1",
      },
      body: JSON.stringify({
        questions: [
          {
            title: "Question 1",
            description: "Description 1",
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctOption: "Option 1",
            explanation: "Explanation 1",
            difficulty: "EASY",
            category: "Category 1",
            tags: ["Tag 1", "Tag 2", "Tag 3"],
          },
        ],
      }),
    });
    initMockAdminRole();
    // (getServerSession as jest.Mock).mockReturnValue({ user: { id: "1" } });
    (prisma.question.createMany as jest.Mock).mockResolvedValue({ count: 1 });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ count: 1 });
  });

  it("should return 401 if user is not authenticated", async () => {
    const req = new Request("http://localhost:3000/api/questions/bulk", {
      method: "POST",
      headers: {},
      body: JSON.stringify({
        questions: [
          {
            title: "Question 1",
            description: "Description 1",
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctOption: "Option 1",
            explanation: "Explanation 1",
            difficulty: "EASY",
            category: "Category 1",
            tags: ["Tag 1", "Tag 2", "Tag 3"],
          },
        ],
      }),
    });
    (getServerSession as jest.Mock).mockReturnValue(null);
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(res.body).toBeDefined();
  });
  it("should return 500 on database error", async () => {
    const req = new Request("http://localhost:3000/api/questions/bulk", {
      method: "POST",
      headers: {
        "x-user-id": "1",
      },
      body: JSON.stringify({
        questions: [
          {
            title: "Question 1",
            description: "Description 1",
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctOption: "Option 1",
            explanation: "Explanation 1",
            difficulty: "EASY",
            category: "Category 1",
            tags: ["Tag 1", "Tag 2", "Tag 3"],
          },
        ],
      }),
    });
    initMockAdminRole();
    (prisma.question.createMany as jest.Mock).mockRejectedValue(
      new Error("DB Error")
    );
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(res.body).toBeDefined();
  });
  it("should return 400 on invalid input", async () => {
    const req = new Request("http://localhost:3000/api/questions/bulk", {
      method: "POST",
      headers: {
        "x-user-id": "1",
      },
      body: JSON.stringify({}),
    });
    initMockAdminRole();

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(res.body).toBeDefined();
  });
});
