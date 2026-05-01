import type { APIRoute } from 'astro';

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

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init?.headers ?? {}),
    },
  });

const ALLOWED_TYPES = new Set([
  'Consulta general',
  'Pedido a medida',
  'Regalo',
  'Mayorista / tiendas',
]);

const trim = (raw: FormDataEntryValue | null): string =>
  typeof raw === 'string' ? raw.trim() : '';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress ?? 'unknown';

  if (!allowed(ip)) {
    return json(
      { error: 'Demasiados envíos. Probá de nuevo en un minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Formato inválido.' }, { status: 400 });
  }

  const name = trim(form.get('name'));
  const contact = trim(form.get('contact'));
  const type = trim(form.get('type'));
  const message = trim(form.get('message'));

  const errors: Record<string, string> = {};
  if (name.length < 2 || name.length > 100) errors.name = 'Nombre inválido.';
  if (contact.length < 3 || contact.length > 200)
    errors.contact = 'Indicanos email o WhatsApp.';
  if (!ALLOWED_TYPES.has(type)) errors.type = 'Tipo inválido.';
  if (message.length < 10 || message.length > 2000)
    errors.message = 'Mensaje muy corto o muy largo.';

  if (Object.keys(errors).length) {
    return json({ error: 'Datos incompletos.', fields: errors }, { status: 400 });
  }

  console.log('[contact]', {
    ts: new Date().toISOString(),
    ip,
    name,
    contact,
    type,
    preview: message.slice(0, 80),
  });

  return json({ ok: true });
};

export const GET: APIRoute = () =>
  json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'POST' } });
