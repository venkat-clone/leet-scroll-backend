import { GET, DELETE, PUT } from "@/app/api/questions/[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import {
  initMockRole,
  initMockAdminRole,
  initMockUserRole,
} from "../mock.test";

// Mock dependencies
jest.mock("@/lib/prisma");
jest.mock("next-auth");
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("Questions API", () => {
  describe("GET", () => {
    it("should fetch a question by ID", async () => {
      const req = new Request("http://localhost/api/questions/1");

      const mockQuestion = { id: "1", title: "Q1" };

      (prisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);

      const res = await GET(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockQuestion);
      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should return 404 if question not found", async () => {
      const req = new Request("http://localhost/api/questions/1");

      (prisma.question.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Question not found");
    });

    it("should return 500 on database error", async () => {
      const req = new Request("http://localhost/api/questions/1");

      (prisma.question.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
      );

      const res = await GET(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch question");
    });
  });

  describe("PUT", () => {
    it("should update a question", async () => {
      const req = new Request("http://localhost/api/questions/1", {
        method: "PUT",
        body: JSON.stringify({
          title: "Q1",
          description: "Description",
          difficulty: "EASY",
          category: "Category",
          tags: ["tag1", "tag2"],
        }),
      });
      initMockAdminRole();
      const mockQuestion = { id: "1", title: "Q1" };

      (prisma.question.update as jest.Mock).mockResolvedValue(mockQuestion);

      const res = await PUT(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockQuestion);
      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: {
          title: "Q1",
          description: "Description",
          difficulty: "EASY",
          category: "Category",
          tags: ["tag1", "tag2"],
        },
      });
    });

    it("should return 500 on database error", async () => {
      const req = new Request("http://localhost/api/questions/1", {
        method: "PUT",
        body: JSON.stringify({
          title: "Q1",
          description: "Description",
          difficulty: "EASY",
          category: "Category",
          tags: ["tag1", "tag2"],
        }),
      });

      (prisma.question.update as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
      );

      const res = await PUT(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to update question");
    });

    it("should return 401 if user is not admin", async () => {
      const req = new Request("http://localhost/api/questions/1", {
        method: "PUT",
        body: JSON.stringify({
          title: "Q1",
          description: "Description",
          difficulty: "EASY",
          category: "Category",
          tags: ["tag1", "tag2"],
        }),
      });

      initMockUserRole();

      const res = await PUT(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("DELETE", () => {
    it("should delete a question", async () => {
      const req = new Request("http://localhost/api/questions/1", {
        method: "DELETE",
      });

      const mockQuestion = { id: "1", title: "Q1" };

      initMockAdminRole();
      (prisma.question.delete as jest.Mock).mockResolvedValue(mockQuestion);

      const res = await DELETE(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ message: "Question deleted successfully" });
      expect(prisma.question.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should return 500 on database error", async () => {
      const req = new Request("http://localhost/api/questions/1", {
        method: "DELETE",
      });
      initMockAdminRole();

      (prisma.question.delete as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
      );

      const res = await DELETE(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to delete question");
    });
    it("should return 401 if user is not admin", async () => {
      const req = new Request("http://localhost/api/questions/1", {
        method: "DELETE",
      });

      const mockQuestion = { id: "1", title: "Q1" };

      (prisma.question.delete as jest.Mock).mockResolvedValue(mockQuestion);

      initMockUserRole();
      const res = await DELETE(req, { params: { id: "1" } });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});
