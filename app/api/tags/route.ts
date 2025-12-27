import { authenticated } from "@/lib/authenticatedHandler";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const GET = authenticated(
  async (request: NextRequest, userId: string) => {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 15;

    const userPreferences = await prisma.userPreferences.findUnique({
      where: {
        userId,
      },
    });

    const excludedTags = userPreferences?.preferredTopics || [];
    // const excludedTags = [];
    console.log("excludedTags", excludedTags);
    // non User tags do not appear in the user tags
    const result = await prisma.$queryRaw<Array<{ tag: string }>>`
SELECT DISTINCT tag
    FROM (
      SELECT UNNEST(tags) AS tag
      FROM "Question"
      WHERE (${search} = '' 
         OR EXISTS (
           SELECT 1
           FROM UNNEST(tags) AS t
           WHERE t ILIKE '%' || ${search} || '%'
         )
      )
    ) AS expanded
    WHERE LOWER(tag) NOT IN (${Prisma.join(excludedTags.length ? excludedTags.map((tag) => tag.toLowerCase()) : ["__nonexistent__"])})
    ORDER BY tag
    LIMIT ${limit}
    OFFSET ${limit * (page - 1)}
`;

    const tags = result.map((item) => item.tag);

    return Response.json(tags);
  },
);
