import { authenticated } from "@/lib/authenticatedHandler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const GET = authenticated(async (res: NextRequest, userId: string) => {
  // return today's streak info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActivityDate: true,
    },
  });

  // gets last 3 months streak data
  const last3Months = await prisma.dailyActivity.findMany({
    where: {
      userId,
      date: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      },
    },
    select: {
      id: true,
      date: true,
      totalAttempts: true,
      totalCorrect: true,
      totalSkips: true,
    },
    orderBy: { date: "asc" },
  });

  const todayActivity = await prisma.dailyActivity.findUnique({
    where: {
      userId_date: {
        userId,
        date: new Date(new Date().toDateString()),
      },
    },
  });

  return Response.json({
    ...user,
    dailyActivities: last3Months,
    todayActivity,
    lastActivityDate: user?.lastActivityDate
      ? user.lastActivityDate.toISOString().split("T")[0]
      : null,
  });
});
