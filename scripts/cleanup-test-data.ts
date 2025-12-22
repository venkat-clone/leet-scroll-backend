import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log("🧹 Cleaning up test data...\n");

  try {
    // Delete in reverse order of foreign key dependencies

    console.log("Deleting user attempts...");
    const userAttempts = await prisma.userAttempt.deleteMany({
      where: { userId: { startsWith: "test-user-" } },
    });
    console.log(`  ✓ Deleted ${userAttempts.count} user attempts`);

    console.log("Deleting comments...");
    const comments = await prisma.comment.deleteMany({
      where: { userId: { startsWith: "test-user-" } },
    });
    console.log(`  ✓ Deleted ${comments.count} comments`);

    console.log("Deleting likes...");
    const likes = await prisma.like.deleteMany({
      where: { userId: { startsWith: "test-user-" } },
    });
    console.log(`  ✓ Deleted ${likes.count} likes`);

    console.log("Deleting views...");
    const views = await prisma.view.deleteMany({
      where: { userId: { startsWith: "test-user-" } },
    });
    console.log(`  ✓ Deleted ${views.count} views`);

    console.log("Deleting submissions...");
    const submissions = await prisma.submission.deleteMany({
      where: { userId: { startsWith: "test-user-" } },
    });
    console.log(`  ✓ Deleted ${submissions.count} submissions`);

    console.log("Deleting questions...");
    const questions = await prisma.question.deleteMany({
      where: { id: { startsWith: "test-question-" } },
    });
    console.log(`  ✓ Deleted ${questions.count} questions`);

    console.log("Deleting user preferences...");
    const preferences = await prisma.userPreferences.deleteMany({
      where: { userId: { startsWith: "test-user-" } },
    });
    console.log(`  ✓ Deleted ${preferences.count} user preferences`);

    console.log("Deleting users...");
    const users = await prisma.user.deleteMany({
      where: { id: { startsWith: "test-user-" } },
    });
    console.log(`  ✓ Deleted ${users.count} users`);

    console.log("\n✅ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
