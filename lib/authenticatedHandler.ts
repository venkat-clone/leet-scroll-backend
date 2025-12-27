// lib/authenticatedHandler.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // your auth config
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

type Handler<T = any> = (
  request: NextRequest,
  userId: string,
) => Promise<Response> | Response;

export function authenticated(handler: Handler) {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      return handler(request, userId);
    } catch (error) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
