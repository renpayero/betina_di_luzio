import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/constants.ts';
import { getAllProductSlugs, getCategories } from '../lib/queries.ts';

const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;'
  );

const buildEntry = (
  path: string,
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly',
  priority: string,
  lastmod?: Date
): string => {
  const loc = escapeXml(`${SITE_URL}${path}`);
  const mod = lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${mod}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
};

export const GET: APIRoute = async () => {
  const [productSlugs, categories] = await Promise.all([
    getAllProductSlugs(),
    getCategories(),
  ]);

  const entries: string[] = [
    buildEntry('/', 'weekly', '1.0'),
    buildEntry('/tienda', 'daily', '0.9'),
    buildEntry('/nosotros', 'monthly', '0.6'),
    buildEntry('/cuidados', 'monthly', '0.5'),
    buildEntry('/contacto', 'monthly', '0.6'),
  ];

  for (const cat of categories) {
    entries.push(buildEntry(`/tienda?cat=${cat.id}`, 'weekly', '0.7'));
  }
  for (const p of productSlugs) {
    entries.push(buildEntry(`/producto/${p.slug}`, 'weekly', '0.8', p.updatedAt));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600',
    },
  });
};
