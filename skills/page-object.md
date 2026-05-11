# Page Object Skill — Tạo Page Object Model chuẩn cho Playwright

## Mô tả
Page Object Model (POM) là pattern tách biệt **logic tìm element** khỏi **logic test**. Mỗi trang web có một class riêng chứa tất cả locator và thao tác — test chỉ gọi method, không biết selector bên trong.

**Lợi ích:** Khi UI thay đổi (button đổi chỗ, class đổi tên), chỉ sửa ở Page Object — không cần sửa từng test.

## Khi nào dùng
- Bắt đầu test một trang web mới
- Khi nhiều test cùng thao tác trên một trang
- Khi locator lặp lại ở nhiều file test
- Trước khi viết `.spec.js` — luôn tạo Page Object trước

---

## Cấu trúc file Page Object

```
tests/
  pages/
    LoginPage.js      ← 1 page = 1 file
    DashboardPage.js
    FormPage.js
    SearchPage.js
  specs/
    login.spec.js     ← import và dùng LoginPage
```

---

## Template Page Object chuẩn

```javascript
// tests/pages/TemplatePage.js
// Thay "Template" bằng tên trang thực tế: Login, Dashboard, Form, Search...

class TemplatePage {
  constructor(page) {
    this.page = page;

    // ── Locators ─────────────────────────────────────────────────────────────
    // Quy tắc ưu tiên locator (từ tốt nhất → kém nhất):
    // 1. getByRole()       — theo ARIA role, accessible, ổn định nhất
    // 2. getByLabel()      — theo label text (input field)
    // 3. getByPlaceholder() — theo placeholder text
    // 4. getByText()       — theo text hiển thị
    // 5. locator('[data-testid="..."]') — data-testid do dev thêm vào
    // 6. locator('.class') — class CSS (tránh nếu có thể, dễ thay đổi)

    // Ví dụ — thay bằng locator thực tế của trang:
    this.heading    = page.getByRole('heading', { name: 'Tên trang' });
    this.submitBtn  = page.getByRole('button', { name: 'Submit' });
    this.emailInput = page.locator('input[autocomplete="email"]').first();
    this.errorMsg   = page.locator('[role="alert"]').first();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  async goto() {
    await this.page.goto('/duong-dan-trang');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  // Chờ trang load xong — gọi sau goto() nếu cần chắc chắn
  async waitForReady() {
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
    await this.submitBtn.waitFor({ state: 'visible', timeout: 10000 });
  }

  // ── Thao tác (Actions) ─────────────────────────────────────────────────────
  // Mỗi thao tác = 1 method, tên rõ ràng theo hành động người dùng
  async clickSubmit() {
    await this.submitBtn.click();
  }

  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  // Helper tổng hợp nhiều bước — dùng trong beforeEach hoặc test
  async doSomething(param1, param2) {
    await this.fillEmail(param1);
    await this.clickSubmit();
  }

  // ── Assertions / Truy vấn trạng thái ──────────────────────────────────────
  // Trả về boolean hoặc text — KHÔNG dùng expect() trong Page Object
  // Để expect() trong file test (.spec.js)
  async isErrorVisible() {
    return this.errorMsg.isVisible().catch(() => false);
  }

  async getErrorText() {
    await this.errorMsg.waitFor({ state: 'visible', timeout: 5000 });
    return (await this.errorMsg.textContent() || '').trim();
  }

  async isButtonDisabled() {
    const ariaDisabled = await this.submitBtn.getAttribute('aria-disabled');
    const classAttr    = await this.submitBtn.getAttribute('class') || '';
    return ariaDisabled === 'true' || classAttr.includes('disabled');
  }
}

module.exports = { TemplatePage };
```

---

## Ví dụ thực tế — LoginPage cho app.promer.ai

```javascript
// tests/pages/LoginPage.js
// Design System: Shopify Polaris
// Polaris dùng autocomplete attribute, không phải type="email"

class LoginPage {
  constructor(page) {
    this.page = page;

    this.emailInput       = page.locator('input[autocomplete="email"]').first();
    this.passInput        = page.locator('input[autocomplete="current-password"]').first();
    this.submitBtn        = page.locator('button[type="submit"]').first();
    this.errorMsg         = page.locator('.Polaris-Text--critical, [role="alert"]').first();
    this.emailFormatError = page.locator('text=Enter a valid email').first();
  }

  async goto() {
    await this.page.goto('/sign-in');
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passInput.fill(password);
    await this.submitBtn.click();
  }

  async getErrorText() {
    await this.errorMsg.waitFor({ state: 'visible', timeout: 5000 });
    return (await this.errorMsg.textContent() || '').trim();
  }

  async isButtonDisabled() {
    const ariaDisabled = await this.submitBtn.getAttribute('aria-disabled');
    return ariaDisabled === 'true';
  }
}

module.exports = { LoginPage };
```

---

## Cách dùng trong file test

```javascript
// tests/specs/login.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage }    = require('../pages/LoginPage');

test.describe('[Login]', () => {

  // beforeEach: mở trang trước mỗi test — KHÔNG lặp goto() trong từng test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('[HAPPY] Đăng nhập thành công', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Gọi method — không biết selector là gì bên trong
    await loginPage.login(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);

    // expect() nằm trong test, không nằm trong Page Object
    await expect(page).not.toHaveURL(/\/sign-in/);
  });

  test('[NEGATIVE] Sai password — hiện lỗi', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(process.env.TEST_EMAIL, 'wrong-pass');

    const errorText = await loginPage.getErrorText();
    expect(errorText).toBeTruthy();
  });

});
```

---

## Checklist tạo Page Object mới

- [ ] Tên file: `TênTrangPage.js` (PascalCase)
- [ ] Đặt trong `tests/pages/`
- [ ] Locator theo thứ tự ưu tiên: role → label → placeholder → text → data-testid → CSS
- [ ] Thêm `.first()` cho locator có thể match nhiều element
- [ ] Method tên rõ ràng: `fillEmail()`, `clickSubmit()`, không phải `action1()`
- [ ] `expect()` đặt trong `.spec.js`, không trong Page Object
- [ ] `module.exports = { TênTrangPage }`

---

## Quy tắc đặt tên locator theo Design System

| Design System    | Locator đặc biệt cần biết                                        |
|---|---|
| Shopify Polaris  | `input[autocomplete="email"]`, `aria-disabled` cho button        |
| Material UI      | `[class*="MuiButton"]`, `.MuiAlert-message` cho error            |
| Ant Design       | `.ant-input`, `.ant-form-item-explain-error`                     |
| Tailwind CSS     | Không có class cố định — ưu tiên dùng `data-testid`              |
| Vanilla HTML     | `input[type="email"]`, `button[type="submit"]` — chuẩn W3C       |
