import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 45000, // 45 seconds for Puppeteer tests
    hookTimeout: 60000, // 60 seconds for setup/teardown (browser launch can be slow)
  },
});
