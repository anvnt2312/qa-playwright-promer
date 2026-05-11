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
});

// ============================================================
// Dashboard Tests — 4 tests (2 happy · 2 test.fail)
// ============================================================

test.describe('[Dashboard] Regression', () => {
  // Tests được thêm ở Task 6
});
