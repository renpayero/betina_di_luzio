import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/constants.ts';

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /carrito

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
