import type { Product } from '../db/schema.ts';
import { BRAND, SITE_URL, SOCIAL, absoluteUrl } from './constants.ts';

export type JsonLd = Record<string, unknown>;

export const organizationLd = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND.name,
  url: SITE_URL,
  description: BRAND.description,
  foundingDate: String(BRAND.founded),
  address: {
    '@type': 'PostalAddress',
    addressLocality: BRAND.city,
    addressRegion: BRAND.region,
    addressCountry: BRAND.countryCode,
  },
  sameAs: [SOCIAL.instagramUrl, SOCIAL.facebookUrl],
});

export const websiteLd = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND.name,
  url: SITE_URL,
  inLanguage: 'es-AR',
});

export const productLd = (
  product: Product,
  categoryName: string
): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  sku: product.id,
  category: categoryName,
  brand: { '@type': 'Brand', name: BRAND.name },
  offers: {
    '@type': 'Offer',
    url: absoluteUrl(`/producto/${product.slug}`),
    priceCurrency: 'ARS',
    price: String(product.price),
    availability:
      product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    seller: { '@type': 'Organization', name: BRAND.name },
    itemCondition: 'https://schema.org/NewCondition',
  },
});

export const breadcrumbLd = (
  trail: Array<{ name: string; url: string }>
): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.url),
  })),
});
