import { POST } from "@/app/api/mobile/login/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { firebaseAdmin } from "@/lib/firebase-admin";

jest.mock("@/lib/prisma");
jest.mock("@/lib/firebase-admin", () => ({
  firebaseAdmin: {
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn(),
    }),
  },
}));

describe("POST /api/mobile/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Legacy Email/Password Tests
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
      new Error("DB Error"),
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

  it("should return 401 on user not found", async () => {
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

  // Firebase Auth Tests
  it("should authenticate with valid Firebase ID token", async () => {
    const req = new Request("http://localhost/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({
        idToken: "valid-token",
      }),
    });

    const mockDecodedToken = {
      email: "firebase@example.com",
      name: "Firebase User",
      picture: "http://example.com/pic.jpg",
      uid: "firebase-uid",
    };

    const mockUser = {
      id: "firebase-user-id",
      email: "firebase@example.com",
      name: "Firebase User",
      role: "USER",
      score: 0,
      image: "http://example.com/pic.jpg",
    };

    (firebaseAdmin.auth().verifyIdToken as jest.Mock).mockResolvedValue(
      mockDecodedToken,
    );
    (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.email).toBe("firebase@example.com");
    expect(data.token).toBe("valid-token");
  });

  it("should return 400 if token has no email", async () => {
    const req = new Request("http://localhost/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({
        idToken: "no-email-token",
      }),
    });

    (firebaseAdmin.auth().verifyIdToken as jest.Mock).mockResolvedValue({
      uid: "some-uid",
      // no email
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid token: email not found");
  });

  it("should return 401 if token verification fails", async () => {
    const req = new Request("http://localhost/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({
        idToken: "invalid-token",
      }),
    });

    (firebaseAdmin.auth().verifyIdToken as jest.Mock).mockRejectedValue(
      new Error("Invalid token"),
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Invalid ID token");
  });
});
