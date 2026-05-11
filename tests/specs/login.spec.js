// Convert từ: tests/features/login.feature
// Skill áp dụng: skills/qa-skill.md — BDD to Playwright Auto Converter
// Feature refs: AC-1.1 → AC-1.7, EC-1.1 → EC-1.7
// Tổng: 17 scenarios (3 happy · 6 negative · 6 edge · 2 ui · 1 perf)

const { test, expect } = require('@playwright/test');
const { LoginPage }    = require('../pages/LoginPage');
const { VALID, INVALID, EDGE } = require('../fixtures/loginData');

// =============================================================================
// Feature: Đăng nhập / Login Authentication
// Background → test.beforeEach: mỗi test mở trang /sign-in và chờ form sẵn sàng
// =============================================================================

test.describe('[Login] Đăng nhập / Authentication', () => {

  // Background: mỗi scenario đều bắt đầu từ trang login, form đã hiển thị đủ
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();       // mở /sign-in
    await loginPage.waitForReady(); // chờ email + password + button visible
  });

  // ===========================================================================
  // HAPPY CASE — luồng chính
  // ===========================================================================

  // [HAPPY] AC-1.1 — Đăng nhập thành công với email + password hợp lệ
  // Gherkin: Scenario: Đăng nhập thành công với thông tin hợp lệ
  test('[HAPPY] AC-1.1 — Đăng nhập thành công với thông tin hợp lệ', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập email và password đúng, bấm Continue
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(VALID.password);
    await loginPage.submit();

    // Then: URL phải rời khỏi /sign-in → đã vào được app
    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10000 });
  });

  // [HAPPY] AC-1.2 — Phiên đăng nhập được duy trì sau khi reload trang
  // Gherkin: Scenario: Phiên đăng nhập được duy trì sau khi reload trang
  test('[HAPPY] AC-1.2 — Phiên đăng nhập duy trì sau khi reload', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Given: đăng nhập thành công trước
    await loginPage.login(VALID.email, VALID.password);
    await page.waitForURL(url => !url.toString().includes('/sign-in'), { timeout: 10000 });

    // When: reload lại trang trình duyệt
    await page.reload();

    // Then: vẫn ở trong app, không bị redirect về /sign-in
    await expect(page).not.toHaveURL(/\/sign-in/);
  });

  // [HAPPY] AC-1.6 — Nhấn phím Enter thay vì click nút Continue
  // Gherkin: Scenario: Nhấn phím Enter trên ô password để submit form
  test('[HAPPY] AC-1.6 — Nhấn Enter trên ô password để submit form', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập email + password, rồi nhấn Enter (không click chuột)
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(VALID.password);
    await loginPage.pressEnterOnPassword();

    // Then: form được submit, điều hướng vào app như khi click nút
    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10000 });
  });

  // ===========================================================================
  // NEGATIVE CASE — trường hợp lỗi
  // ===========================================================================

  // [NEGATIVE] AC-1.3 — Đăng nhập thất bại khi password sai
  // Gherkin: Scenario: Đăng nhập thất bại khi password sai
  test('[NEGATIVE] AC-1.3 — Thất bại khi password sai', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập đúng email nhưng password sai
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(INVALID.wrongPassword);
    await loginPage.submit();

    // Then: ở lại /sign-in và hiện thông báo lỗi
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    await expect(page.locator('.Polaris-Text--critical, [role="alert"]').first())
      .toBeVisible({ timeout: 5000 });
  });

  // [NEGATIVE] AC-1.3 — Đăng nhập thất bại khi email không tồn tại
  // Gherkin: Scenario: Đăng nhập thất bại khi email không tồn tại
  test('[NEGATIVE] AC-1.3 — Thất bại khi email không tồn tại trong hệ thống', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập email chưa đăng ký + password bất kỳ
    await loginPage.fillEmail(INVALID.nonExistentEmail);
    await loginPage.fillPassword(INVALID.anyPassword);
    await loginPage.submit();

    // Then: ở lại /sign-in và hiện thông báo lỗi
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    await expect(page.locator('.Polaris-Text--critical, [role="alert"]').first())
      .toBeVisible({ timeout: 5000 });
  });

  // [NEGATIVE] AC-1.4 — Nút Continue bị disable khi form hoàn toàn trống
  // Gherkin: Scenario: Nút Continue bị vô hiệu hóa khi form trống
  test('[NEGATIVE] AC-1.4 — Nút Continue bị disable khi form trống', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: không nhập gì (form ở trạng thái rỗng)
    // (không cần thêm action — beforeEach đã ở trạng thái form trống)

    // Then: button phải có aria-disabled=true (Polaris validation)
    const isDisabled = await loginPage.isButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  // [NEGATIVE] AC-1.4 — Nút Continue vẫn bị disable khi chỉ có email, thiếu password
  // Gherkin: Scenario: Nút Continue bị vô hiệu hóa khi chỉ có email, thiếu password
  test('[NEGATIVE] AC-1.4 — Nút Continue bị disable khi có email nhưng thiếu password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập email nhưng để trống password
    await loginPage.fillEmail(VALID.email);

    // Then: button vẫn bị disable vì password trống
    const isDisabled = await loginPage.isButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  // [NEGATIVE] AC-1.5 — Hiển thị lỗi inline khi email sai định dạng (thiếu @)
  // Gherkin: Scenario: Hiển thị lỗi inline khi email sai định dạng
  test('[NEGATIVE] AC-1.5 — Lỗi inline khi email sai định dạng (thiếu @)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập email không có "@", nhập password, force click nút
    await loginPage.fillEmail(INVALID.badFormatEmail);
    await loginPage.fillPassword(INVALID.somePassword);
    await loginPage.submitForce(); // force vì button có thể đang disabled
    await page.waitForTimeout(500); // chờ Polaris hiện inline error

    // Then: button bị disable và hiện thông báo "Enter a valid email"
    const isDisabled    = await loginPage.isButtonDisabled();
    const inlineError   = await page.locator('text=Enter a valid email').isVisible().catch(() => false);
    const criticalError = await page.locator('.Polaris-Text--critical').isVisible().catch(() => false);

    expect(isDisabled || inlineError || criticalError).toBe(true);
  });

  // ===========================================================================
  // EDGE CASE — biên và ngoại lệ
  // ===========================================================================

  // [EDGE] EC-1.1 — Email có khoảng trắng đầu/cuối (copy-paste nhầm)
  // Gherkin: Scenario: Đăng nhập với email có khoảng trắng đầu/cuối
  test('[EDGE] EC-1.1 — Email có khoảng trắng đầu/cuối: app nên tự trim', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập email có space đầu và cuối (mô phỏng copy-paste)
    await loginPage.fillEmail(EDGE.emailWithSpaces);
    await loginPage.fillPassword(VALID.password);
    await loginPage.submit();

    // Then: app nên tự trim space → login thành công
    // Nếu FAIL → BUG: app không trim → user bị lỗi mà không hiểu lý do
    const currentURL = page.url();
    console.log(`[EC-1.1] URL sau khi login với email có space: ${currentURL}`);

    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10000 });
  });

  // [EDGE] EC-1.2 — Password chứa ký tự đặc biệt
  // Gherkin: Scenario: Đăng nhập với password chứa ký tự đặc biệt
  test('[EDGE] EC-1.2 — Password chứa ký tự đặc biệt không gây crash', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập password với ký tự đặc biệt !@#$%^&*()
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(EDGE.specialCharPassword);
    await loginPage.submit();

    // Then: không được có lỗi 500 hay trang trắng — xử lý gracefully
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/500|error/i);

    const pageContent = await page.content();
    expect(pageContent).not.toMatch(/Internal Server Error|500/i);
  });

  // [EDGE] EC-1.3 — Email dài 252 ký tự (gần giới hạn RFC 5321)
  // Gherkin: Scenario: Đăng nhập với email dài 252 ký tự
  test('[EDGE] EC-1.3 — Email dài 252 ký tự không làm crash server', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập email có 252 ký tự (243 "a" + "@test.com")
    await loginPage.fillEmail(EDGE.longEmail);
    await loginPage.fillPassword(INVALID.somePassword);
    await loginPage.submit();

    // Then: không crash, xử lý gracefully (hiện lỗi bình thường hoặc không tìm thấy)
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/500|error/i);

    const pageContent = await page.content();
    expect(pageContent).not.toMatch(/Internal Server Error/i);
  });

  // [EDGE/SECURITY] EC-1.4 — SQL Injection qua field email
  // Gherkin: Scenario: Ngăn chặn SQL Injection qua field email
  test('[EDGE] EC-1.4 — SQL Injection bị chặn, không lộ lỗi database', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: nhập chuỗi SQL injection vào cả email và password
    await loginPage.fillEmail(EDGE.sqlInjection);
    await loginPage.fillPassword(EDGE.sqlInjection);
    await loginPage.submitForce();

    // Then: ở lại trang login, không vào được app
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/sign-in|promer\.ai\/?$/i);

    // Then: nội dung trang không chứa thông báo lỗi SQL (bảo mật)
    const pageContent = await page.content();
    expect(pageContent).not.toMatch(EDGE.sqlErrorKeywords);
  });

  // [EDGE/SECURITY] EC-1.5 — XSS qua field email
  // Gherkin: Scenario: Ngăn chặn XSS qua field email
  test('[EDGE] EC-1.5 — XSS payload không được thực thi', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Lắng nghe dialog (alert) — nếu XSS chạy thì sẽ trigger dialog này
    let xssExecuted = false;
    page.on('dialog', async dialog => {
      xssExecuted = true;
      await dialog.dismiss(); // đóng dialog để test tiếp tục
    });

    // When: nhập script tag vào field email
    await loginPage.fillEmail(EDGE.xssPayload);
    await loginPage.fillPassword(INVALID.somePassword);
    await loginPage.submitForce();

    // Chờ một lúc để XSS có cơ hội kích hoạt nếu có lỗ hổng
    await page.waitForTimeout(1000);

    // Then: không có alert/dialog nào được kích hoạt
    expect(xssExecuted).toBe(false);
  });

  // [EDGE/SECURITY] EC-1.6 — Thông báo lỗi phải giống nhau (chống user enumeration)
  // Gherkin: Scenario: Thông báo lỗi phải giống nhau cho email sai và password sai
  test('[EDGE] EC-1.6 — Thông báo lỗi giống nhau cho email sai vs password sai', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // When: đăng nhập với email không tồn tại
    await loginPage.fillEmail(INVALID.nonExistentEmail);
    await loginPage.fillPassword(INVALID.anyPassword);
    await loginPage.submit();
    const errorMsg1 = await loginPage.getErrorText();

    // Reset form bằng cách goto lại
    await loginPage.goto();

    // When: đăng nhập với email đúng nhưng password sai
    await loginPage.fillEmail(VALID.email);
    await loginPage.fillPassword(INVALID.wrongPassword);
    await loginPage.submit();
    const errorMsg2 = await loginPage.getErrorText();

    // Then: hai thông báo lỗi phải giống hệt nhau
    // Nếu khác nhau → lộ thông tin tài khoản có tồn tại hay không (security risk)
    expect(errorMsg1).toBe(errorMsg2);
  });

  // ===========================================================================
  // UI / UX — kiểm tra giao diện
  // ===========================================================================

  // [UI] AC-1.7 — Trang đăng nhập hiển thị đủ các element bắt buộc
  // Gherkin: Scenario: Trang đăng nhập hiển thị đủ các element bắt buộc
  test('[UI] AC-1.7 — Trang login hiển thị đủ 3 element và 2 label', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Then: tất cả element cơ bản phải visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passInput).toBeVisible();
    await expect(loginPage.submitBtn).toBeVisible();

    // Label "Email" và "Password" phải hiển thị (quan trọng cho accessibility)
    await expect(loginPage.emailLabel).toBeVisible();
    await expect(loginPage.passLabel).toBeVisible();
  });

  // [UI] — Giao diện đúng trên mobile viewport (iPhone 13: 390x844)
  // Gherkin: Scenario: Giao diện đăng nhập hiển thị đúng trên màn hình mobile
  test('[UI] Trang login không vỡ layout trên mobile viewport iPhone 13', async ({ page }) => {
    // Given: đặt viewport sang kích thước iPhone 13
    await page.setViewportSize({ width: 390, height: 844 });

    // Reload lại trang với viewport mới
    await page.goto('/sign-in');
    const loginPage = new LoginPage(page);
    await loginPage.waitForReady();

    // Then: ô email vẫn visible và không có scroll ngang
    await expect(loginPage.emailInput).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  // ===========================================================================
  // PERFORMANCE — đo hiệu năng
  // ===========================================================================

  // [PERF] EC-1.7 — Trang /sign-in phải load xong trong vòng 3 giây
  // Gherkin: Scenario: Trang đăng nhập phải load xong trong vòng 3 giây
  // BUG-01: thực tế đang load 3.6–4.2s → test này hiện FAIL
  test('[PERF] EC-1.7 — Trang login load xong trong 3 giây', async ({ page }) => {
    // Đo thời gian: bắt đầu từ lúc gửi request
    const startTime = Date.now();

    // When: mở trang và chờ đến khi ô email hiển thị (trang "sẵn sàng dùng")
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.locator('input[autocomplete="email"]').first()
      .waitFor({ state: 'visible', timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log(`[PERF] Thời gian load trang /sign-in: ${loadTime}ms`);
    console.log(`[PERF] Ngưỡng: 3000ms | Kết quả: ${loadTime < 3000 ? 'PASS' : 'FAIL (BUG-01)'}`);

    // Then: tổng thời gian phải nhỏ hơn 3000ms
    // Lưu ý: thực tế đang ~3600–4200ms nên test này sẽ FAIL → đây là bug đã biết
    expect(loadTime).toBeLessThan(3000);
  });

});
