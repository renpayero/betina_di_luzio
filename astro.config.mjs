import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: process.env.SITE_URL ?? 'https://betinadiluzio.com',
  trailingSlash: 'never',
  // CSRF: usamos nuestro check en src/lib/csrf.ts (compara hostnames, no
  // protocolo). El built-in de Astro compara contra url.origin que detrás
  // de un proxy HTTP→HTTPS termina siendo http:// y falla. Ver login.ts.
  security: { checkOrigin: false },
  prefetch: {
    defaultStrategy: 'viewport',
    prefetchAll: false,
  },
  compressHTML: true,
  env: {
    schema: {
      DATABASE_URL: envField.string({
        context: 'server',
        access: 'secret',
      }),
      WHATSAPP_NUMBER: envField.string({
        context: 'server',
        access: 'public',
        default: '5493413003417',
      }),
      SITE_URL: envField.string({
        context: 'server',
        access: 'public',
        default: 'https://betinadiluzio.com',
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: true,
    port: 4321,
  },
});
