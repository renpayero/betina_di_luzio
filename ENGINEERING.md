# Manual de Ingeniería · Betina Di Luzio

Documento vivo. Define **cómo construimos** este sitio: principios, estándares, arquitectura, y el audit del estado actual con la deuda técnica priorizada. Cualquier cambio futuro debe alinearse acá; si la realidad fuerza una excepción, se actualiza el documento, no se ignora.

---

## 1. Filosofía

Siete principios — en orden de prioridad cuando entran en conflicto.

1. **El servidor renderiza, el cliente refina.** SSR por defecto. JS solo cuando aporta interacción real (carrito, filtros). Cero JS para mostrar contenido estático.
2. **Lento por fuera, rápido por dentro.** El diseño es slow fashion editorial; la *plataforma* es rápida. LCP < 1.8 s, INP < 200 ms, CLS < 0.1 son no-negociables.
3. **Tipado de extremo a extremo.** TypeScript strict + `noUncheckedIndexedAccess`. El compilador es el primer test. Sin `any` salvo bridge a APIs sin tipos, marcado con `// TODO(types)`.
4. **Accesible por defecto, no como retoque.** WCAG 2.2 AA es el piso, no el techo. Nada de `cursor: none` global, nada de `outline: 0` sin reemplazo, nada de animación que no respete `prefers-reduced-motion`.
5. **El esquema es la verdad.** El modelo de dominio vive en Postgres y en `src/db/schema.ts`. Todo lo demás (tipos, validaciones, queries) deriva de ahí. Nunca duplicar tipos a mano.
6. **Una capa, una responsabilidad.** DB → repository → composición. Las páginas no abren conexiones, no validan negocio, no formatean números — sólo orquestan.
7. **Reversibilidad sobre cleverness.** Preferir 50 líneas predecibles a 10 abstractas. El código que va a leer Lili (la dueña, no técnica) es el código que tiene que ser obvio.

---

## 2. Stack y por qué

| Capa | Decisión | Justificación |
|---|---|---|
| Framework | **Astro 5 SSR** (`output: 'server'`) | Server-first, islands para interactividad puntual, View Transitions nativas, sin overhead de un framework SPA cuando 90 % es estático. |
| Adapter | **`@astrojs/node` standalone** | Portable, deploy a cualquier VPS o contenedor. Behind reverse proxy (nginx/Cloudflare) en prod para TLS + compresión. |
| Base de datos | **Postgres 16** (Docker en dev) | Estándar industrial, arrays nativos para colors/sizes, full-text si lo necesitamos en Phase 2. Versión LTS. |
| ORM | **Drizzle** | TypeScript-first, queries SQL-like sin magia, migraciones reversibles. Mejor DX que Prisma para Astro SSR. |
| Estilos | **Tailwind v4 (utility) + CSS custom (design system)** | Tailwind para layout/spacing utilities. Tokens del diseño (paleta, tipografía) viven en CSS variables — nunca en clases. |
| Cliente JS | **Vanilla TS, sin framework** | El cursor, los filtros y el carrito no justifican React/Vue. ~15 KB de JS bundleado total vs +90 KB de React. |
| Tipos compartidos | **`drizzle-zod`** (Phase 2) | Cuando llegue el form de admin: una sola fuente para schema → Zod → form validation. |

**Lo que NO usamos y por qué:**
- React/Vue/Svelte: overhead injustificado para este nivel de interactividad.
- tRPC: SSR de Astro ya es type-safe end-to-end sin un canal RPC.
- Prisma: Drizzle es más liviano y SQL-explícito.
- ESM-only DB clients raros (postgres.js): `pg` + `pg.Pool` está battle-tested.

---

## 3. Arquitectura por capas

```
src/
├── db/                  ← Capa 1: persistencia
│   ├── schema.ts        ← Única fuente de verdad del modelo
│   ├── client.ts        ← Pool de conexiones (singleton via globalThis)
│   └── seed.ts          ← Datos iniciales
├── lib/                 ← Capa 2: dominio
│   ├── queries.ts       ← Repository: única capa que toca db
│   ├── constants.ts     ← URLs, contacto, brand
│   ├── format.ts        ← fmtARS, calcDiscount
│   ├── colors.ts        ← Mapping hex → nombre
│   ├── cart.ts          ← Carrito en localStorage
│   └── seo.ts           ← Helpers de meta tags
├── scripts/             ← Capa 3: side-effects de cliente
│   ├── cursor.ts        ← Yarn cursor (opt-in, idempotent)
│   └── reveal.ts        ← Reveal-on-scroll, nav scroll, counters
├── components/          ← Capa 4: UI atómica
├── layouts/BaseLayout   ← Composición de chrome
├── pages/               ← Capa 5: rutas (componen, no implementan negocio)
└── styles/global.css    ← Design tokens, base styles
```

**Reglas de dependencia (importa en una sola dirección):**
- `pages` puede importar de cualquier capa más arriba.
- `lib/queries.ts` es la **única** que importa `db/`.
- `components` no importan de `db/`. Reciben datos vía props.
- `lib/*` no importa de `components`.
- `scripts/` solo se ejecuta en browser; nunca importado en frontmatter SSR.

**Si una página tiene más de 30 líneas de lógica en frontmatter** → extraer a `lib/queries.ts` o a un componente.

---

## 4. Standards de código

- **Indentación:** 2 espacios, sin tabs.
- **Quotes:** simples para JS/TS, dobles para HTML/JSX attributes.
- **Imports:** terceros → internos `~/...` → relativos. Sin `import * as`.
- **Naming:**
  - Componentes: `PascalCase.astro`
  - Páginas: `kebab-case.astro` (Astro convention)
  - Scripts/lib: `camelCase.ts` para utilities, `kebab-case.ts` para data
  - CSS variables: `--kebab-case` con prefijo de familia (`--terracota-500`, `--ink-soft`)
- **Funciones:** verbo en imperativo (`getProducts`, no `productsGetter`).
- **Booleans:** prefijo `is/has/should` (`isFeatured`, `hasOldPrice`).
- **Comentarios:** sólo cuando el *por qué* no es obvio. Nunca *qué hace*.
- **Console:** `console.log` sólo en `seed.ts`. En runtime, nada (lint regla en Phase 2).

---

## 5. Performance budget

Targets medidos en una run de Lighthouse mobile, throttling Fast 4G, Moto G4.

| Métrica | Target | Hard cap |
|---|---|---|
| LCP | 1.8 s | 2.5 s |
| INP | < 200 ms | < 500 ms |
| CLS | < 0.05 | < 0.1 |
| TTFB | < 600 ms | < 1.2 s |
| JS shipped (gzipped, total per page) | 60 KB | 100 KB |
| CSS (gzipped) | 18 KB | 30 KB |
| Fonts (total) | 80 KB (variable) | 120 KB |
| Lighthouse Performance | 95+ | 90 |
| Lighthouse A11y | 100 | 95 |
| Lighthouse Best Practices | 100 | 95 |
| Lighthouse SEO | 100 | 95 |

**Si un cambio rompe alguno de estos límites**, se entrega con un *waiver* documentado en este archivo, no se ignora.

**Cómo lo logramos:**
- Fonts self-hosted con `font-display: swap`, preload del weight crítico.
- CSS critical: Astro inlines pequeño automáticamente. No agregar `<link>` blocking.
- JS: islands solo donde hace falta; nunca `client:load` cuando alcanza `client:visible`.
- Imágenes: `astro:assets` con `<Image />` cuando lleguen las fotos reales — formato `avif/webp`, `loading="lazy"` excepto LCP.
- Connection pool reutilizado entre requests via `globalThis.__betinaPool`.
- Prefetch viewport: links visibles se prefetchean.

---

## 6. Accesibilidad (WCAG 2.2 AA, baseline)

**No-negociables:**
1. Skip-link al `<main>` como primer elemento focuseable.
2. `:focus-visible` con outline visible (mínimo 2px, alto contraste). Nunca `outline: 0` sin reemplazo.
3. `prefers-reduced-motion: reduce` desactiva: yarn cursor, reveals, parallax, marquee, page transitions extensas.
4. Contraste mínimo AA: 4.5:1 texto normal, 3:1 texto grande/UI. La paleta terracota sobre crema cumple; ojo con `--ink-mute` sobre `--bg-warm`.
5. Semántica HTML5: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`. ARIA solo cuando HTML no alcanza.
6. Imágenes con `alt` significativo. `alt=""` solo para decoración pura.
7. Forms: `<label>` asociado, `aria-invalid` al error, `aria-describedby` para hints.
8. Keyboard: todo lo que se hace con click se hace con `Enter` y `Space`. `Tab` order natural.
9. `cursor: none` es **opt-in** (clase `.has-yarn-cursor` en `<body>` solo cuando JS confirma capacidad y el user no pidió reduced-motion).

**Auditoría continua:** axe DevTools + Lighthouse en cada PR significativo. Phase 2: Pa11y CI.

---

## 7. SEO baseline

- `<title>` único por página, formato `Sección · Betina Di Luzio` (excepto home).
- `<meta name="description">` único, 150–160 caracteres.
- `<link rel="canonical">` siempre.
- Open Graph + Twitter Cards en cada página.
- **Schema.org structured data**:
  - `Organization` en home y footer.
  - `Product` + `Offer` en `/producto/[slug]`.
  - `BreadcrumbList` en producto y categorías filtradas.
  - `WebSite` + `SearchAction` en home (Phase 2 si agregamos search).
- `sitemap.xml` dinámico (incluye productos por slug).
- `robots.txt` con `Sitemap:` y bloqueo de `/api/`, `/login`.
- `lang="es"` en `<html>`, `hreflang` cuando agreguemos otros idiomas.

---

## 8. Seguridad

**Baseline.** No es un sitio bancario, pero la higiene es la misma.

- **Secrets**: `DATABASE_URL` y similares vía `astro:env/server` con `access: 'secret'`. Nunca en client bundle, nunca en `PUBLIC_*`.
- **Inputs**: todo lo que viene del cliente (form, query param) se valida con Zod en el server. Nunca confiar en lo enviado por el browser.
- **SQL injection**: Drizzle parametriza por defecto. Nunca concatenar strings en queries. Si `sql\`...\`` raw, solo con valores literales.
- **XSS**: Astro escapa por defecto. `set:html` se usa SOLO para contenido controlado (el `<br/>` de placeholders). Nunca para input de usuario.
- **Rate limiting**: endpoints `/api/*` con limit por IP (Phase 2: Redis o similar).
- **Headers** (en reverse proxy):
  - `Content-Security-Policy` ajustado a fonts/img-src.
  - `Strict-Transport-Security`.
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
- **Auth (Phase 2)**: cookies httpOnly + SameSite=Lax. Sesiones server-side. Argon2id para password hash. Nunca JWT en localStorage.

---

## 9. Testing strategy

- **Hoy**: smoke test manual con curl en cada deploy. `astro check` bloquea merges con type errors.
- **Phase 2**:
  - **Vitest** para utilities puras (`fmtARS`, `calcDiscount`, `cart`).
  - **Playwright** para E2E del happy path (browse → carrito → WhatsApp link).
  - **Pa11y CI** para a11y regressions.
- **Phase 3**: visual regression con Percy o Chromatic si el diseño se vuelve volátil.

No escribimos tests para componentes presentacionales puros — el esfuerzo no compensa para este tamaño de equipo.

---

## 10. Audit del estado actual

Recorrida sección por sección. ✅ = OK, ⚠️ = mejorable, ❌ = rompe principio.

### `BaseLayout.astro`
- ✅ `ClientRouter` con fallback `swap`.
- ✅ Scripts cargados como módulos vía import (no inline).
- ⚠️ Fonts cargadas desde Google Fonts (request externo bloqueante). → migrar a self-host (Fontsource).
- ❌ Sin skip-link.
- ❌ Sin componente SEO (cada página gestiona meta a mano o no las gestiona).
- ⚠️ Favicon inline en data-URI feo. → favicon.svg en `/public`.

### `Nav.astro`
- ✅ `aria-current="page"`, `transition:persist`.
- ❌ Sin menú móvil — en < 900 px las links desaparecen sin reemplazo.
- ⚠️ Botón search sin handler. → quitar hasta Phase 2.
- ⚠️ Cart badge se actualiza por DOM query; mejor evento custom desde `cart.ts`.

### `Footer.astro`
- ✅ Estructura semántica correcta.
- ⚠️ WhatsApp number duplicado (footer + WhatsappFloat + páginas). → `lib/constants.ts`.
- ⚠️ SVG inline grandes (500+ chars cada uno). → `<svg>` sprite o componente Icon.

### `ProductCard.astro`
- ✅ Markup limpio, accessible.
- ⚠️ Botón `fav` no persiste estado (no hay lib favoritos aún).
- ⚠️ Listener global de click se monta cada `astro:page-load`, sin idempotencia clara. → fix.

### `tienda.astro`
- ✅ Filtros vía URL params (shareable, SSR-friendly).
- ✅ `Promise.all` en queries iniciales.
- ❌ `getCategoryCounts` hace `SELECT *` y cuenta en JS — debe ser `GROUP BY`.
- ⚠️ Selector "ordenar por" hace submit completo del form → recarga de página. View Transition lo suaviza, pero podríamos `pushState` + re-fetch.
- ⚠️ Filtros de "Color" y "Talle" decorativos (no filtran nada).

### `producto/[slug].astro`
- ✅ SSR con datos reales del DB.
- ✅ Breadcrumb, related products con fallback.
- ⚠️ Galería de 4 thumbs es fake (mismo placeholder, distinto label). → conectar a futura tabla `product_images`.
- ⚠️ Add-to-cart muta texto del botón con `innerHTML`, recreando DOM. → toggle clase + ARIA live.

### `carrito.astro`
- ⚠️ Render 100 % en JS. SSR del shell vacío y CSR del contenido — funciona, pero rompe el patrón "server first".
- ⚠️ Si `localStorage` tiene JSON corrupto, la página queda vacía sin error visible.

### `index.astro`
- ✅ Featured products desde DB.
- ⚠️ Hero `yarn-svg` con 4 paths animados con `Element.animate()` — corre siempre. Debería pausar fuera de viewport.
- ⚠️ `initCounters` usa `setInterval` (drift). → `requestAnimationFrame`.

### `nosotros.astro` / `cuidados.astro` / `contacto.astro` / `login.astro`
- ✅ Estáticos, simples.
- ❌ Form de contacto hace `event.preventDefault()` y muta texto del botón — no envía nada. → endpoint real `/api/contact`.
- ❌ Login no tiene backend — es OK como Phase 2, pero el botón debe decirlo claramente.

### `scripts/cursor.ts`
- ❌ `requestAnimationFrame` corre infinito incluso con tab oculta.
- ❌ `MutationObserver` re-corre `querySelectorAll` con cada mutación del DOM (hover-scale en cards lo dispara).
- ❌ No respeta `prefers-reduced-motion`.
- ⚠️ Variable global `mounted` evita doble init pero no permite teardown.

### `scripts/reveal.ts`
- ✅ `IntersectionObserver` correcto.
- ⚠️ `initCounters` con `setInterval` 22 ms — drift y overhead. → `requestAnimationFrame` con easing.

### `lib/cart.ts`
- ❌ Asigna `window.BDLCart = cart` y `declare global { Window }`. Innecesario; las páginas que lo necesitan importan directo.
- ❌ `updateBadge` hace `querySelectorAll('.cart-count')` en lugar de despachar evento.
- ❌ Sin sync entre pestañas (no escucha `storage` event).

### `lib/queries.ts`
- ✅ Repository pattern, bien tipado.
- ❌ `getCategoryCounts` ya señalado.
- ⚠️ Sin manejo de errores; si la DB cae, la página explota con stack trace. → error boundary en page-level.

### `db/schema.ts`
- ✅ Schema correcto.
- ❌ Sin índices en columnas filtradas (`category_id`, `price`, `is_featured`, `status`). En 12 productos no se nota; en 1.000 sí.

### `styles/global.css`
- ❌ `body { cursor: none }` por defecto — debe ser opt-in.
- ❌ Sin `@media (prefers-reduced-motion)`.
- ❌ Sin `:focus-visible` styles globales.
- ⚠️ Mezcla design tokens con component styles (Nav, Footer, ProductCard). → mover styles componente-específicos a sus `.astro`.

### `astro.config.mjs`
- ✅ SSR + Node + Tailwind v4.
- ❌ Sin `prefetch.defaultStrategy`.
- ❌ Sin `image.service` configurado (cuando lleguen imágenes reales).
- ⚠️ Sin `experimental.fonts` ni Fontsource.

### Archivos faltantes
- ❌ `404.astro`.
- ❌ `sitemap.xml.ts`.
- ❌ `robots.txt.ts`.
- ❌ `/api/contact.ts` (endpoint real).
- ❌ Componente `<SEO />`.
- ❌ `lib/constants.ts`.

---

## 11. Roadmap

Tres olas. Cada una entrega valor independiente y se puede shipear sola.

### Tier 1 — fundamentos (este sprint)
**Objetivo:** Lighthouse 95+ en a11y/SEO/Best Practices, sin tocar el diseño visual.

- [x] Documentar principios (este archivo).
- [ ] `lib/constants.ts` + `astro:env` schema con `WHATSAPP_NUMBER`, `SITE_URL`, `DATABASE_URL`.
- [ ] `<SEO />` component + `sitemap.xml.ts` + `robots.txt.ts` + Schema.org en producto/home.
- [ ] `404.astro`.
- [ ] Skip-link, `:focus-visible`, `prefers-reduced-motion`, cursor opt-in.
- [ ] Cart sin `window` mutation + sync `storage` event.
- [ ] `getCategoryCounts` con `GROUP BY`.
- [ ] Índices DB en `category_id`, `price`, `is_featured`, `status`.
- [ ] `astro.config`: `prefetch.defaultStrategy: 'viewport'`.

### Tier 2 — performance (siguiente)
**Objetivo:** LCP < 1.8 s, JS < 60 KB.

- [ ] Fonts self-hosted con `@fontsource-variable/*` + preload del weight crítico.
- [ ] `<picture>`/`<Image />` cuando lleguen las fotos reales.
- [ ] Endpoint `/api/contact` con Zod + rate limit naive (memory) → upgrade a Redis cuando haya tráfico.
- [ ] `cursor.ts`: pause con `document.hidden`, throttle `MutationObserver`, opt-in.
- [ ] `initCounters` con `rAF` + easing.
- [ ] Cache headers: `Cache-Control` SWR para páginas de producto, `no-store` para `/carrito`.

### Tier 3 — admin & contenido (Phase 2)
**Objetivo:** Lili gestiona el catálogo sin tocar código.

- [ ] Auth con cookies httpOnly + Argon2id.
- [ ] CRUD productos / categorías / cupones / stock.
- [ ] Tabla `product_images` + upload a object storage (S3 / R2).
- [ ] Dashboard de KPIs (carritos abandonados con fingerprint en localStorage).
- [ ] Tests Vitest + Playwright.
- [ ] CI con GitHub Actions: typecheck + smoke test.

### Tier 4 — extras (cuando haga falta)
- [ ] Search con Postgres FTS.
- [ ] i18n (EN para clientela internacional).
- [ ] PWA: offline browsing del catálogo.
- [ ] Web Push para notificar nuevas piezas a suscriptos.

---

## 12. Cómo trabajamos

- **Una tarea = un commit** con mensaje en imperativo.
- **PR self-review**: leer tu propio diff antes de mergear. Si tarda > 5 min entender, partir el PR.
- **Branches**: `tier-1/seo-baseline`, `fix/cursor-visibility`, etc.
- **Decisión arquitectónica relevante** → actualizar este archivo en el mismo PR.
- **Antes de agregar dependencia**: justificar en la descripción del PR. Si pesa > 10 KB gzipped, doble check.

---

## 13. Glosario

- **Tier**: ola de trabajo. Tier 1 = ahora, Tier 2 = después, etc.
- **Slow fashion**: cliente. La estética y el ritmo de compra son lentos; la plataforma no.
- **Lili**: la dueña, no técnica. Cualquier sistema de admin debe ser usable por ella sin intermediario.
- **Repository (capa)**: aquí, `lib/queries.ts`. Único lugar que toca DB.
