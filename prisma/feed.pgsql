WITH user_prefs AS (
  SELECT 
    COALESCE(up."preferredTopics", ARRAY[]::text[]) AS topics,
    COALESCE(up."interestedTopics", ARRAY[]::text[]) AS interestedTopics,
    COALESCE(up."preferredDifficulties", ARRAY[]::"Difficulty"[]) AS difficulties
  FROM "UserPreferences" up
  WHERE up."user_id" = $1  -- userId
),
ranked_questions AS (
  SELECT 
    q.id,
    q.title,
    q.description,
    q.options,
    q.difficulty,
    q.category,
    q.tags,
    q."correctOption",
    q."codeSnippet",
    
    COALESCE(s.attempts, 0) AS "userAttempts",
    COALESCE(s."correctAttempts", 0) AS "userCorrectAttempts",
    s."isCorrect" AS "userLastCorrect",
    s."last_shown_at" AS "userLastShownAt",
    
    (SELECT COUNT(*)::INTEGER FROM "View" v WHERE v."questionId" = q.id) AS "viewsCount",
    (SELECT COUNT(*)::INTEGER FROM "Like" l WHERE l."questionId" = q.id) AS "likesCount",
    (SELECT COUNT(*)::INTEGER FROM "Comment" c WHERE c."questionId" = q.id) AS "commentsCount",

    -- Matching topics count
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM unnest(p.topics) AS t
      WHERE t = ANY(q.tags)
    ), 0) AS "matchingTagsCount",
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM unnest(p.interestedTopics) AS t
      WHERE t = ANY(q.tags)
    ), 0) AS "interestedTagsCount",

    -- Difficulty matches?
    (q.difficulty = ANY(p.difficulties)) AS "difficultyMatches",

    -- Priority for spaced repetition
    CASE
      WHEN s.id IS NULL THEN 4
      WHEN s.attempts > 2 AND s."correctAttempts" = 0 THEN 3
      WHEN s."isCorrect" = true AND s."last_shown_at" < $2 THEN 2
      WHEN s."last_shown_at" < $2 THEN 1
      ELSE 0
    END AS priority,

    -- Final ranking score
    (
      COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM unnest(p.topics) AS t
        WHERE t = ANY(q.tags)
      ), 0) * 3
      + COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM unnest(p.interestedTopics) AS t
        WHERE t = ANY(q.tags)
      ), 0) * 2
      + (q.difficulty = ANY(p.difficulties))::int * 2
      + CASE
          WHEN s.id IS NULL THEN 4
          WHEN s.attempts > 2 AND s."correctAttempts" = 0 THEN 3
          WHEN s."isCorrect" = true AND s."last_shown_at" < $2 THEN 2
          WHEN s."last_shown_at" < $2 THEN 1
          ELSE 0
        END 
    ) AS "userRanking"

  FROM "Question" q
  CROSS JOIN user_prefs p
  LEFT JOIN "Submission" s 
    ON q.id = s."questionId" 
    AND s."userId" = $1
)

-- Outer query: apply cursor pagination using the computed userRanking
SELECT *
FROM ranked_questions

ORDER BY 
  "userRanking" DESC,
  "userLastShownAt" ASC,
  id ASC
LIMIT $5 ;  -- limit (e.g. 10)