const { test, expect }   = require('@playwright/test');
const { LoginPage }      = require('../pages/LoginPage');
const { DashboardPage }  = require('../pages/DashboardPage');
const { VALID, INVALID, EDGE } = require('../fixtures/loginData');
const { EXPECTED }       = require('../fixtures/dashboardData');

// ============================================================
// Login Tests — 12 tests (3 happy · 4 negative · 1 ui · 3 edge · 1 test.fail)
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

  // EC-1.6: App trả cùng thông báo lỗi cho email sai và password sai
  //   Đây là hành vi ĐÚNG (bảo mật) — không để lộ tài khoản tồn tại
  //   BUG-03 đã xác nhận KHÔNG tồn tại: app.promer.ai đã implement đúng
  //   → test này xác nhận security behavior luôn được giữ nguyên
  test('[EDGE] EC-1.6 — Thông báo lỗi giống nhau → không lộ user enumeration', async ({ page }) => {
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
});

// ============================================================
// Dashboard Tests — 4 tests (2 happy · 2 test.fail)
// ============================================================

test.describe('[Dashboard] Regression', () => {
  // Tests được thêm ở Task 6

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
});
