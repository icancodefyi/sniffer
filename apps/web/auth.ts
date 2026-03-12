import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import clientPromise from "@/lib/mongodb";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: "snifferX" }),
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        secure: process.env.EMAIL_SERVER_PORT === "465",
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? "noreply@snifferlabs.com",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: "database",
  },
});
