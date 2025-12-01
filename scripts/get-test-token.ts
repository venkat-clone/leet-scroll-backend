import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";

// Helper to load env vars from .env file
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, "utf-8");
      envConfig.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          process.env[key.trim()] = value.trim().replace(/^"|"$/g, "");
        }
      });
    }
  } catch (e) {
    console.error("Error loading .env:", e);
  }
}

loadEnv();

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const SERVICE_ACCOUNT = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (
  !FIREBASE_API_KEY ||
  !SERVICE_ACCOUNT.projectId ||
  !SERVICE_ACCOUNT.clientEmail ||
  !SERVICE_ACCOUNT.privateKey
) {
  console.error(
    "Missing environment variables. Please ensure .env is set up correctly with Firebase credentials.",
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT),
  });
}

const TEST_EMAIL = "testuser@example.com";
const TEST_PASSWORD = "TestPassword123!";

async function main() {
  try {
    // 1. Create or Get User
    let uid;
    try {
      const userRecord = await admin.auth().getUserByEmail(TEST_EMAIL);
      uid = userRecord.uid;
      console.log(`User ${TEST_EMAIL} already exists. UID: ${uid}`);
      // Update password to ensure we know it
      await admin.auth().updateUser(uid, { password: TEST_PASSWORD });
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        const userRecord = await admin.auth().createUser({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          displayName: "Test User",
        });
        uid = userRecord.uid;
        console.log(`Created new user ${TEST_EMAIL}. UID: ${uid}`);
      } else {
        throw error;
      }
    }

    // 2. Sign In to get ID Token (using REST API)
    console.log("Signing in to get ID Token...");
    const signInResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          returnSecureToken: true,
        }),
      },
    );

    const data = await signInResponse.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log("\n=== SUCCESS ===");
    console.log("ID Token:");
    console.log(data.idToken);
    console.log("\nUse this token for testing /api/mobile/login");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
