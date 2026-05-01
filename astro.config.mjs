import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: process.env.SITE_URL ?? 'https://betinadiluzio.com',
  trailingSlash: 'never',
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
