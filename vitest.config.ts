import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 seconds for Puppeteer tests
    hookTimeout: 30000, // 30 seconds for setup/teardown
  },
});
