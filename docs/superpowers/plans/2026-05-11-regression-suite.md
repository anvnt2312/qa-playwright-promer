# Regression Suite: Login + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo regression suite riêng biệt (16 tests) cho Login + Dashboard, chạy sau mỗi lần dev fix bug để xác nhận không có regression mới.

**Architecture:** Hai file mới — `playwright.regression.js` (config riêng: Chromium only, retries:0, timeout:20s) và `tests/regression/login-dashboard.spec.js` (16 tests: 12 login + 4 dashboard, 4 trong số là `test.fail()` cho known bugs). Reuse hoàn toàn Page Objects và fixtures hiện có, không sửa bất kỳ file nào.

**Tech Stack:** Playwright Test v1.59.1, CommonJS, Node.js, dotenv, Shopify Polaris (aria-disabled, .Polaris-Text--critical)

---

## File Structure

| File | Trạng thái | Mô tả |
|---|---|---|
| `playwright.regression.js` | **Tạo mới** | Config: Chromium only, retries:0, timeout:20s, output → `reports/regression/` |
| `tests/regression/login-dashboard.spec.js` | **Tạo mới** | 16 tests (12 login + 4 dashboard) |
| `tests/pages/LoginPage.js` | Reuse, không sửa | goto(), waitForReady(), login(), fillEmail(), fillPassword(), submit(), submitForce(), pressEnterOnPassword(), isButtonDisabled(), getErrorText() |
| `tests/pages/DashboardPage.js` | Reuse, không sửa | loginAndGoto(), homeLink, userMenuBtn, contentArea |
| `tests/fixtures/loginData.js` | Reuse, không sửa | VALID (email/pass từ .env), INVALID (wrongPassword, nonExistentEmail, badFormatEmail, somePassword, anyPassword), EDGE (emailWithSpaces, longEmail, sqlInjection, sqlErrorKeywords) |
| `tests/fixtures/dashboardData.js` | Reuse, không sửa | EXPECTED (forbiddenErrorText, widgetPlaceholder) |

---

## Danh sách 16 tests

| # | Test | Tag | Xử lý |
|---|---|---|---|
| 1 | Đăng nhập thành công | HAPPY AC-1.1 | Bình thường |
| 2 | Nhớ phiên sau reload | HAPPY AC-1.2 | Bình thường |
| 3 | Nhấn Enter để submit | HAPPY AC-1.6 | Bình thường |
| 4 | Password sai → hiện lỗi | NEGATIVE AC-1.3 | Bình thường |
| 5 | Email không tồn tại → hiện lỗi | NEGATIVE AC-1.3 | Bình thường |
| 6 | Form trống → button disabled | NEGATIVE AC-1.4 | Bình thường |
| 7 | Email sai định dạng → inline error | NEGATIVE AC-1.5 | Bình thường |
| 8 | Email dài 252 ký tự không crash | EDGE EC-1.3 | Bình thường |
| 9 | SQL Injection bị chặn | EDGE EC-1.4 | Bình thường |
| 10 | Hiển thị đủ 3 element + 2 label | UI AC-1.7 | Bình thường |
| 11 | Email có khoảng trắng → login fail | EDGE EC-1.1 | `test.fail()` — BUG-02 |
| 12 | Thông báo lỗi giống nhau | EDGE EC-1.6 | `test.fail()` — BUG-03 |
| 13 | Dashboard load sau login | HAPPY AC-2.1 | Bình thường |
| 14 | Các widget hiển thị đúng | HAPPY AC-2.3 | Bình thường |
| 15 | Chưa login → redirect /sign-in | NEGATIVE EC-2.2 | `test.fail()` — BUG-04 |
| 16 | API 500 → không crash app shell | NEGATIVE EC-2.4 | `test.fail()` — BUG-05 |

---

## Task 1: Tạo playwright.regression.js

**Files:**
- Create: `playwright.regression.js`

- [ ] **Step 1: Tạo config file**

```javascript
// playwright.regression.js
require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/regression',
  timeout: 20000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/regression' }],
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
```

- [ ] **Step 2: Kiểm tra config parse được**

Run: `npx playwright test --config=playwright.regression.js --list`
Expected: `No tests found` (chưa có spec file) — không có lỗi parse

- [ ] **Step 3: Commit**

```bash
git add playwright.regression.js
git commit -m "feat: add playwright.regression.js — chromium-only, retries:0, timeout:20s"
```

---

## Task 2: Tạo scaffold spec (imports + cấu trúc describe)

**Files:**
- Create: `tests/regression/login-dashboard.spec.js`

- [ ] **Step 1: Tạo thư mục và file scaffold**

```javascript
// tests/regression/login-dashboard.spec.js
const { test, expect }   = require('@playwright/test');
const { LoginPage }      = require('../pages/LoginPage');
const { DashboardPage }  = require('../pages/DashboardPage');
const { VALID, INVALID, EDGE } = require('../fixtures/loginData');
const { EXPECTED }       = require('../fixtures/dashboardData');

// ============================================================
// Login Tests — 12 tests (3 happy · 4 negative · 1 ui · 2 edge · 2 test.fail)
// ============================================================

test.describe('[Login] Regression', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForReady();
  });

  // Tests được thêm ở Task 3, 4, 5
});

// ============================================================
// Dashboard Tests — 4 tests (2 happy · 2 test.fail)
// ============================================================

test.describe('[Dashboard] Regression', () => {
  // Tests được thêm ở Task 6
});
```

- [ ] **Step 2: Kiểm tra imports resolve đúng**

Run: `npx playwright test --config=playwright.regression.js --list`
Expected: `No tests found` — không có lỗi import

- [ ] **Step 3: Commit**

```bash
git add tests/regression/login-dashboard.spec.js
git commit -m "feat: scaffold regression spec — imports + empty describe blocks"
```

---

## Task 3: Thêm Login Happy tests (AC-1.1, AC-1.2, AC-1.6)

**Files:**
- Modify: `tests/regression/login-dashboard.spec.js`

- [ ] **Step 1: Thêm 3 HAPPY tests vào bên trong `[Login] Regression` describe (trước dòng `});` cuối của describe)**

```javascript
  // ── HAPPY ──────────────────────────────────────────────────────────────────

  // AC-1.1: Luồng chính — đăng nhập với email + password đúng
  test('[HAPPY] AC-1.1 — Đăng nhập thành công', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(VALID.password);
    await loginPage.submit();
    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10000 });
  });

  // AC-1.2: Sau khi đăng nhập, reload lại trang — vẫn ở trong app, không bị đá ra
  test('[HAPPY] AC-1.2 — Phiên đăng nhập duy trì sau reload', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(VALID.email, VALID.password);
    await page.waitForURL(url => !url.toString().includes('/sign-in'), { timeout: 10000 });
    await page.reload();
    await expect(page).not.toHaveURL(/\/sign-in/);
  });

  // AC-1.6: Nhấn Enter trên ô password thay vì click chuột — phải submit được
  test('[HAPPY] AC-1.6 — Nhấn Enter để submit form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(VALID.password);
    await loginPage.pressEnterOnPassword();
    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10000 });
  });
```

- [ ] **Step 2: Chạy 3 HAPPY tests để xác nhận pass**

Run: `npx playwright test --config=playwright.regression.js --grep "\[HAPPY\]" --reporter=list`
Expected:
```
3 passed
```

- [ ] **Step 3: Commit**

```bash
git add tests/regression/login-dashboard.spec.js
git commit -m "feat: add login happy tests — AC-1.1, AC-1.2, AC-1.6"
```

---

## Task 4: Thêm Login Negative + UI tests (AC-1.3 ×2, AC-1.4, AC-1.5, AC-1.7)

**Files:**
- Modify: `tests/regression/login-dashboard.spec.js`

- [ ] **Step 1: Thêm 4 NEGATIVE tests và 1 UI test vào Login describe (sau HAPPY tests, trước dòng `});` cuối)**

```javascript
  // ── NEGATIVE ───────────────────────────────────────────────────────────────

  // AC-1.3a: Đúng email nhưng sai password → phải hiện lỗi, ở lại /sign-in
  test('[NEGATIVE] AC-1.3 — Password sai → hiện lỗi', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(INVALID.wrongPassword);
    await loginPage.submit();
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    await expect(page.locator('.Polaris-Text--critical, [role="alert"]').first())
      .toBeVisible({ timeout: 5000 });
  });

  // AC-1.3b: Email chưa đăng ký → phải hiện lỗi, ở lại /sign-in
  test('[NEGATIVE] AC-1.3 — Email không tồn tại → hiện lỗi', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(INVALID.nonExistentEmail);
    await loginPage.fillPassword(INVALID.anyPassword);
    await loginPage.submit();
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    await expect(page.locator('.Polaris-Text--critical, [role="alert"]').first())
      .toBeVisible({ timeout: 5000 });
  });

  // AC-1.4: Form hoàn toàn trống — Polaris dùng aria-disabled="true" thay vì HTML disabled
  test('[NEGATIVE] AC-1.4 — Form trống → button bị disable', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const isDisabled = await loginPage.isButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  // AC-1.5: Email thiếu "@" — Polaris hiện inline error "Enter a valid email"
  //   submitForce() vì button có thể aria-disabled khi email sai format
  test('[NEGATIVE] AC-1.5 — Email sai định dạng → inline error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(INVALID.badFormatEmail);
    await loginPage.fillPassword(INVALID.somePassword);
    await loginPage.submitForce();
    await page.waitForTimeout(500);
    const isDisabled    = await loginPage.isButtonDisabled();
    const inlineError   = await page.locator('text=Enter a valid email').isVisible().catch(() => false);
    const criticalError = await page.locator('.Polaris-Text--critical').isVisible().catch(() => false);
    expect(isDisabled || inlineError || criticalError).toBe(true);
  });

  // ── UI ─────────────────────────────────────────────────────────────────────

  // AC-1.7: 3 element tương tác + 2 label accessibility phải visible cùng lúc
  test('[UI] AC-1.7 — Trang login hiển thị đủ 3 element + 2 label', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passInput).toBeVisible();
    await expect(loginPage.submitBtn).toBeVisible();
    await expect(loginPage.emailLabel).toBeVisible();
    await expect(loginPage.passLabel).toBeVisible();
  });
```

- [ ] **Step 2: Chạy NEGATIVE + UI để xác nhận 5 tests pass**

Run: `npx playwright test --config=playwright.regression.js --grep "\[NEGATIVE\]|\[UI\]" --reporter=list`
Expected:
```
5 passed
```

- [ ] **Step 3: Commit**

```bash
git add tests/regression/login-dashboard.spec.js
git commit -m "feat: add login negative (AC-1.3 x2, AC-1.4, AC-1.5) and UI (AC-1.7) tests"
```

---

## Task 5: Thêm Login Edge tests — 2 bình thường + 2 test.fail() (EC-1.1 BUG-02, EC-1.6 BUG-03)

**Files:**
- Modify: `tests/regression/login-dashboard.spec.js`

- [ ] **Step 1: Thêm 2 EDGE bình thường và 2 test.fail() vào Login describe (sau UI test, trước `});` cuối)**

```javascript
  // ── EDGE (bình thường) ─────────────────────────────────────────────────────

  // EC-1.3: Email gần đến giới hạn RFC 5321 (252 ký tự) — server không được crash
  test('[EDGE] EC-1.3 — Email dài 252 ký tự không crash server', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(EDGE.longEmail);
    await loginPage.fillPassword(INVALID.somePassword);
    await loginPage.submit();
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/500|error/i);
    const pageContent = await page.content();
    expect(pageContent).not.toMatch(/Internal Server Error/i);
  });

  // EC-1.4: SQL Injection — app phải dùng prepared statements, không được lộ lỗi DB
  test('[EDGE] EC-1.4 — SQL Injection bị chặn, không lộ lỗi DB', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(EDGE.sqlInjection);
    await loginPage.fillPassword(EDGE.sqlInjection);
    await loginPage.submitForce();
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/sign-in|promer\.ai\/?$/i);
    const pageContent = await page.content();
    expect(pageContent).not.toMatch(EDGE.sqlErrorKeywords);
  });

  // ── EDGE (test.fail — known bugs) ─────────────────────────────────────────
  // Giải thích test.fail():
  //   - test.fail() = test DỰ KIẾN sẽ fail (vì bug chưa fix)
  //   - Khi chạy: nếu test fail → Playwright đánh dấu "passed" (expected)
  //   - Khi bug được fix: test sẽ pass → Playwright báo "unexpected pass"
  //     → Đổi BUG status sang Fixed và xóa test.fail() khỏi suite

  // EC-1.1: BUG-02 — App không trim space đầu/cuối trong email
  //   Hành vi mong muốn: login thành công (app tự trim)
  //   Hành vi thực tế: login fail (bug)
  test.fail('[EDGE] EC-1.1 — BUG-02: Email có khoảng trắng → app không trim', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(EDGE.emailWithSpaces);
    await loginPage.fillPassword(VALID.password);
    await loginPage.submit();
    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10000 });
  });

  // EC-1.6: BUG-03 — Thông báo lỗi khác nhau cho email sai vs password sai
  //   Hành vi mong muốn: cùng thông báo (bảo mật — không để lộ tài khoản tồn tại)
  //   Hành vi thực tế: thông báo khác nhau (security risk)
  test.fail('[EDGE] EC-1.6 — BUG-03: Thông báo lỗi khác nhau → user enumeration', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(INVALID.nonExistentEmail);
    await loginPage.fillPassword(INVALID.anyPassword);
    await loginPage.submit();
    const errorMsg1 = await loginPage.getErrorText();
    await loginPage.goto();
    await loginPage.waitForReady();
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(INVALID.wrongPassword);
    await loginPage.submit();
    const errorMsg2 = await loginPage.getErrorText();
    expect(errorMsg1).toBe(errorMsg2);
  });
```

- [ ] **Step 2: Chạy 12 Login tests để xác nhận tất cả pass**

Run: `npx playwright test --config=playwright.regression.js --grep "\[Login\] Regression" --reporter=list`

Nếu grep theo describe không hoạt động, chạy toàn bộ và bỏ qua Dashboard (chưa có tests):

Run: `npx playwright test --config=playwright.regression.js --reporter=list`
Expected:
```
12 passed
```
Lưu ý: 2 test.fail() được đếm là "passed" vì chúng fail đúng như dự kiến.

- [ ] **Step 3: Commit**

```bash
git add tests/regression/login-dashboard.spec.js
git commit -m "feat: add login edge tests (EC-1.3, EC-1.4) and test.fail for BUG-02, BUG-03"
```

---

## Task 6: Thêm Dashboard tests — 2 bình thường + 2 test.fail() (EC-2.2 BUG-04, EC-2.4 BUG-05)

**Files:**
- Modify: `tests/regression/login-dashboard.spec.js`

- [ ] **Step 1: Thêm 4 tests vào bên trong `[Dashboard] Regression` describe**

```javascript
  // ── HAPPY ──────────────────────────────────────────────────────────────────

  // AC-2.1: Sau khi đăng nhập, tự động redirect về Dashboard — link "Home" phải visible
  test('[HAPPY] AC-2.1 — Dashboard load sau khi đăng nhập', async ({ page }) => {
    const loginPage  = new LoginPage(page);
    const dashboard  = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.waitForReady();
    await loginPage.login(VALID.email, VALID.password);
    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 15000 });
    await expect(dashboard.homeLink).toBeVisible({ timeout: 10000 });
  });

  // AC-2.3: Content area có nội dung thực (không phải placeholder "—")
  test('[HAPPY] AC-2.3 — Các widget hiển thị, không phải placeholder', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.loginAndGoto(VALID.email, VALID.password);
    await page.waitForTimeout(2000);
    const contentText = (await dashboard.contentArea.textContent() || '').trim();
    expect(contentText.length).toBeGreaterThan(10);
    expect(contentText.trim()).not.toBe(EXPECTED.widgetPlaceholder);
  });

  // ── NEGATIVE (test.fail — known bugs) ─────────────────────────────────────

  // EC-2.2: BUG-04 — Truy cập "/" không có session → app không redirect về /sign-in
  //   Hành vi mong muốn: redirect về /sign-in
  //   Hành vi thực tế: ở lại "/" với nút "Sign in" (không redirect)
  test.fail('[NEGATIVE] EC-2.2 — BUG-04: Chưa đăng nhập → không redirect /sign-in', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
  });

  // EC-2.4: BUG-05 — Khi API data trả về 500, app shell (sidebar + nav) bị vỡ
  //   Hành vi mong muốn: sidebar và header vẫn hiển thị
  //   Hành vi thực tế: link "Home" và "User menu" biến mất → màn hình trắng
  test.fail('[NEGATIVE] EC-2.4 — BUG-05: API 500 → app shell vỡ', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.waitForReady();
    await loginPage.login(VALID.email, VALID.password);
    await page.waitForURL(url => !url.toString().includes('/sign-in'), { timeout: 15000 });
    // Mock: tất cả API (trừ auth) trả về 500
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      if (!url.includes('/auth') && !url.includes('/login') && !url.includes('/sign')) {
        await route.fulfill({
          status:      500,
          contentType: 'application/json',
          body:        JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });
    await page.reload();
    await page.waitForTimeout(3000);
    // Khi bug fix: ít nhất 1 trong 2 phải visible
    const hasShell =
      await dashboard.homeLink.isVisible().catch(() => false) ||
      await dashboard.userMenuBtn.isVisible().catch(() => false);
    expect(hasShell).toBe(true);
  });
```

- [ ] **Step 2: Chạy toàn bộ suite để xác nhận 16 tests pass**

Run: `npx playwright test --config=playwright.regression.js --reporter=list`
Expected:
```
16 passed
0 failed
```
Lưu ý: 4 test.fail() (BUG-02, BUG-03, BUG-04, BUG-05) đều được đếm là "passed".

- [ ] **Step 3: Commit**

```bash
git add tests/regression/login-dashboard.spec.js
git commit -m "feat: add dashboard tests (AC-2.1, AC-2.3) and test.fail for BUG-04, BUG-05"
```

---

## Task 7: Chạy full suite + tạo HTML report

**Files:**
- Không thay đổi file nào

- [ ] **Step 1: Xóa kết quả cũ và chạy regression suite với HTML reporter**

```bash
rm -rf test-results/ reports/regression/
npx playwright test --config=playwright.regression.js
```

Expected output:
```
Running 16 tests using 1 worker

  ✓  [chromium] › regression/login-dashboard.spec.js:... [HAPPY] AC-1.1 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [HAPPY] AC-1.2 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [HAPPY] AC-1.6 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [NEGATIVE] AC-1.3 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [NEGATIVE] AC-1.3 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [NEGATIVE] AC-1.4 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [NEGATIVE] AC-1.5 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [EDGE] EC-1.3 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [EDGE] EC-1.4 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [UI] AC-1.7 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [EDGE] EC-1.1 — BUG-02 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [EDGE] EC-1.6 — BUG-03 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [HAPPY] AC-2.1 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [HAPPY] AC-2.3 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [NEGATIVE] EC-2.2 — BUG-04 (...)
  ✓  [chromium] › regression/login-dashboard.spec.js:... [NEGATIVE] EC-2.4 — BUG-05 (...)

  16 passed (Xs)
```

**Nếu có test bị fail** (không phải test.fail()):
- Đây là regression mới → tạo bug report trong `reports/bug-reports.md`
- Không sửa test để "ép" pass

- [ ] **Step 2: Xem HTML report**

```bash
npx playwright show-report reports/regression
```

Kiểm tra:
- Tất cả 16 test hiển thị màu xanh
- 4 test.fail() có badge "expected failure"
- Screenshot/video/trace đính kèm cho từng test fail thực sự

- [ ] **Step 3: Commit cuối**

```bash
git add reports/regression/ -f
git commit -m "test: first regression run — 16 passed, 0 failed"
```

---

## Cách đọc kết quả

| Output | Ý nghĩa | Hành động |
|---|---|---|
| `16 passed` | Không có regression mới | Không cần làm gì |
| `1 failed — [HAPPY] AC-1.1` | Regression mới — bug vừa được tạo | Tạo bug report trong `reports/bug-reports.md` |
| `1 unexpected pass — [EDGE] EC-1.1` | BUG-02 đã được fix | Đổi status BUG-02 → Fixed, xóa `test.fail()` |

## Lệnh chạy

```bash
# Chạy regression suite
npx playwright test --config=playwright.regression.js

# Xem HTML report
npx playwright show-report reports/regression

# Chạy lại chỉ test đã fail trong lần trước
npx playwright test --config=playwright.regression.js --last-failed
```
