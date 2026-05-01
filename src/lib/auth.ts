import { hash, verify } from '@node-rs/argon2';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { sessions, users } from '../db/schema.ts';
import type { Session, User } from '../db/schema.ts';

export const SESSION_COOKIE = 'bdl_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

// Argon2id = enum value 2 in @node-rs/argon2.
// Using literal avoids `verbatimModuleSyntax` const-enum import error.
const ARGON2ID = 2 as const;

const argonOptions = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export const cookieOptions = (
  prod: boolean
): {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number;
} => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: prod,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
});

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, argonOptions);
}

export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  try {
    return await verify(stored, plain, argonOptions);
  } catch {
    return false;
  }
}

export async function createSession(
  userId: string
): Promise<{ id: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const [row] = await db
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning({ id: sessions.id, expiresAt: sessions.expiresAt });
  if (!row) throw new Error('Failed to create session');
  return { id: row.id, expiresAt: row.expiresAt };
}

export async function getSession(
  sessionId: string
): Promise<{ user: User; session: Session } | null> {
  const now = new Date();
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    // GC: if there's an expired session under that id, drop it.
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }
  return { user: row.user, session: row.session };
}

export async function destroySession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
