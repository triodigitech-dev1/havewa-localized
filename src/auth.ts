import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { skipCSRFCheck } from "@auth/core";
import { prisma } from "@/lib/prisma";
import { oidcConfigFromEnv, resolveSsoUser } from "@/lib/sso";

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (creds) => {
      const email = String(creds?.email ?? "").trim().toLowerCase();
      const password = String(creds?.password ?? "");
      if (!email || !password) return null;
      let user = await prisma.user.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
        },
      });
      if (!user) {
        user = await prisma.user.findUnique({ where: { email } });
      }
      if (!user) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        locale: user.locale || "en",
      };
    },
  }),
];

// Optional Google OAuth Provider
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

// Optional OIDC/SSO Provider
const oidc = oidcConfigFromEnv();
if (oidc) providers.push(oidc as unknown as Provider);

export const { handlers, auth, signIn, signOut } = NextAuth({
  skipCSRFCheck,
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "localea-auth-secret-session-key-2026",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: {
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "oidc") {
        return !!(await resolveSsoUser(user?.email));
      }

      // Google Sign-in: strictly a social link/connection to an existing registered account
      // You cannot sign in with Google unless your email is already registered in Localea
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase().trim();
        if (!email) {
          console.warn("[auth] Google sign-in rejected: missing email in Google profile");
          return false;
        }

        let local = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        if (!local) {
          local = await prisma.user.findUnique({ where: { email } });
        }

        if (!local) {
          console.warn(
            `[auth] Google sign-in rejected: No registered account found for ${email}. Google login is only available as a link to existing accounts.`
          );
          return false;
        }

        return true;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Credentials flow
      if (user && account?.provider !== "oidc" && account?.provider !== "google") {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.locale = user.locale;
      }

      // Google Auth user resolution - linked to registered account
      if (account?.provider === "google" && user?.email) {
        const email = user.email.toLowerCase().trim();
        let local = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        if (!local) {
          local = await prisma.user.findUnique({ where: { email } });
        }
        if (local) {
          token.sub = local.id;
          token.role = local.role;
          token.tenantId = local.tenantId;
          token.locale = local.locale;
        }
      }

      // OIDC resolution
      if (account?.provider === "oidc" && user?.email) {
        const local = await resolveSsoUser(user.email);
        if (local) {
          token.sub = local.id;
          token.role = local.role;
          token.tenantId = local.tenantId;
          token.locale = local.locale;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.tenantId = token.tenantId as string;
        session.user.locale = token.locale as string;
      }
      return session;
    },
  },
});
