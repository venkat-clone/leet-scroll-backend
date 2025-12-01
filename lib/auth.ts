import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { firebaseAdmin } from "@/lib/firebase-admin";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) {
          return null;
        }

        try {
          const decodedToken = await firebaseAdmin
            .auth()
            .verifyIdToken(credentials.idToken);

          const { email, name, picture, uid } = decodedToken;

          if (!email) {
            return null;
          }

          // Upsert user in the database
          const user = await prisma.user.upsert({
            where: { email },
            update: {
              name: name || undefined,
              image: picture || undefined,
              emailVerified: new Date(),
            },
            create: {
              email,
              name: name || undefined,
              image: picture || undefined,
              emailVerified: new Date(),
              password: "", // No password for OAuth users
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("Firebase token verification failed:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;

        // Fetch latest score from DB to ensure it's up to date
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { score: true },
        });

        if (user) {
          session.user.score = user.score;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
};
