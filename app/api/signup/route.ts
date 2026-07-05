import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/email';

const signupSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function POST(req: Request) {
    let body: unknown;
    try {
          body = await req.json();
    } catch {
          return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

  const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

  // Normalize email to block + aliases and Gmail dot tricks
  const normalized = normalizeEmail(email);

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
          return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

  const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
          data: { name, email: normalized, passwordHash },
    });

  return NextResponse.json({ id: user.id, email: user.email });
}
