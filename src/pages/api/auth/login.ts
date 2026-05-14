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
import { isSameOrigin } from '../../../lib/csrf.ts';
import { createRateLimit } from '../../../lib/rate-limit.ts';

const limiter = createRateLimit('auth:login', 5);

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
  if (!isSameOrigin(request)) {
    return new Response('Forbidden', { status: 403 });
  }

  const ip = clientAddress ?? 'unknown';

  if (!limiter.allow(ip)) {
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

  if (!EMAIL_RE.test(email) || password.length < 8) {
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

  const remember = form.get('remember');
  const remembers = remember === 'on' || remember === 'true' || remember === '1';
  if (remembers) {
    cookies.set('bdl_remember_email', email, {
      httpOnly: true,
      sameSite: 'lax',
      secure: prod,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    cookies.delete('bdl_remember_email', { path: '/' });
  }

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
