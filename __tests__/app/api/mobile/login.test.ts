import { POST } from "@/app/api/mobile/login/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

jest.mock("@/lib/prisma");

describe("POST /api/mobile/login", () => {
  it("should return 200 and user data on successful login", async () => {
    const hashedPassword = await bcrypt.hash("password", 10);

    const req = new Request("http://localhost/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password",
      }),
    });

    const mockUser = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      password: hashedPassword,
      role: "USER",
      score: 0,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        score: 0,
      },
      token: "mock-jwt-token-1",
    });
  });

  it("should return 401 on invalid credentials", async () => {
    const req = new Request("http://localhost/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrong-password",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Invalid credentials");
  });

  it("should return 500 on database error", async () => {
    const req = new Request("http://localhost/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password",
      }),
    });

    (prisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB Error")
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should return 400 on invalid request", async () => {
    const req = new Request("http://localhost/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid request");
  });

  it("should return 401 on invalid credentials", async () => {
    const req = new Request("http://localhost/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password",
      }),
    });

    (prisma.user.findUnique as jest.Mock).mockReturnValueOnce(null);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Invalid credentials");
  });
});
