# Performance Test Skill — Đo hiệu năng với Playwright

## Nhiệm vụ chính

Khi tôi yêu cầu test performance cho một trang hoặc chức năng, hãy tạo Playwright test đo hiệu năng theo chuẩn dưới đây.

---

## Ngưỡng SLA cho app.promer.ai

| Loại trang        | Ngưỡng tối đa | Ghi chú                          |
|---|---|---|
| Trang login       | 3000ms        | BUG-001: hiện tại 3.6–4.2s       |
| Dashboard         | 3000ms        | Load lần đầu sau login            |
| Trang có danh sách | 2000ms       | Filter + search phải nhanh        |
| API response      | 1000ms        | Backend không tính thời gian render |
| Tìm kiếm (debounce) | 1000ms      | Sau khi debounce 300–500ms kết thúc |

---

## Cách đo thời gian load trang

### Cách 1: Dùng Date.now() — đơn giản nhất

```javascript
test('[PERF] Trang login load dưới 3 giây', async ({ page }) => {
  const start = Date.now();

  await page.goto('/sign-in', { waitUntil: 'load' });

  const loadTime = Date.now() - start;
  console.log(`⏱ Thời gian load: ${loadTime}ms`);

  expect(loadTime).toBeLessThan(3000);
});
```

### Cách 2: Dùng Performance API của browser — chính xác hơn

```javascript
test('[PERF] Đo navigation timing chính xác', async ({ page }) => {
  await page.goto('/sign-in', { waitUntil: 'load' });

  // Lấy thông tin timing từ browser
  const perfData = await page.evaluate(() => {
    const [entry] = performance.getEntriesByType('navigation');
    return {
      domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
      loadComplete:     Math.round(entry.loadEventEnd),
      firstByte:        Math.round(entry.responseStart - entry.requestStart),
    };
  });

  console.log('Performance metrics:', perfData);

  expect(perfData.loadComplete).toBeLessThan(3000);
  expect(perfData.firstByte).toBeLessThan(500); // TTFB < 500ms
});
```

### Cách 3: Đo Core Web Vitals (LCP, CLS, FCP)

```javascript
test('[PERF] Core Web Vitals — LCP dưới 2.5 giây', async ({ page }) => {
  await page.goto('/sign-in', { waitUntil: 'networkidle' });

  // Đo Largest Contentful Paint
  const lcp = await page.evaluate(() =>
    new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(Math.round(entries[entries.length - 1].startTime));
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      // Fallback sau 5 giây
      setTimeout(() => resolve(null), 5000);
    })
  );

  console.log(`LCP: ${lcp}ms`);
  if (lcp !== null) {
    expect(lcp).toBeLessThan(2500); // Google: LCP < 2.5s = "Good"
  }
});
```

---

## Đo thời gian thao tác người dùng

```javascript
test('[PERF] Login action hoàn thành dưới 2 giây', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.waitForReady();

  await loginPage.fillEmail(process.env.TEST_EMAIL);
  await loginPage.fillPassword(process.env.TEST_PASSWORD);

  // Đo từ lúc submit đến khi redirect
  const start = Date.now();
  await loginPage.submit();
  await page.waitForURL((url) => !url.includes('/sign-in'), { timeout: 10000 });
  const actionTime = Date.now() - start;

  console.log(`⏱ Login redirect time: ${actionTime}ms`);
  expect(actionTime).toBeLessThan(2000);
});
```

---

## Đo debounce search

```javascript
test('[PERF] Search debounce — API chỉ gọi 1 lần sau khi gõ xong', async ({ page }) => {
  let apiCallCount = 0;

  // Theo dõi số lần gọi API search
  page.on('request', (req) => {
    if (req.url().includes('/api/search') || req.url().includes('q=')) {
      apiCallCount++;
    }
  });

  // Gõ nhanh 10 ký tự
  const searchBox = page.locator('input[type="search"], input[placeholder*="Search"]').first();
  for (const char of 'PromerTest') {
    await searchBox.type(char, { delay: 80 }); // 80ms/ký tự = ~800ms tổng
  }

  // Chờ debounce kết thúc (500ms)
  await page.waitForTimeout(600);

  console.log(`API calls: ${apiCallCount}`);
  expect(apiCallCount).toBeLessThan(5); // Debounce nên giảm xuống 1-2 lần
});
```

---

## Cấu trúc output và lưu kết quả

```javascript
// Lưu kết quả vào reports/ để so sánh theo thời gian
const fs = require('fs');

test.afterAll(async () => {
  const results = { date: new Date().toISOString(), tests: perfResults };
  fs.writeFileSync('reports/perf-results.json', JSON.stringify(results, null, 2));
});
```

---

## Checklist khi viết performance test

- [ ] Dùng `waitUntil: 'load'` hoặc `'networkidle'` tùy mục đích
- [ ] Log thời gian ra console để dễ debug
- [ ] So sánh với ngưỡng SLA trong bảng trên
- [ ] Ghi chú nếu kết quả vượt ngưỡng (như BUG-001)
- [ ] Lưu kết quả vào `reports/` để theo dõi trend

---

## Lệnh chạy performance test

```bash
# Chạy tất cả PERF test
npx playwright test --grep "\[PERF\]"

# Xem kết quả chi tiết với console.log
npx playwright test --grep "\[PERF\]" --reporter=list

# Lưu report vào reports/
npx playwright test --grep "\[PERF\]" --reporter=html --output=reports/perf-report
```
