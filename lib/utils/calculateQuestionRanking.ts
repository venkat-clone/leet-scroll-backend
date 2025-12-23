import { Question, UserPreferences, Submission } from "@prisma/client";

/**
 * Calculates the personalized ranking score for a single question
 * based on your PostgreSQL CTE logic.
 *
 * @param question - The Question object from Prisma
 * @param userPrefs - The User's UserPreferences
 * @param submission - User's Submission for this question (or null)
 * @param dueThreshold - Date before which a question is considered "due" for review
 *                       (e.g., now minus your spaced repetition interval)
 * @returns The userRanking score (higher = better/more relevant)
 */
export function calculateQuestionRanking(
  question: Question,
  userPrefs: UserPreferences,
  submission: Submission,
  dueThreshold: Date = new Date(), // default: now
): number {
  // 1. Count how many of the question's tags match user's preferred topics
  const matchingTagsCount = question.tags.filter((tag) =>
    userPrefs.preferredTopics.includes(tag),
  ).length;

  // 2. Does the difficulty match any of the user's preferred difficulties?
  const difficultyMatches = userPrefs.preferredDifficulties.includes(
    question.difficulty,
  )
    ? 1
    : 0;

  // 3. Spaced repetition priority (exact match to your CASE statement)
  let priority: number;
  if (submission === null) {
    priority = 0; // Never seen → lowest priority
  } else if (submission.attempts > 2 && submission.correctAttempts === 0) {
    priority = 1; // Struggled a lot → high priority
  } else if (
    submission.isCorrect === true &&
    submission.lastShownAt !== null &&
    submission.lastShownAt < dueThreshold
  ) {
    priority = 2; // Correct, but due for review
  } else if (
    submission.lastShownAt !== null &&
    submission.lastShownAt < dueThreshold
  ) {
    priority = 3; // Incorrect or partial, due for review
  } else {
    priority = 4; // Recently seen → lowest priority
  }

  // 4. Final ranking score (same weights as SQL)
  const userRanking =
    matchingTagsCount * 3 + // Topic match is most important
    difficultyMatches * 2 + // Difficulty preference
    priority * 2; // Spaced repetition urgency

  return userRanking;
}
