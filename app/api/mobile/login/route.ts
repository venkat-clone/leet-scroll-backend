import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { sign } from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, idToken } = body;

    if (idToken) {
      // Firebase Auth Flow
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
        console.log("Decoded token:", decodedToken);
        const { email: tokenEmail, name, picture } = decodedToken;

        if (!tokenEmail) {
          return NextResponse.json(
            { error: "Invalid token: email not found" },
            { status: 400 },
          );
        }

        // Upsert user in the database
        const user = await prisma.user.upsert({
          where: { email: tokenEmail },
          update: {
            name: name || undefined,
            image: picture || undefined,
            emailVerified: new Date(),
          },
          create: {
            email: tokenEmail,
            name: name || undefined,
            image: picture || undefined,
            emailVerified: new Date(),
            password: "", // No password for OAuth users
          },
        });
        const apiToken = sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: "7d" },
        );
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            score: user.score,
            image: user.image,
          },
          // In a real app, you might issue a session token here (JWT)
          // For now, we return the user info, assuming the mobile app uses the ID token
          // or we can return a custom token if needed.
          token: apiToken, // Echoing back or issuing a new one
        });
      } catch (error) {
        console.error("Firebase token verification failed:", error);
        return NextResponse.json(
          { error: "Invalid ID token" },
          { status: 401 },
        );
      }
    }

    // Legacy Email/Password Flow
    if (!email || !password) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password || "", // Handle optional password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }
    const apiToken = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" },
    );
    // In a real app, we would issue a JWT here.
    // For this demo, we'll return the user info and a mock token.
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        score: user.score,
      },
      token: apiToken,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
