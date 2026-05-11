// Nhập thư viện Playwright để sử dụng các hàm test
const { test, expect } = require('@playwright/test');

// ─── Test 1: Kiểm tra tiêu đề trang ───────────────────────────────────────
test('Kiểm tra tiêu đề trang example.com', async ({ page }) => {
  // Mở trình duyệt và truy cập vào trang web cần test
  await page.goto('https://example.com');

  // Lấy tiêu đề (title) của trang web đang mở
  const title = await page.title();

  // Kiểm tra xem tiêu đề có chứa chữ "Example Domain" không
  // Nếu đúng → test PASS, nếu sai → test FAIL
  expect(title).toContain('Example Domain');
});

// ─── Test 2: Kiểm tra có link trên trang ──────────────────────────────────
test('Kiểm tra trang có chứa ít nhất 1 link', async ({ page }) => {
  // Truy cập trang web
  await page.goto('https://example.com');

  // Tìm tất cả các thẻ <a> (link) trên trang và đếm số lượng
  const links = page.locator('a');

  // Kiểm tra số lượng link phải lớn hơn 0 (tức là có ít nhất 1 link)
  await expect(links).toHaveCount(1);
});

// ─── Test 3: Kiểm tra trang load trong vòng 3 giây ────────────────────────
test('Kiểm tra trang load trong vòng 3 giây', async ({ page }) => {
  // Ghi lại thời điểm bắt đầu (tính bằng mili giây)
  const startTime = Date.now();

  // Truy cập trang và chờ đến khi trang load xong hoàn toàn
  // 'load' nghĩa là chờ tất cả ảnh, script, css đều tải xong
  await page.goto('https://example.com', { waitUntil: 'load' });

  // Tính thời gian load = thời điểm hiện tại - thời điểm bắt đầu
  const loadTime = Date.now() - startTime;

  // In ra console để xem tốc độ thực tế (hữu ích khi debug)
  console.log(`Thời gian load trang: ${loadTime}ms`);

  // Kiểm tra thời gian load phải nhỏ hơn 3000ms (= 3 giây)
  expect(loadTime).toBeLessThan(3000);
});
