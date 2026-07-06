import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { normalizeEmail } from './email';

export const authOptions: AuthOptions = {
  // Was 'jwk' (invalid NextAuth session strategy — only 'jwt' | 'database' are
  // supported). Fixed during the 2026-07-06 audit.
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Signup normalizes the email (strips +alias, removes Gmail dots)
        // before storing it, so login has to normalize the same way or
        // users who signed up with an alias/dotted address can never log
        // back in. Fixed during the 2026-07-06 audit.
        const normalized = normalizeEmail(credentials.email);
        const user = await prisma.user.findUnique({ where: { email: normalized } });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
};
