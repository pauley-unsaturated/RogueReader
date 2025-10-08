import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 45000, // 45 seconds for Puppeteer tests
    hookTimeout: 60000, // 60 seconds for setup/teardown (browser launch can be slow)
  },
});
