// @ts-check
require('dotenv').config(); // nạp biến từ file .env
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testIgnore: ['**/regression/**'], // regression chạy riêng qua playwright.regression.js
  timeout: 30000,         // mỗi test tối đa 30 giây
  retries: 1,             // tự retry 1 lần nếu fail (tránh flaky)
  reporter: [
    ['list'],             // hiện kết quả trực tiếp trong terminal
    ['html', { open: 'never', outputFolder: 'playwright-report' }], // HTML report
  ],
  use: {
    baseURL: 'https://app.promer.ai',
    headless: true,
    screenshot: 'only-on-failure', // chụp màn hình khi test fail
    video: 'retain-on-failure',    // quay video khi test fail
    trace: 'retain-on-failure',    // lưu trace khi test fail
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
