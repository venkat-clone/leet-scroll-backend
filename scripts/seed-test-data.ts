import { PrismaClient, Difficulty } from "@prisma/client";

const prisma = new PrismaClient();

// Test data configuration
const CONFIG = {
  NUM_USERS: 100,
  NUM_QUESTIONS: 10000,
  TAGS_PER_QUESTION_MIN: 20,
  TAGS_PER_QUESTION_MAX: 30,
  BATCH_SIZE: 500, // Insert in batches for performance
};

// Available tags pool
const AVAILABLE_TAGS = [
  "array",
  "string",
  "hash-table",
  "dynamic-programming",
  "math",
  "sorting",
  "greedy",
  "depth-first-search",
  "breadth-first-search",
  "binary-search",
  "tree",
  "matrix",
  "two-pointers",
  "bit-manipulation",
  "stack",
  "heap",
  "graph",
  "simulation",
  "backtracking",
  "sliding-window",
  "linked-list",
  "design",
  "counting",
  "binary-tree",
  "recursion",
  "memoization",
  "shortest-path",
  "union-find",
  "trie",
  "divide-and-conquer",
  "queue",
  "prefix-sum",
  "topological-sort",
  "monotonic-stack",
  "game-theory",
  "combinatorics",
  "segment-tree",
  "binary-indexed-tree",
  "rolling-hash",
  "suffix-array",
  "quickSelect",
  "bucket-sort",
  "radix-sort",
  "merge-sort",
];

const CATEGORIES = [
  "arrays",
  "strings",
  "linked-lists",
  "stacks-queues",
  "hash-tables",
  "trees",
  "graphs",
  "dynamic-programming",
  "sorting",
  "searching",
];

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSample<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateRandomTags(): string[] {
  const count = randomInt(
    CONFIG.TAGS_PER_QUESTION_MIN,
    CONFIG.TAGS_PER_QUESTION_MAX,
  );
  return randomSample(AVAILABLE_TAGS, count);
}

function generateCodeSnippet(): string | null {
  // 50% chance of having a code snippet
  if (Math.random() < 0.5) return null;

  const snippets = [
    "def solution(nums):\n    # Your code here\n    pass",
    "function solve(arr) {\n    // Your code here\n}",
    "class Solution:\n    def solve(self, n):\n        pass",
    "var solution = function(s) {\n    // Implementation\n};",
  ];

  return randomChoice(snippets);
}

async function seedUsers() {
  console.log(`🌱 Seeding ${CONFIG.NUM_USERS} users...`);

  const users = [];
  for (let i = 1; i <= CONFIG.NUM_USERS; i++) {
    users.push({
      id: `test-user-${i}`,
      email: `testuser${i}@example.com`,
      name: `Test User ${i}`,
      password: "$2a$10$dummyhashfortest", // Dummy bcrypt hash
    });
  }

  // Insert in batches
  for (let i = 0; i < users.length; i += CONFIG.BATCH_SIZE) {
    const batch = users.slice(i, i + CONFIG.BATCH_SIZE);
    await prisma.user.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(
      `  ✓ Created users ${i + 1}-${Math.min(i + CONFIG.BATCH_SIZE, users.length)}`,
    );
  }

  console.log(`✅ Created ${CONFIG.NUM_USERS} users\n`);
  return users.map((u) => u.id);
}

async function seedUserPreferences(userIds: string[]) {
  console.log(`🌱 Seeding user preferences...`);

  const preferences = userIds.map((userId) => ({
    userId,
    preferredDifficulties: randomSample(DIFFICULTIES, randomInt(1, 3)),
    preferredTopics: randomSample(AVAILABLE_TAGS, randomInt(3, 10)),
    feedSize: 10,
    preferredLanguages: randomSample(
      ["javascript", "python", "java", "cpp"],
      randomInt(1, 2),
    ),
  }));

  for (let i = 0; i < preferences.length; i += CONFIG.BATCH_SIZE) {
    const batch = preferences.slice(i, i + CONFIG.BATCH_SIZE);
    await prisma.userPreferences.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log(`✅ Created ${preferences.length} user preferences\n`);
}

async function seedQuestions() {
  console.log(`🌱 Seeding ${CONFIG.NUM_QUESTIONS} questions...`);

  const questions = [];
  for (let i = 1; i <= CONFIG.NUM_QUESTIONS; i++) {
    const difficulty = randomChoice(DIFFICULTIES);
    const category = randomChoice(CATEGORIES);
    const tags = generateRandomTags();

    questions.push({
      id: `test-question-${i}`,
      title: `Test Question ${i}`,
      description: `This is a test question ${i} for performance testing. It includes various tags and metadata.`,
      options: {
        A: "Option A",
        B: "Option B",
        C: "Option C",
        D: "Option D",
      },
      correctOption: randomInt(0, 3),
      explanation: `Explanation for test question ${i}`,
      difficulty,
      category,
      tags,
      codeSnippet: generateCodeSnippet(),
    });
  }

  // Insert in batches
  for (let i = 0; i < questions.length; i += CONFIG.BATCH_SIZE) {
    const batch = questions.slice(i, i + CONFIG.BATCH_SIZE);
    await prisma.question.createMany({
      data: batch,
      skipDuplicates: true,
    });

    const progress = (
      ((i + batch.length) / CONFIG.NUM_QUESTIONS) *
      100
    ).toFixed(1);
    console.log(
      `  ✓ Created questions ${i + 1}-${i + batch.length} (${progress}%)`,
    );
  }

  console.log(`✅ Created ${CONFIG.NUM_QUESTIONS} questions\n`);
  return questions.map((q) => q.id);
}

async function seedSubmissions(userIds: string[], questionIds: string[]) {
  console.log(`🌱 Seeding submissions (sparse data)...`);

  // Create submissions for ~10% of user-question pairs (sparse data)
  const submissions: Array<{
    userId: string;
    questionId: string;
    attempts: number;
    correctAttempts: number;
    isCorrect: boolean;
    lastShownAt: Date;
    submittedAt: Date;
  }> = [];
  const targetSubmissions = Math.floor(
    userIds.length * questionIds.length * 0.001,
  ); // 0.1%

  for (let i = 0; i < targetSubmissions; i++) {
    const userId = randomChoice(userIds);
    const questionId = randomChoice(questionIds);
    const attempts = randomInt(1, 5);
    const correctAttempts = randomInt(0, attempts);
    const isCorrect = correctAttempts > 0;

    // Create unique key to avoid duplicates
    const key = `${userId}-${questionId}`;
    if (submissions.some((s) => `${s.userId}-${s.questionId}` === key)) {
      continue;
    }

    const lastShownAt = new Date(
      Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000,
    ); // Random date in last 30 days

    submissions.push({
      userId,
      questionId,
      attempts,
      correctAttempts,
      isCorrect,
      lastShownAt,
      submittedAt: lastShownAt,
    });
  }

  // Insert in batches
  for (let i = 0; i < submissions.length; i += CONFIG.BATCH_SIZE) {
    const batch = submissions.slice(i, i + CONFIG.BATCH_SIZE);
    await prisma.submission.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log(`✅ Created ${submissions.length} submissions\n`);
}

async function seedEngagementData(userIds: string[], questionIds: string[]) {
  console.log(`🌱 Seeding engagement data (views, likes, comments)...`);

  // Views
  const views = [];
  for (let i = 0; i < 5000; i++) {
    views.push({
      userId: randomChoice(userIds),
      questionId: randomChoice(questionIds),
    });
  }
  await prisma.view.createMany({ data: views, skipDuplicates: true });
  console.log(`  ✓ Created ~${views.length} views`);

  // Likes
  const likes: Array<{ userId: string; questionId: string }> = [];
  for (let i = 0; i < 3000; i++) {
    const userId = randomChoice(userIds);
    const questionId = randomChoice(questionIds);
    const key = `${userId}-${questionId}`;
    if (likes.some((l) => `${l.userId}-${l.questionId}` === key)) continue;

    likes.push({ userId, questionId });
  }
  await prisma.like.createMany({ data: likes, skipDuplicates: true });
  console.log(`  ✓ Created ~${likes.length} likes`);

  // Comments
  const comments = [];
  for (let i = 0; i < 2000; i++) {
    comments.push({
      userId: randomChoice(userIds),
      questionId: randomChoice(questionIds),
      content: `Test comment ${i}`,
    });
  }
  await prisma.comment.createMany({ data: comments });
  console.log(`  ✓ Created ~${comments.length} comments`);

  console.log(`✅ Engagement data created\n`);
}

async function main() {
  console.log("🚀 Starting performance test data seeding...\n");
  console.log("Configuration:");
  console.log(`  - Users: ${CONFIG.NUM_USERS}`);
  console.log(`  - Questions: ${CONFIG.NUM_QUESTIONS}`);
  console.log(
    `  - Tags per question: ${CONFIG.TAGS_PER_QUESTION_MIN}-${CONFIG.TAGS_PER_QUESTION_MAX}`,
  );
  console.log("\n");

  const startTime = Date.now();

  try {
    const userIds = await seedUsers();
    await seedUserPreferences(userIds);
    const questionIds = await seedQuestions();
    await seedSubmissions(userIds, questionIds);
    await seedEngagementData(userIds, questionIds);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Seeding completed successfully in ${elapsed}s!`);
    console.log("\nNext steps:");
    console.log("  1. Run: npm run test:performance");
    console.log("  2. Review the performance metrics");
    console.log("  3. Clean up: npm run test:cleanup");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
