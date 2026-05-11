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
});

// ============================================================
// Dashboard Tests — 4 tests (2 happy · 2 test.fail)
// ============================================================

test.describe('[Dashboard] Regression', () => {
  // Tests được thêm ở Task 6
});
