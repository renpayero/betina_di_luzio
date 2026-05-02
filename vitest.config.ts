import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    environmentMatchGlobs: [
      ['tests/integration/**', 'node'],
      ['tests/unit/**', 'jsdom'],
    ],
    setupFiles: ['tests/unit/setup.ts'],
  },
});
