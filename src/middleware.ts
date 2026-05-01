import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, getSession } from './lib/auth.ts';

export const onRequest = defineMiddleware(async (context, next) => {
  const cookie = context.cookies.get(SESSION_COOKIE);
  const sessionId = cookie?.value;

  if (sessionId) {
    const result = await getSession(sessionId);
    if (result) {
      context.locals.user = result.user;
      context.locals.session = result.session;
    } else {
      // expired/invalid → clean cookie
      context.cookies.delete(SESSION_COOKIE, { path: '/' });
    }
  }

  const { pathname } = context.url;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdmin = context.locals.user?.role === 'admin';

  if (isAdminRoute && !isAdmin) {
    const target = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/login?next=${target}`, 302);
  }

  if (pathname === '/login' && isAdmin) {
    return context.redirect('/admin', 302);
  }

  return next();
});
