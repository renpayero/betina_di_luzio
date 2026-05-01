import { SITE_URL as ENV_SITE_URL, WHATSAPP_NUMBER as ENV_WA } from 'astro:env/server';

export const SITE_URL = ENV_SITE_URL;
export const WHATSAPP_NUMBER = ENV_WA;

export const BRAND = {
  name: 'Betina Di Luzio',
  shortName: 'Betina',
  tagline: 'Tejidos artesanales · Rosario · Desde 2011',
  description:
    'Tejidos artesanales en crochet y dos agujas — hechos a mano en Rosario desde 2011.',
  email: 'hola@betinadiluzio.com',
  city: 'Rosario',
  region: 'Santa Fe',
  country: 'Argentina',
  countryCode: 'AR',
  founded: 2011,
  locale: 'es_AR',
} as const;

export const SOCIAL = {
  instagramUrl: 'https://www.instagram.com/betina_di_luzio',
  instagramHandle: '@betina_di_luzio',
  facebookUrl: 'https://facebook.com/betinadiluzio',
} as const;

const formatWhatsappForDisplay = (raw: string): string => {
  if (raw.length !== 13) return raw;
  return `+${raw.slice(0, 2)} ${raw.slice(2, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 9)}-${raw.slice(9)}`;
};

export const WHATSAPP_DISPLAY = formatWhatsappForDisplay(WHATSAPP_NUMBER);

export const waLink = (text?: string): string => {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};

export const absoluteUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return new URL(path, SITE_URL).href;
};
