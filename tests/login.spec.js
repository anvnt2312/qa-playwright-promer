// Nhập thư viện Playwright để sử dụng các hàm test
const { test, expect } = require('@playwright/test');

// ─── ĐỌC THÔNG TIN ĐĂNG NHẬP TỪ FILE .env ───────────────────────────────────
// Playwright tự động nạp file .env — không cần cài thêm thư viện nào
// process.env.TÊN_BIẾN sẽ trả về giá trị bạn đã điền trong file .env
const VALID_EMAIL    = process.env.TEST_EMAIL;
const VALID_PASSWORD = process.env.TEST_PASSWORD;
const LOGIN_URL      = process.env.BASE_URL ? `${process.env.BASE_URL}/sign-in` : '/sign-in';

// Kiểm tra bắt buộc: nếu quên điền .env thì báo lỗi ngay, không chạy test
if (!VALID_EMAIL || !VALID_PASSWORD) {
  throw new Error(
    'Thiếu thông tin đăng nhập!\n' +
    'Hãy mở file .env và điền vào:\n' +
    '  TEST_EMAIL=email_của_bạn@example.com\n' +
    '  TEST_PASSWORD=mật_khẩu_của_bạn'
  );
}

// Helper: mở trang login và chờ form sẵn sàng
async function goToLogin(page) {
  await page.goto(LOGIN_URL);
  // Email field dùng autocomplete="email" (type là "text", không phải "email")
  await page.waitForSelector('input[autocomplete="email"]', { timeout: 10000 });
}

// Helper: điền form và bấm đăng nhập
async function fillAndSubmit(page, email, password) {
  const emailInput    = page.locator('input[autocomplete="email"]').first();
  const passwordInput = page.locator('input[autocomplete="current-password"]').first();
  const submitBtn     = page.locator('button[type="submit"]').first(); // text "Continue"

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitBtn.click();
}

// =============================================================================
// HAPPY CASE
// =============================================================================

test('[HAPPY] Login - Đăng nhập thành công với email và password hợp lệ', async ({ page }) => {
  // Kịch bản: người dùng nhập đúng email + password → vào được app
  await goToLogin(page);
  await fillAndSubmit(page, VALID_EMAIL, VALID_PASSWORD);

  // Sau khi login thành công, URL phải thay đổi (rời khỏi trang login)
  // hoặc xuất hiện element của dashboard
  await expect(page).not.toHaveURL(/\/login|\/signin/i, { timeout: 10000 });

  // Bug tiềm ẩn: nếu redirect loop xảy ra → page không bao giờ rời khỏi /login
});

test('[HAPPY] Login - Nhớ phiên đăng nhập sau khi reload trang', async ({ page }) => {
  // Kịch bản: sau khi login, reload lại → vẫn ở trong app, không bị đá ra login
  await goToLogin(page);
  await fillAndSubmit(page, VALID_EMAIL, VALID_PASSWORD);
  await page.waitForURL(url => !url.toString().match(/\/login|\/signin/i), { timeout: 10000 });

  await page.reload();

  // Phải vẫn ở trang app, không bị redirect về login
  await expect(page).not.toHaveURL(/\/login|\/signin/i);

  // Bug tiềm ẩn: session/cookie không được set đúng → bị đá ra sau reload
});

// =============================================================================
// NEGATIVE CASE
// =============================================================================

test('[NEGATIVE] Login - Email đúng nhưng password sai', async ({ page }) => {
  // Kịch bản: password sai → hiện thông báo lỗi, KHÔNG cho vào app
  await goToLogin(page);
  await fillAndSubmit(page, VALID_EMAIL, 'wrong-password-123');

  // Phải ở lại trang login (/sign-in)
  await expect(page).toHaveURL(/\/sign-in/i, { timeout: 5000 });

  // Phải có thông báo lỗi hiện ra
  const errorMsg = page.locator('.Polaris-Text--critical, [role="alert"], p:has-text("incorrect"), p:has-text("sai"), p:has-text("Invalid")');
  await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });

  // Bug tiềm ẩn: lỗi không hiện ra → người dùng không biết mình nhập sai
});

test('[NEGATIVE] Login - Email không tồn tại', async ({ page }) => {
  // Kịch bản: email chưa đăng ký → hiện lỗi, không cho vào
  await goToLogin(page);
  await fillAndSubmit(page, 'notexist_xyz_99999@fake.com', 'anyPassword123');

  const errorMsg = page.locator('.Polaris-Text--critical, [role="alert"]');
  await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });

  // Bug tiềm ẩn: thông báo lỗi khác nhau cho "email sai" vs "password sai"
  // → lộ thông tin tài khoản có tồn tại hay không (security risk)
});

test('[NEGATIVE] Login - Để trống cả email và password', async ({ page }) => {
  // Kịch bản: bấm login mà không nhập gì → phải có validation ngăn submit
  // App dùng Polaris: button bị aria-disabled khi form trống → đây là validation hợp lệ
  await goToLogin(page);

  const submitBtn = page.locator('button[type="submit"]').first();

  // Kiểm tra button bị disabled (Polaris disable button khi form trống)
  const isDisabled = await submitBtn.getAttribute('aria-disabled');
  const hasDisabledClass = (await submitBtn.getAttribute('class') || '').includes('disabled');

  if (isDisabled === 'true' || hasDisabledClass) {
    // Button bị disabled → validation đúng, test PASS
    expect(true).toBeTruthy();
  } else {
    // Button không bị disabled → thử click và kiểm tra lỗi
    await submitBtn.click({ force: true });
    const errorVisible = await page.locator('.Polaris-Text--critical, [role="alert"]').first().isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  }

  // Bug tiềm ẩn: form submit mà không validate → gọi API với data rỗng
});

test('[NEGATIVE] Login - Để trống password, có email hợp lệ', async ({ page }) => {
  // Kịch bản: nhập email nhưng quên điền password
  // App Polaris: button vẫn disabled khi password trống → kiểm tra disabled state
  await goToLogin(page);

  const emailInput = page.locator('input[autocomplete="email"]').first();
  await emailInput.fill(VALID_EMAIL);

  const submitBtn   = page.locator('button[type="submit"]').first();
  const isDisabled  = await submitBtn.getAttribute('aria-disabled');
  const hasDisabledClass = (await submitBtn.getAttribute('class') || '').includes('disabled');

  if (isDisabled === 'true' || hasDisabledClass) {
    // Button disabled khi password trống → validation đúng
    expect(true).toBeTruthy();
  } else {
    await submitBtn.click({ force: true });
    const errorVisible = await page.locator('.Polaris-Text--critical, [role="alert"]').first().isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  }
});

test('[NEGATIVE] Login - Email sai định dạng (thiếu @)', async ({ page }) => {
  // Kịch bản: nhập "not-an-email" → app hiện lỗi "Enter a valid email" và disable nút Continue
  // App dùng Polaris: field email type="text" nên HTML5 validity không check format,
  // nhưng app tự validate và disable button + hiện inline error
  await goToLogin(page);

  const emailInput = page.locator('input[autocomplete="email"]').first();
  const submitBtn  = page.locator('button[type="submit"]').first();

  await emailInput.fill('not-an-email');
  await page.locator('input[autocomplete="current-password"]').fill('somePassword123');
  // Force click để trigger validation inline (button có thể disabled)
  await submitBtn.click({ force: true });
  await page.waitForTimeout(500);

  const isDisabled      = await submitBtn.getAttribute('aria-disabled');
  const inlineError     = await page.locator('text=Enter a valid email').isVisible().catch(() => false);
  const criticalVisible = await page.locator('.Polaris-Text--critical').isVisible().catch(() => false);

  expect(isDisabled === 'true' || inlineError || criticalVisible).toBeTruthy();

  // Bug tiềm ẩn: validate client-side bị bypass → server nhận email không hợp lệ
});

test('[NEGATIVE] Login - Email có khoảng trắng thừa ở đầu/cuối', async ({ page }) => {
  // Kịch bản: người dùng vô tình copy-paste email có space → app nên tự trim
  await goToLogin(page);
  await fillAndSubmit(page, `  ${VALID_EMAIL}  `, VALID_PASSWORD);

  // Nếu app trim đúng → login thành công, nếu không → báo lỗi
  // Test này ghi nhận hành vi thực tế, không pass/fail cứng
  const currentURL = page.url();
  console.log(`URL sau khi login với email có space: ${currentURL}`);

  // Bug tiềm ẩn: app không trim → user bị lỗi mà không biết tại sao
});

// =============================================================================
// EDGE CASE
// =============================================================================

test('[EDGE] Login - Password chứa ký tự đặc biệt', async ({ page }) => {
  // Kịch bản: password = !@#$%^&*()_+-=[]{}|;':\",./<>?
  // Một số app bị lỗi khi password có ký tự đặc biệt
  await goToLogin(page);
  await fillAndSubmit(page, VALID_EMAIL, '!@#$%^&*()_+Test1');

  // Không được crash hay hiện lỗi 500, phải xử lý gracefully
  await expect(page).not.toHaveURL(/500|error/i);

  // Bug tiềm ẩn: backend không escape ký tự đặc biệt → crash hoặc SQL error
});

test('[EDGE] Login - Email dài 254 ký tự (giới hạn RFC 5321)', async ({ page }) => {
  // Kịch bản: email dài nhất hợp lệ theo chuẩn RFC
  const longEmail = 'a'.repeat(243) + '@test.com'; // tổng = 252 ký tự
  await goToLogin(page);
  await fillAndSubmit(page, longEmail, 'somePassword');

  // Không được crash, phải xử lý gracefully (lỗi hoặc không tìm thấy tài khoản)
  await expect(page).not.toHaveURL(/500|error/i);
});

test('[EDGE] Login - Password dài 128 ký tự', async ({ page }) => {
  // Kịch bản: một số hệ thống giới hạn độ dài password → test xem có bị cắt không
  const longPassword = 'Aa1!' + 'x'.repeat(124); // 128 ký tự
  await goToLogin(page);
  await fillAndSubmit(page, VALID_EMAIL, longPassword);

  // Không được crash, phải xử lý gracefully
  await expect(page).not.toHaveURL(/500|error/i);

  // Bug tiềm ẩn: server cắt password ở N ký tự → "Aa1!xxxx..." bị xử lý khác nhau
});

test('[EDGE] Login - Nhấn Enter thay vì click button Login', async ({ page }) => {
  // Kịch bản: người dùng quen dùng phím Enter để submit form
  await goToLogin(page);

  const emailInput    = page.locator('input[autocomplete="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(VALID_EMAIL);
  await passwordInput.fill(VALID_PASSWORD);
  await passwordInput.press('Enter'); // nhấn Enter thay vì click

  // Phải hoạt động như click button
  await expect(page).not.toHaveURL(/\/login|\/signin/i, { timeout: 10000 });

  // Bug tiềm ẩn: Enter không trigger submit → UX kém, user nhầm tưởng đã đăng nhập
});

// =============================================================================
// UI / UX
// =============================================================================

test('[UI] Login - Hiển thị đúng các element cơ bản của form', async ({ page }) => {
  // Kịch bản: mở trang login → phải thấy đủ field email, password, nút login
  await goToLogin(page);

  await expect(page.locator('input[autocomplete="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
  await expect(page.locator('button[type="submit"]').first()).toBeVisible();

  // Bug tiềm ẩn: CSS load chậm → element bị ẩn hoặc không render đúng
});

test('[UI] Login - Label "Email" và "Password" hiển thị trên form', async ({ page }) => {
  // Kịch bản: app dùng Label thay vì placeholder → kiểm tra label hiển thị đúng
  // (app.promer.ai dùng Polaris design system, không có placeholder text)
  await goToLogin(page);

  // Label "Email" phải visible
  await expect(page.locator('label:has-text("Email")').first()).toBeVisible();
  // Label "Password" phải visible
  await expect(page.locator('label:has-text("Password")').first()).toBeVisible();

  // Bug tiềm ẩn: label bị ẩn hoặc không kết nối đúng với input → accessibility kém
});

test('[UI] Login - Nút toggle hiện/ẩn password hoạt động đúng', async ({ page }) => {
  // Kịch bản: bấm icon mắt → password chuyển từ *** sang text thường
  await goToLogin(page);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill('testPassword123');

  // Tìm nút toggle (icon mắt) cạnh ô password
  const toggleBtn = page.locator('[class*="toggle"], [class*="eye"], button[aria-label*="password" i], [data-testid*="password-toggle"]').first();

  if (await toggleBtn.isVisible()) {
    await toggleBtn.click();
    // Sau khi click, input type phải đổi thành "text"
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    // Click lần 2 → đổi lại thành "password"
    await expect(passwordInput).toHaveAttribute('type', 'password');
  } else {
    // Ghi chú: không có nút toggle → UX kém, user không thể kiểm tra password
    console.log('⚠️  Không tìm thấy nút toggle hiện/ẩn password');
    test.skip();
  }
});

test('[UI] Login - Trang hiển thị đúng trên màn hình mobile (iPhone 13)', async ({ page, isMobile }) => {
  // Kịch bản: mở trang login trên mobile → form không bị vỡ layout
  await goToLogin(page);

  // Form phải vẫn visible và không bị overflow ngang
  const emailInput = page.locator('input[autocomplete="email"]').first();
  await expect(emailInput).toBeVisible();

  // Kiểm tra không có scroll ngang (dấu hiệu layout bị vỡ)
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalScroll).toBeFalsy();

  // Bug tiềm ẩn: form cố định width px → tràn ra ngoài viewport trên mobile
});

// =============================================================================
// PERFORMANCE
// =============================================================================

test('[PERF] Login - Trang login load dưới 3 giây', async ({ page }) => {
  // Kịch bản: đo thời gian thực tế từ lúc request đến lúc trang sẵn sàng dùng
  // 🐛 BUG THẬT: app.promer.ai/sign-in load ~3.6-4.2s (đo 3 lần, đều > 3s)
  // → Cần tối ưu JS bundle hoặc dùng lazy loading
  const startTime = Date.now();

  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  // Chờ form xuất hiện mới tính là "sẵn sàng dùng"
  await page.waitForSelector('input[autocomplete="email"]', { timeout: 10000 });

  const loadTime = Date.now() - startTime;
  console.log(`⏱  Thời gian load trang login: ${loadTime}ms`);

  expect(loadTime).toBeLessThan(3000);

  // Bug tiềm ẩn: JS bundle quá lớn, hoặc API call blocking render
});

test('[PERF] Login - API đăng nhập phản hồi dưới 3 giây', async ({ page }) => {
  // Kịch bản: đo thời gian từ lúc click Login đến khi nhận response từ server
  await goToLogin(page);

  // Bắt đầu lắng nghe network request login
  const [response] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes('/login') || res.url().includes('/auth') || res.url().includes('/signin'),
      { timeout: 10000 }
    ),
    fillAndSubmit(page, VALID_EMAIL, VALID_PASSWORD),
  ]);

  const timing = response.request().timing();
  const responseTime = timing.responseEnd - timing.requestStart;
  console.log(`⏱  Thời gian API login: ${responseTime.toFixed(0)}ms`);

  expect(responseTime).toBeLessThan(3000);

  // Bug tiềm ẩn: database query không dùng index → chậm khi có nhiều user
});

// =============================================================================
// SECURITY CƠ BẢN
// =============================================================================

test('[SECURITY] Login - SQL Injection trong field email', async ({ page }) => {
  // Kịch bản: nhập chuỗi SQL injection → app không được crash hay trả về data bất thường
  // Đây là test phòng thủ, KHÔNG phải test tấn công
  await goToLogin(page);
  await fillAndSubmit(page, "' OR '1'='1", "' OR '1'='1");

  // Phải ở lại trang login với thông báo lỗi thông thường, KHÔNG được vào app
  const currentURL = page.url();
  expect(currentURL).toMatch(/sign-in|promer\.ai\/?$/i);

  // Không được hiện lỗi SQL (database error message → lộ thông tin hệ thống)
  const pageContent = await page.content();
  expect(pageContent).not.toMatch(/sql|syntax error|ORA-|mysql|pg_query/i);

  // Bug tiềm ẩn: backend không dùng prepared statement → bị SQL injection
});

test('[SECURITY] Login - XSS trong field email', async ({ page }) => {
  // Kịch bản: nhập script tag → app không được execute JavaScript đó
  await goToLogin(page);

  // Lắng nghe nếu có dialog (alert) bị trigger bởi XSS
  let xssExecuted = false;
  page.on('dialog', async dialog => {
    xssExecuted = true;
    await dialog.dismiss();
  });

  await fillAndSubmit(page, '<script>alert("XSS")</script>', 'password123');

  // Chờ một chút để XSS có cơ hội trigger nếu có lỗ hổng
  await page.waitForTimeout(1000);

  expect(xssExecuted).toBeFalsy();

  // Bug tiềm ẩn: app render email từ server response mà không escape HTML
});

test('[SECURITY] Login - Không lưu password trong localStorage hay sessionStorage', async ({ page }) => {
  // Kịch bản: sau khi login, kiểm tra browser storage không chứa password plain text
  await goToLogin(page);
  await fillAndSubmit(page, VALID_EMAIL, VALID_PASSWORD);
  await page.waitForTimeout(2000); // chờ login xử lý xong

  const storageData = await page.evaluate(() => ({
    local:   JSON.stringify(localStorage),
    session: JSON.stringify(sessionStorage),
  }));

  // Password thật không được lưu dạng plain text
  expect(storageData.local).not.toContain(VALID_PASSWORD);
  expect(storageData.session).not.toContain(VALID_PASSWORD);

  // Bug tiềm ẩn: debug code vô tình log credential vào storage
});
