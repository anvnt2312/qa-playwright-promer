// @ts-check
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// ─── 1. NẠP ENV FILE THEO MÔI TRƯỜNG ────────────────────────────────────────
//
// Cách dùng:
//   TEST_ENV=local   npx playwright test   → nạp .env.local
//   TEST_ENV=staging npx playwright test   → nạp .env.staging
//   (mặc định)       npx playwright test   → nạp .env (production)
//
// Cơ chế cascade: nạp env-specific trước, sau đó nạp .env để điền
// các giá trị còn thiếu. dotenv KHÔNG ghi đè biến đã tồn tại.
const TEST_ENV = process.env.TEST_ENV ?? 'production';
const envFile  = path.resolve(__dirname, `.env.${TEST_ENV}`);

dotenv.config({ path: envFile }); // ưu tiên: .env.local / .env.staging / .env.production
dotenv.config();                  // fallback: .env (điền giá trị còn thiếu)

// ─── 2. HELPER ĐỌC BIẾN MÔI TRƯỜNG ─────────────────────────────────────────

/** Đọc số nguyên từ env, trả về fallback nếu không có */
function envNum(key: string, fallback: number): number {
  const val = process.env[key];
  return val !== undefined ? parseInt(val, 10) : fallback;
}

/** Đọc boolean từ env ('true'/'false'), trả về fallback nếu không có */
function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  return val !== undefined ? val === 'true' : fallback;
}

// ─── 3. LOG MÔI TRƯỜNG ĐANG CHẠY (tiện debug) ───────────────────────────────
console.log(`\n▶ TEST_ENV: ${TEST_ENV} | BASE_URL: ${process.env.BASE_URL ?? '(dùng mặc định)'}\n`);

// =============================================================================
// PLAYWRIGHT CONFIG
// =============================================================================

export default defineConfig({

  // ── Thư mục chứa test file ─────────────────────────────────────────────────
  testDir: './tests',

  // Bỏ qua regression suite — chạy riêng bằng playwright.regression.js
  testIgnore: ['**/regression/**'],

  // ── Timeout ───────────────────────────────────────────────────────────────
  // Mỗi test tối đa bao nhiêu ms trước khi bị đánh dấu timeout
  // Biến: TEST_TIMEOUT | local: 60s (debug chậm), CI/prod: 30s
  timeout: envNum('TEST_TIMEOUT', 30_000),

  // Timeout riêng cho các câu expect(locator).toBeVisible() v.v.
  expect: {
    timeout: envNum('EXPECT_TIMEOUT', 5_000),
  },

  // ── Retry khi fail ────────────────────────────────────────────────────────
  // RETRIES=0 local (flaky phải lộ ra ngay), RETRIES=2 CI (tránh false alarm)
  retries: envNum('RETRIES', process.env.CI ? 2 : 0),

  // ── Song song hóa (parallel) ──────────────────────────────────────────────
  // workers: số tab/browser chạy cùng lúc
  // CI: 4 worker để chạy nhanh, local: 2 để không ngốn RAM
  workers: envNum('WORKERS', process.env.CI ? 4 : 2),

  // Cho phép các test TRONG CÙNG MỘT FILE chạy song song với nhau
  // (mặc định Playwright chạy tuần tự trong 1 file)
  fullyParallel: envBool('FULLY_PARALLEL', true),

  // Dừng toàn bộ suite sau khi có N test fail — 0 = không giới hạn
  // Hữu ích khi chạy CI: nếu login fail thì dừng luôn, không chờ 200 test fail
  maxFailures: envNum('MAX_FAILURES', 0),

  // ── Reporter ──────────────────────────────────────────────────────────────
  reporter: [
    // Hiển thị kết quả trực tiếp trong terminal (dòng per test)
    ['list'],

    // HTML report: mở bằng `npm run test:report`
    ['html', { open: 'never', outputFolder: 'playwright-report' }],

    // JSON chỉ khi chạy CI → dùng để sinh bảng tóm tắt trong GitHub Actions
    ...(process.env.CI ? [['json', { outputFile: 'test-results.json' }] as const] : []),
  ],

  // ── Cài đặt chung cho mọi test ────────────────────────────────────────────
  use: {
    // URL gốc — dùng trong page.goto('/sign-in') thay vì URL đầy đủ
    // Env var BASE_URL ghi đè: local/staging/prod khác nhau
    baseURL: process.env.BASE_URL ?? 'https://app.promer.ai',

    // Chạy ẩn (không mở cửa sổ): true trên CI, có thể false để debug local
    headless: envBool('HEADLESS', true),

    // Làm chậm mỗi action (ms) — 0 = bình thường, 500-1000 để xem test chạy
    launchOptions: {
      slowMo: envNum('SLOW_MO', 0),
    },

    // Screenshot: chụp màn hình CHỈ KHI test fail (tiết kiệm disk)
    screenshot: 'only-on-failure',

    // Video: quay CHỈ KHI test fail (quan trọng để debug)
    video: 'retain-on-failure',

    // Trace: lưu trace CHỈ KHI test fail (xem từng step trong Trace Viewer)
    trace: 'retain-on-failure',

    // Timeout cho page.goto() — nếu trang load quá chậm thì fail
    navigationTimeout: envNum('NAVIGATION_TIMEOUT', 15_000),

    // Timeout cho mỗi action (click, fill, waitForSelector...)
    actionTimeout: envNum('ACTION_TIMEOUT', 10_000),
  },

  // ── Projects (browser / device profiles) ─────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      // iPhone 13: 390×844, userAgent mobile, touch events
      use: { ...devices['iPhone 13'] },
    },
  ],
});
