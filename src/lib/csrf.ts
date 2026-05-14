/**
 * Defensa en profundidad CSRF: valida que el Origin (o Referer como fallback)
 * coincida con el Host. Las cookies HttpOnly + SameSite=Lax ya mitigan CSRF
 * en navegadores modernos; esto suma una validación de origen contra clientes
 * que ignoren SameSite.
 */
export const isSameOrigin = (request: Request): boolean => {
  const host = request.headers.get('host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const o = new URL(origin);
      return o.host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const r = new URL(referer);
      return r.host === host;
    } catch {
      return false;
    }
  }

  return false;
};
