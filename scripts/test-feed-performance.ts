import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface PerformanceMetrics {
  userId: string;
  queryTime: number;
  planningTime: number;
  executionTime: number;
  totalRows: number;
  explain: string;
}

// Test with different user profiles
const TEST_USERS = [
  "test-user-1", // First user
  "test-user-25", // Mid-range user
  "test-user-50", // Middle user
  "test-user-75", // Another mid-range
  "test-user-100", // Last user
];

const NUM_ITERATIONS = 5; // Run each query multiple times

async function loadFeedQuery(): Promise<string> {
  const queryPath = join(process.cwd(), "prisma", "feed.pgsql");
  return readFileSync(queryPath, "utf-8");
}

async function runExplainAnalyze(
  userId: string,
): Promise<{ explain: string; planningTime: number; executionTime: number }> {
  const query = await loadFeedQuery();

  // Add EXPLAIN ANALYZE prefix
  const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON) ${query}`;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Execute EXPLAIN ANALYZE
    const result = await prisma.$queryRawUnsafe<
      Array<{ "QUERY PLAN": Array<Record<string, unknown>> }>
    >(
      explainQuery,
      userId,
      sevenDaysAgo,
      null, // cursor (no pagination for first page)
      null, // id for tie-breaking
      10,
    );

    const plan = result[0]["QUERY PLAN"][0];
    const planningTime = (plan["Planning Time"] as number) || 0;
    const executionTime = (plan["Execution Time"] as number) || 0;

    return {
      explain: JSON.stringify(plan, null, 2),
      planningTime,
      executionTime,
    };
  } catch (error) {
    console.error(`Error running EXPLAIN ANALYZE:`, error);
    throw error;
  }
}

async function runActualQuery(
  userId: string,
): Promise<{ rows: number; time: number }> {
  const query = await loadFeedQuery();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const start = Date.now();
  const result = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    query,
    userId,
    sevenDaysAgo,
    null,
    null,
    10,
  );
  const elapsed = Date.now() - start;

  return {
    rows: result.length,
    time: elapsed,
  };
}

async function testUserQuery(userId: string): Promise<PerformanceMetrics[]> {
  console.log(`\n📊 Testing query for ${userId}...`);

  const metrics: PerformanceMetrics[] = [];

  for (let i = 0; i < NUM_ITERATIONS; i++) {
    // Run actual query
    const { rows, time } = await runActualQuery(userId);

    // Run EXPLAIN ANALYZE (only on first iteration to avoid clutter)
    let explain = "";
    let planningTime = 0;
    let executionTime = 0;

    if (i === 0) {
      const explainResult = await runExplainAnalyze(userId);
      explain = explainResult.explain;
      planningTime = explainResult.planningTime;
      executionTime = explainResult.executionTime;
    }

    metrics.push({
      userId,
      queryTime: time,
      planningTime,
      executionTime,
      totalRows: rows,
      explain,
    });

    console.log(`  Iteration ${i + 1}: ${time}ms (${rows} rows)`);
  }

  return metrics;
}

function calculateStats(metrics: PerformanceMetrics[]) {
  const queryTimes = metrics.map((m) => m.queryTime);
  const avg = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
  const min = Math.min(...queryTimes);
  const max = Math.max(...queryTimes);

  // Get planning/execution time from first iteration
  const firstMetric = metrics[0];

  return {
    avg: avg.toFixed(2),
    min,
    max,
    planningTime: firstMetric.planningTime.toFixed(2),
    executionTime: firstMetric.executionTime.toFixed(2),
    totalRows: firstMetric.totalRows,
  };
}

function analyzeExplainPlan(explain: string): string[] {
  const insights: string[] = [];

  try {
    const plan = JSON.parse(explain);

    // Check for sequential scans
    const planStr = JSON.stringify(plan);
    if (planStr.includes("Seq Scan")) {
      insights.push("⚠️  Sequential scans detected - consider adding indices");
    }

    // Check for index usage
    if (planStr.includes("Index Scan") || planStr.includes("Index Only Scan")) {
      insights.push("✓ Index scans found - good!");
    }

    // Check for nested loops
    if (planStr.includes("Nested Loop")) {
      insights.push("ℹ️  Nested loops present - common for joins");
    }

    // Check for hash joins
    if (planStr.includes("Hash Join")) {
      insights.push("✓ Hash joins used - efficient for large datasets");
    }

    // Check actual rows vs estimated
    if (plan.Plan) {
      const actualRows = plan.Plan["Actual Rows"] || 0;
      const planRows = plan.Plan["Plan Rows"] || 0;
      const ratio = actualRows / (planRows || 1);

      if (ratio > 10 || ratio < 0.1) {
        insights.push(
          `⚠️  Row estimation mismatch: estimated ${planRows}, actual ${actualRows}`,
        );
      }
    }
  } catch {
    insights.push("❌ Could not parse EXPLAIN plan");
  }

  return insights;
}

async function main() {
  console.log("🚀 Starting Feed Query Performance Test\n");
  console.log("Configuration:");
  console.log(`  - Test users: ${TEST_USERS.length}`);
  console.log(`  - Iterations per user: ${NUM_ITERATIONS}`);
  console.log("");

  const allMetrics: PerformanceMetrics[] = [];

  try {
    // Test each user
    for (const userId of TEST_USERS) {
      const userMetrics = await testUserQuery(userId);
      allMetrics.push(...userMetrics);
    }

    console.log("\n\n" + "=".repeat(80));
    console.log("📈 PERFORMANCE SUMMARY");
    console.log("=".repeat(80) + "\n");

    // Group by user and calculate stats
    for (const userId of TEST_USERS) {
      const userMetrics = allMetrics.filter((m) => m.userId === userId);
      const stats = calculateStats(userMetrics);

      console.log(`\n${userId}:`);
      console.log(
        `  Query Time:     avg=${stats.avg}ms, min=${stats.min}ms, max=${stats.max}ms`,
      );
      console.log(`  Planning Time:  ${stats.planningTime}ms`);
      console.log(`  Execution Time: ${stats.executionTime}ms`);
      console.log(`  Rows Returned:  ${stats.totalRows}`);
    }

    // Overall statistics
    const overallStats = calculateStats(allMetrics);
    console.log("\n" + "-".repeat(80));
    console.log("OVERALL STATISTICS:");
    console.log(`  Average Query Time: ${overallStats.avg}ms`);
    console.log(`  Min Query Time:     ${overallStats.min}ms`);
    console.log(`  Max Query Time:     ${overallStats.max}ms`);
    console.log("-".repeat(80));

    // Analyze first EXPLAIN plan
    const firstExplain =
      allMetrics.find((m) => m.explain !== "")?.explain || "";
    if (firstExplain) {
      console.log("\n\n" + "=".repeat(80));
      console.log("🔍 QUERY PLAN ANALYSIS");
      console.log("=".repeat(80) + "\n");

      const insights = analyzeExplainPlan(firstExplain);
      insights.forEach((insight) => console.log(`  ${insight}`));

      console.log("\n📄 Full EXPLAIN ANALYZE output (first query):");
      console.log(firstExplain);
    }

    // Recommendations
    console.log("\n\n" + "=".repeat(80));
    console.log("💡 RECOMMENDATIONS");
    console.log("=".repeat(80) + "\n");

    const avgTime = parseFloat(overallStats.avg);

    if (avgTime < 50) {
      console.log(
        "  ✅ Excellent performance! Query is fast enough for production.",
      );
    } else if (avgTime < 100) {
      console.log("  ✓ Good performance. Consider monitoring in production.");
    } else if (avgTime < 200) {
      console.log("  ⚠️  Moderate performance. Consider adding indices:");
      console.log("     - GIN index on Question.tags for array operations");
      console.log("     - Composite index on Submission (userId, questionId)");
      console.log("     - Indices on View, Like, Comment for aggregations");
    } else {
      console.log("  ❌ Poor performance. Urgent optimization needed:");
      console.log("     1. Add database indices (see EXPLAIN ANALYZE output)");
      console.log("     2. Consider denormalizing aggregate counts");
      console.log(
        "     3. Review query structure for optimization opportunities",
      );
    }

    console.log("\n\nNext steps:");
    console.log("  1. Review the EXPLAIN ANALYZE output above");
    console.log(
      "  2. If needed, update prisma/schema.prisma with @@index directives",
    );
    console.log("  3. Run: npx prisma migrate dev");
    console.log("  4. Re-run this test to measure improvement");
    console.log("  5. Clean up test data: npm run test:cleanup\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
