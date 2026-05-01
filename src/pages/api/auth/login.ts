import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client.ts';
import { users } from '../../../db/schema.ts';
import {
  SESSION_COOKIE,
  cookieOptions,
  createSession,
  verifyPassword,
} from '../../../lib/auth.ts';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_HITS = 5;
const buckets = new Map<string, number[]>();

const allowed = (ip: string): boolean => {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const recent = (buckets.get(ip) ?? []).filter((t) => t > cutoff);
  if (recent.length >= RATE_MAX_HITS) {
    buckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  buckets.set(ip, recent);
  return true;
};

const trim = (raw: FormDataEntryValue | null): string =>
  typeof raw === 'string' ? raw.trim() : '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const back = (url: URL, error: string): Response => {
  const next = url.searchParams.get('next');
  const qs = new URLSearchParams({ error });
  if (next) qs.set('next', next);
  return new Response(null, {
    status: 302,
    headers: { Location: `/login?${qs.toString()}` },
  });
};

const isSafeNext = (raw: string | null): string | null => {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  // Only same-origin absolute paths, never protocol/host/protocol-relative.
  if (!decoded.startsWith('/')) return null;
  if (decoded.startsWith('//')) return null;
  return decoded;
};

export const POST: APIRoute = async ({ request, clientAddress, cookies, url }) => {
  const ip = clientAddress ?? 'unknown';

  if (!allowed(ip)) {
    return back(url, 'Demasiados intentos. Probá en un minuto.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const email = trim(form.get('email')).toLowerCase();
  const password = trim(form.get('password'));

  if (!EMAIL_RE.test(email) || password.length < 6) {
    return back(url, 'Datos incompletos.');
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return back(url, 'Email o contraseña incorrectos.');
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return back(url, 'Email o contraseña incorrectos.');
  }

  const session = await createSession(user.id);
  const prod = import.meta.env.PROD;
  cookies.set(SESSION_COOKIE, session.id, cookieOptions(prod));

  const safeNext = isSafeNext(url.searchParams.get('next'));
  return new Response(null, {
    status: 302,
    headers: { Location: safeNext ?? '/admin' },
  });
};

export const GET: APIRoute = () =>
  new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  });
