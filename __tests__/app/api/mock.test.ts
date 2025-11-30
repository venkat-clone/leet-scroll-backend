import { getServerSession } from "next-auth";

jest.mock("next-auth");

export function initMockUserRole(user: any = {}) {
  initMockRole({ role: "USER", ...user });
}

export function initMockAdminRole(user: any = {}) {
  initMockRole({ role: "ADMIN", ...user });
}

export function initMockRole(user: any = {}) {
  (getServerSession as jest.Mock).mockReturnValue({
    user: {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: " USER",
      score: 0,
      ...user,
    },
  });
}

describe("Smoke tests", () => {
  it("should return 200", async () => {
    initMockRole();
    const session = await getServerSession();
    expect(session).toStrictEqual({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: " USER",
        score: 0,
      },
    });
  });
});
