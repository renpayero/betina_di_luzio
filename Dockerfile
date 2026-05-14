# ════════════════════════════════════════════════════════════════
#  Betina Di Luzio — multi-stage build (Astro 5 SSR + Drizzle)
# ════════════════════════════════════════════════════════════════

# ──── Stage 1: deps + build ─────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

# Astro Node standalone → dist/server/entry.mjs + dist/client/
RUN npm run build

# ──── Stage 2: runtime ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

RUN apk add --no-cache libc6-compat \
 && addgroup -g 1001 -S nodejs \
 && adduser  -S astro -u 1001

# Build output + assets + dependencias completas
# (drizzle-kit + tsx se usan para el push de schema al arrancar; no hay
# pruning estilo Next standalone para Astro, así que copiamos node_modules
# tal cual viene del builder).
COPY --from=builder --chown=astro:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=astro:nodejs /app/dist ./dist
COPY --from=builder --chown=astro:nodejs /app/public ./public
COPY --from=builder --chown=astro:nodejs /app/package.json ./package.json
COPY --from=builder --chown=astro:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=astro:nodejs /app/src/db ./src/db

# El dir de uploads se monta como volumen; lo creamos owned por el user
RUN mkdir -p /app/public/uploads && chown -R astro:nodejs /app/public/uploads

USER astro

EXPOSE 4321

# Al arrancar:
#   1. drizzle-kit push → sincroniza el schema (crea tablas si no existen)
#   2. node dist/server/entry.mjs → arranca Astro en standalone mode
CMD ["sh", "-c", "npx drizzle-kit push --force && node ./dist/server/entry.mjs"]
