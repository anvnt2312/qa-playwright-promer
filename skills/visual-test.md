# Visual Test Skill — So sánh UI Screenshots để phát hiện Visual Bugs

## Mô tả
Visual testing là kỹ thuật **chụp ảnh màn hình và so sánh với ảnh chuẩn (baseline)** để phát hiện thay đổi UI không mong muốn — ví dụ: button bị lệch, màu sai, font thay đổi, element biến mất.

Playwright có sẵn `toHaveScreenshot()` — không cần thư viện ngoài.

## Khi nào dùng
- Sau khi dev thay đổi CSS hoặc design system
- Kiểm tra UI sau mỗi release để không có regression
- Khi sếp hỏi "trang này có bị thay đổi gì không?"
- Test responsive layout (desktop vs mobile)
- Kiểm tra dark mode vs light mode

---

## Cách hoạt động

```
Lần 1 (tạo baseline): chụp ảnh → lưu vào tests/snapshots/ → đây là "ảnh đúng"
Lần 2+ (so sánh):     chụp ảnh → so sánh pixel với baseline → fail nếu khác
```

---

## Setup trong playwright.config.js

```javascript
// playwright.config.js — thêm config cho visual test
module.exports = {
  use: {
    baseURL: process.env.BASE_URL || 'https://app.promer.ai',

    // Cấu hình screenshot comparison
    // threshold: % pixel được phép khác (0.1 = 10%) — tránh fail do anti-aliasing
  },

  // Thư mục lưu baseline screenshots
  // Playwright tự tạo: tests/specs/__snapshots__/
  snapshotPathTemplate: 'tests/snapshots/{testFilePath}/{arg}{ext}',
};
```

---

## Template Visual Test

```javascript
// tests/specs/visual.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage }    = require('../pages/LoginPage');

test.describe('[Visual] Kiểm tra giao diện / Visual Regression', () => {

  // ── Test toàn bộ trang ──────────────────────────────────────────────────
  test('[UI] Trang login trông đúng như baseline', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Chụp toàn bộ trang và so sánh với baseline
    // Lần đầu chạy: tạo file .png trong tests/snapshots/
    // Lần sau: so sánh với file đó
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.02, // Cho phép 2% pixel khác (để tránh false positive do font rendering)
    });
  });

  // ── Test một element cụ thể ─────────────────────────────────────────────
  test('[UI] Form login — layout đúng', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Chụp chỉ phần form, không chụp toàn trang
    const form = page.locator('form').first();
    await expect(form).toHaveScreenshot('login-form.png');
  });

  // ── Test responsive: mobile viewport ────────────────────────────────────
  test('[UI] Trang login trên mobile (390×844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveScreenshot('login-mobile.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  // ── Test trạng thái lỗi ─────────────────────────────────────────────────
  test('[UI] Giao diện khi có lỗi đăng nhập', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong@email.com', 'wrongpass');

    // Chờ error message xuất hiện
    await loginPage.errorMsg.waitFor({ state: 'visible', timeout: 5000 });

    // Chụp ảnh trạng thái lỗi
    await expect(page).toHaveScreenshot('login-error-state.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  // ── Test dark mode (nếu app có) ─────────────────────────────────────────
  test('[UI] Trang login — dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveScreenshot('login-dark-mode.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

});
```

---

## Lệnh quan trọng

```bash
# Lần đầu: tạo baseline screenshots (--update-snapshots)
npx playwright test tests/specs/visual.spec.js --update-snapshots

# Lần sau: so sánh với baseline (chạy bình thường)
npx playwright test tests/specs/visual.spec.js

# Khi UI thay đổi có chủ ý (sau khi dev cập nhật design):
# Cập nhật baseline với ảnh mới
npx playwright test tests/specs/visual.spec.js --update-snapshots

# Chạy tất cả visual test
npx playwright test --grep "\[UI\]"

# Xem HTML report với ảnh diff (rất hữu ích để thấy phần nào bị thay đổi)
npx playwright show-report
```

---

## Xem ảnh diff khi test fail

Khi visual test fail, Playwright tự động tạo 3 file trong `test-results/`:
- `test-failed-1.png` — ảnh chụp lúc test chạy (actual)
- `*-expected.png` — ảnh baseline (expected)
- `*-diff.png` — ảnh highlight phần khác nhau (màu đỏ = thay đổi)

```bash
# Mở HTML report — có tab "Diff" để xem ảnh so sánh trực quan
npx playwright show-report
```

---

## Các trường hợp cần mask (che bớt trước khi chụp)

```javascript
test('[UI] Dashboard — mask phần thay đổi theo thời gian', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveScreenshot('dashboard.png', {
    // Che các element có nội dung thay đổi (ngày giờ, số liệu realtime)
    mask: [
      page.locator('.current-date'),     // Ngày giờ hiện tại
      page.locator('.realtime-stats'),   // Số liệu thay đổi
      page.locator('.user-avatar'),      // Ảnh đại diện
    ],
    maxDiffPixelRatio: 0.02,
  });
});
```

---

## Cấu trúc thư mục sau khi chạy

```
tests/
  snapshots/
    visual.spec.js/
      login-page-chromium.png        ← baseline (commit vào git)
      login-mobile-chromium.png
      login-error-state-chromium.png
test-results/
  visual--login-page/
    test-failed-1.png                ← actual (khi fail)
    login-page-chromium-expected.png ← expected
    login-page-chromium-diff.png     ← diff highlight
```

---

## Checklist visual test

- [ ] Chạy `--update-snapshots` một lần để tạo baseline
- [ ] Commit file baseline vào git (trong `tests/snapshots/`)
- [ ] Dùng `maxDiffPixelRatio: 0.02` để tránh false positive do font rendering
- [ ] Mask các element thay đổi theo thời gian (ngày, số liệu realtime)
- [ ] Test cả desktop và mobile viewport
- [ ] Khi design thay đổi có chủ ý → chạy `--update-snapshots` và commit baseline mới
