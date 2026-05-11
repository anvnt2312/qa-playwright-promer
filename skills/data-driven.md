# Data-Driven Test Skill — Test với nhiều bộ dữ liệu

## Mô tả
Data-driven testing là kỹ thuật chạy **cùng một kịch bản test với nhiều bộ dữ liệu khác nhau**. Thay vì viết 5 test giống nhau chỉ khác data, viết 1 test + 1 bảng dữ liệu — Playwright tự chạy 5 lần.

**Lợi ích:** Ít code hơn, dễ thêm data mới, dễ đọc.

## Khi nào dùng
- Test form validation với nhiều loại input sai
- Test login với nhiều account khác nhau
- Test tìm kiếm với nhiều từ khóa
- Khi `Scenario Outline` + `Examples` xuất hiện trong file `.feature`
- Khi có 3+ test cases giống nhau, chỉ khác data

---

## Cách 1: `test.each()` — cơ bản nhất

```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage }    = require('../pages/LoginPage');

// Bảng dữ liệu: mỗi object = 1 lần chạy test
const INVALID_INPUTS = [
  { desc: 'email trống',     email: '',                  password: 'pass123',  expectError: true },
  { desc: 'password trống',  email: 'user@example.com',  password: '',         expectError: true },
  { desc: 'email sai format',email: 'not-an-email',      password: 'pass123',  expectError: true },
  { desc: 'cả hai trống',    email: '',                  password: '',         expectError: true },
  { desc: 'SQL injection',   email: "' OR '1'='1",       password: 'anything', expectError: true },
];

test.describe('[Login] Validation — Data Driven', () => {

  // test.each nhận array, tạo 1 test cho mỗi phần tử
  // ${desc} trong tên test sẽ được thay bằng giá trị thực
  for (const { desc, email, password, expectError } of INVALID_INPUTS) {
    test(`[NEGATIVE] Input không hợp lệ — ${desc}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, password);

      if (expectError) {
        const hasError = await loginPage.isErrorVisible();
        expect(hasError).toBe(true);
      } else {
        await expect(page).not.toHaveURL(/\/sign-in/);
      }
    });
  }

});
```

---

## Cách 2: `test.each()` với tagged template literal — gọn hơn

```javascript
// Dạng array of arrays — cột theo thứ tự tham số
test.each([
  ['email trống',      '',                 'pass123'],
  ['password trống',   'user@example.com', ''       ],
  ['email sai format', 'not-an-email',     'pass123'],
])('[NEGATIVE] Login thất bại — %s', async (desc, email, password, { page }) => {
  // Lưu ý: page fixture phải là tham số cuối khi dùng dạng này
  // → Thực tế dùng for...of dễ hơn với Playwright
});
```

---

## Cách 3: Dữ liệu từ file riêng (fixtures)

```javascript
// tests/fixtures/loginData.js — tập trung tất cả data ở đây
const VALID = {
  email:    process.env.TEST_EMAIL,
  password: process.env.TEST_PASSWORD,
};

const INVALID = {
  wrongPassword:    'wrong-password-999',
  nonExistentEmail: 'notexist_xyz@fake.com',
  badFormatEmail:   'not-an-email',
  emptyString:      '',
};

// Data cho test.each — mảng các bộ dữ liệu
const INVALID_LOGIN_CASES = [
  { desc: 'sai password',      email: VALID.email,            password: INVALID.wrongPassword    },
  { desc: 'email không tồn tại', email: INVALID.nonExistentEmail, password: INVALID.wrongPassword },
  { desc: 'email sai format',  email: INVALID.badFormatEmail, password: 'anypass'               },
  { desc: 'cả hai trống',      email: INVALID.emptyString,    password: INVALID.emptyString     },
];

module.exports = { VALID, INVALID, INVALID_LOGIN_CASES };
```

```javascript
// tests/specs/login.spec.js — import và dùng
const { VALID, INVALID_LOGIN_CASES } = require('../fixtures/loginData');

test.describe('[Login] Data-Driven Negative Cases', () => {
  for (const { desc, email, password } of INVALID_LOGIN_CASES) {
    test(`[NEGATIVE] ${desc}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, password);

      const hasError = await loginPage.isErrorVisible();
      expect(hasError, `Phải có lỗi khi: ${desc}`).toBe(true);
    });
  }
});
```

---

## Cách 4: Playwright Fixtures — tái sử dụng setup phức tạp

```javascript
// tests/fixtures/auth.fixture.js
const { test: base } = require('@playwright/test');
const { LoginPage }  = require('../pages/LoginPage');

// Extend fixture mặc định — thêm fixture "loggedInPage"
const test = base.extend({
  // Fixture này tự động đăng nhập trước mỗi test dùng nó
  loggedInPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);
    // Chờ đăng nhập xong (URL rời khỏi /sign-in)
    await page.waitForURL((url) => !url.includes('/sign-in'), { timeout: 10000 });
    // "use" là điểm trao control cho test — sau use() là cleanup
    await use(page);
    // Cleanup nếu cần (ví dụ: logout) — optional
  },
});

module.exports = { test };
```

```javascript
// tests/specs/dashboard.spec.js — dùng fixture loggedInPage
const { test } = require('../fixtures/auth.fixture');
const { expect } = require('@playwright/test');

test.describe('[Dashboard] — Cần đăng nhập trước', () => {

  // Dùng "loggedInPage" thay vì "page" — tự động đăng nhập
  test('[HAPPY] Dashboard hiển thị đúng sau login', async ({ loggedInPage }) => {
    await expect(loggedInPage).not.toHaveURL(/\/sign-in/);
    await expect(loggedInPage.getByRole('heading')).toBeVisible();
  });

  test('[HAPPY] Tên user hiển thị trên header', async ({ loggedInPage }) => {
    const header = loggedInPage.locator('header');
    await expect(header).toBeVisible();
  });

});
```

---

## Ví dụ từ file search.feature — Scenario Outline

```gherkin
# Trong .feature file
Scenario Outline: Tìm kiếm không phân biệt hoa/thường
  When  Tôi nhập "<keyword>" vào ô tìm kiếm
  Then  Item "Apple Campaign" được tìm thấy

  Examples:
    | keyword |
    | apple   |
    | Apple   |
    | APPLE   |
    | aPpLe   |
```

```javascript
// Convert sang Playwright data-driven
const CASE_INSENSITIVE_KEYWORDS = ['apple', 'Apple', 'APPLE', 'aPpLe'];

test.describe('[Search] Case-insensitive', () => {
  for (const keyword of CASE_INSENSITIVE_KEYWORDS) {
    test(`[EDGE] Tìm "${keyword}" — vẫn thấy "Apple Campaign"`, async ({ page }) => {
      const searchBox = page.locator('input[type="search"]').first();
      await searchBox.fill(keyword);
      await page.waitForTimeout(500); // chờ debounce

      await expect(page.getByText('Apple Campaign')).toBeVisible();
    });
  }
});
```

---

## Checklist data-driven test

- [ ] Data đặt trong `tests/fixtures/` — không hardcode trong spec
- [ ] Tên test bao gồm mô tả data: `[NEGATIVE] Login — ${desc}`
- [ ] Dùng `for...of` thay vì `test.each(array-of-arrays)` cho dễ đọc hơn
- [ ] Fixture (`auth.fixture.js`) cho setup phức tạp tái dùng nhiều lần
- [ ] Khi convert `Scenario Outline` + `Examples` → luôn dùng data-driven
- [ ] Thêm message vào `expect()`: `expect(val, 'Mô tả khi fail').toBe(true)`
