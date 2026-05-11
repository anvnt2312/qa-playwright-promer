# QA Skill — BDD to Playwright Auto Converter

## Nhiệm vụ chính

Khi tôi đưa file `.feature` (Gherkin BDD), hãy tự động:

1. Đọc từng Scenario Given/When/Then
2. Convert thành Playwright test script JavaScript
3. Map tags: `@happy` → happy path, `@negative` → error cases, `@edge` → boundary
4. Thêm comment tiếng Việt giải thích
5. Nhóm theo Feature (login, dashboard, form, search)
6. Tạo `playwright.config.js` với HTML reporter
7. Tạo page objects cho từng tính năng

---

## Cấu trúc output

```
tests/
  specs/          ← file test đã convert từ .feature
  pages/          ← page objects cho từng tính năng
  fixtures/       ← test data (email, password, mock data...)
  reports/        ← HTML reports
```

---

## Quy tắc convert Gherkin → Playwright

### 1. Map cấu trúc file

| Gherkin | Playwright |
|---|---|
| `Feature: Tên` | `test.describe('Tên', () => { ... })` |
| `Background:` | `test.beforeEach(async ({ page }) => { ... })` |
| `Scenario: Tên` | `test('Tên', async ({ page }) => { ... })` |
| `Scenario Outline:` | `for...of` loop hoặc `test.each([...])` |
| `Examples:` | Array of objects truyền vào `test.each` |

### 2. Map tags

| Tag Gherkin | Cách xử lý trong Playwright |
|---|---|
| `@happy` | Comment `// [HAPPY] — luồng chính` |
| `@negative` | Comment `// [NEGATIVE] — trường hợp lỗi` |
| `@edge` | Comment `// [EDGE] — biên/ngoại lệ` |
| `@ui` | Comment `// [UI] — kiểm tra giao diện` |
| `@perf` | Comment `// [PERF] — đo hiệu năng` |
| `@security` | Comment `// [SECURITY] — kiểm tra bảo mật` |
| `@skip` | `test.skip(...)` |

### 3. Map từng bước Given/When/Then

| Step Gherkin | Playwright code |
|---|---|
| `Given Tôi ở trang "URL"` | `await page.goto('URL')` |
| `Given Tôi đã đăng nhập` | Gọi `loginFixture(page)` từ fixtures |
| `When Tôi nhập "X" vào ô "Y"` | `await page.getByLabel('Y').fill('X')` |
| `When Tôi nhấn nút "Z"` | `await page.getByRole('button', { name: 'Z' }).click()` |
| `When Tôi nhấn phím "Enter"` | `await page.keyboard.press('Enter')` |
| `Then URL chứa "path"` | `await expect(page).toHaveURL(/path/)` |
| `Then Thông báo "X" hiển thị` | `await expect(page.getByText('X')).toBeVisible()` |
| `Then Element "X" không hiển thị` | `await expect(page.getByText('X')).not.toBeVisible()` |
| `Then Thuộc tính "attr" bằng "val"` | `await expect(locator).toHaveAttribute('attr', 'val')` |

### 4. Page Object pattern

Mỗi Feature tương ứng một Page Object class:

```javascript
// tests/pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page        = page;
    this.emailInput  = page.locator('input[autocomplete="email"]').first();
    this.passInput   = page.locator('input[autocomplete="current-password"]').first();
    this.submitBtn   = page.locator('button[type="submit"]').first();
  }

  async goto()                      { await this.page.goto('/sign-in'); }
  async fillEmail(email)            { await this.emailInput.fill(email); }
  async fillPassword(pass)          { await this.passInput.fill(pass); }
  async submit()                    { await this.submitBtn.click(); }
  async login(email, pass) {
    await this.goto();
    await this.fillEmail(email);
    await this.fillPassword(pass);
    await this.submit();
  }
}
module.exports = { LoginPage };
```

### 5. Fixture pattern

```javascript
// tests/fixtures/auth.fixture.js
const { test: base } = require('@playwright/test');
const { LoginPage }  = require('../pages/LoginPage');

const test = base.extend({
  // Fixture tự động đăng nhập trước mỗi test dùng nó
  loggedInPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(
      process.env.TEST_EMAIL,
      process.env.TEST_PASSWORD
    );
    await use(page);
  },
});

module.exports = { test };
```

---

## Ví dụ convert hoàn chỉnh

### Input — login.feature (đoạn trích)

```gherkin
@happy @AC-1.1
Scenario: Đăng nhập thành công với thông tin hợp lệ
  Given Tôi đang ở trang đăng nhập "https://app.promer.ai/sign-in"
  When  Tôi nhập email "anvnt@firegroup.io" vào ô email
  And   Tôi nhập password đúng vào ô password
  And   Tôi nhấn nút "Continue"
  Then  URL trang không còn chứa "/sign-in"
  And   Tôi được điều hướng vào bên trong ứng dụng
```

### Output — specs/login.spec.js (đoạn trích)

```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage }    = require('../pages/LoginPage');

// Đọc thông tin đăng nhập từ file .env
const EMAIL    = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

test.describe('Đăng nhập / Login Authentication', () => {

  // Mỗi test đều bắt đầu bằng việc mở trang login
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // [HAPPY] AC-1.1 — Luồng chính: đăng nhập thành công
  test('Đăng nhập thành công với thông tin hợp lệ', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Nhập email và password từ .env, không hardcode
    await loginPage.fillEmail(EMAIL);
    await loginPage.fillPassword(PASSWORD);
    await loginPage.submit();

    // Kiểm tra: URL phải rời khỏi trang /sign-in
    await expect(page).not.toHaveURL(/\/sign-in/);
  });

});
```

---

## Checklist khi convert

- [ ] Đọc toàn bộ file `.feature` trước khi bắt đầu viết code
- [ ] Tạo Page Object trước, sau đó mới viết spec
- [ ] Không hardcode email/password — luôn dùng `process.env`
- [ ] Mỗi `Scenario` → một `test()` riêng biệt
- [ ] `Background` → `test.beforeEach()`
- [ ] `Scenario Outline` + `Examples` → `test.each([...])`
- [ ] Tag `@perf` → dùng `Date.now()` để đo thời gian
- [ ] Tag `@security` → kiểm tra không có SQL error / XSS alert
- [ ] Thêm comment tiếng Việt giải thích mục đích từng bước
- [ ] Chạy thử sau khi convert: `npx playwright test tests/specs/`

---

## Lệnh chạy theo tag (sau khi convert)

```bash
# Chạy toàn bộ
npx playwright test tests/specs/

# Chạy theo tính năng
npx playwright test tests/specs/login.spec.js
npx playwright test tests/specs/dashboard.spec.js

# Chạy theo loại test (grep tag trong tên test)
npx playwright test --grep "\[HAPPY\]"
npx playwright test --grep "\[NEGATIVE\]"
npx playwright test --grep "\[EDGE\]"
npx playwright test --grep "\[PERF\]"
npx playwright test --grep "\[SECURITY\]"

# Xem HTML report
npx playwright show-report tests/reports/
```

---

## Tham chiếu file trong project

| File | Mục đích |
|---|---|
| `requirements.md` | Nguồn gốc AC và Edge Cases |
| `tests/features/*.feature` | File BDD Gherkin — input để convert |
| `tests/specs/*.spec.js` | File Playwright — output sau convert |
| `tests/pages/*.js` | Page Objects |
| `tests/fixtures/` | Test data và auth fixtures |
| `.env` | Thông tin đăng nhập (không commit Git) |
| `playwright.config.js` | Cấu hình chạy test và HTML reporter |
