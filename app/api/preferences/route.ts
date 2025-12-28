// app/api/some-route/route.ts
import { authenticated } from "@/lib/authenticatedHandler";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = authenticated(
  async (request: NextRequest, userId: string) => {
    const userPreferences = await prisma.userPreferences.findUnique({
      where: {
        userId,
      },
    });

    return Response.json({ userPreferences });
  },
);

export const POST = authenticated(
  async (request: NextRequest, userId: string) => {
    const {
      interestedTopics,
      preferredTopics,
      preferredDifficulties,
      preferredLanguages,
    } = await request.json();
    const userPreferences = await prisma.userPreferences.upsert({
      where: {
        userId,
      },
      update: {
        userId,
        interestedTopics,
        preferredTopics,
        preferredDifficulties,
        preferredLanguages,
      },

      create: {
        userId,
        interestedTopics,
        preferredTopics,
        preferredDifficulties,
      },
    });
    return Response.json({ userPreferences });
  },
);

export const PATCH = authenticated(
  async (request: NextRequest, userId: string) => {
    const {
      interestedTopics,
      preferredTopics,
      preferredDifficulties,
      preferredLanguages,
    } = await request.json();
    const userPreferences = await prisma.userPreferences.update({
      where: {
        userId,
      },
      data: {
        interestedTopics,
        preferredTopics,
        preferredDifficulties,
        preferredLanguages,
      },
    });
    return Response.json({ userPreferences });
  },
);
