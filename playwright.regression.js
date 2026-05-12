// @ts-check
require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/regression',
  timeout: 20000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/regression' }],
    // Khi chạy trên CI (GitHub Actions), xuất thêm JSON để workflow đọc tóm tắt
    ...(process.env.CI ? [['json', { outputFile: 'test-results.json' }]] : []),
  ],
  use: {
    baseURL: 'https://app.promer.ai',
    headless: true,
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    trace:      'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
