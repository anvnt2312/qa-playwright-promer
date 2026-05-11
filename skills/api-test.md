# API Test Skill — Kiểm tra API với Playwright

## Nhiệm vụ chính

Khi tôi đưa endpoint API hoặc mô tả chức năng backend, hãy tạo Playwright API test theo chuẩn dưới đây.

---

## Cách dùng Playwright để test API

Playwright có thể gọi API trực tiếp bằng `request` context — không cần mở browser.

```javascript
const { test, expect } = require('@playwright/test');

test.describe('API Tests — Login', () => {

  test('[API] POST /api/auth/login — thành công', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email:    process.env.TEST_EMAIL,
        password: process.env.TEST_PASSWORD,
      },
    });

    // Kiểm tra status code
    expect(response.status()).toBe(200);

    // Kiểm tra body có token
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
  });

  test('[API] POST /api/auth/login — sai password trả về 401', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email:    process.env.TEST_EMAIL,
        password: 'wrong-password',
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    // Thông báo lỗi không được lộ chi tiết kỹ thuật
    expect(body.message).not.toMatch(/sql|database|stack trace/i);
  });

});
```

---

## Map HTTP Status Code → Test case

| Status | Ý nghĩa              | Khi nào test                              |
|---|---|---|
| 200    | Thành công           | Happy case — data trả về đúng             |
| 201    | Tạo mới thành công   | POST tạo resource mới                     |
| 400    | Request sai format   | Negative — body thiếu field, sai kiểu     |
| 401    | Chưa xác thực        | Negative — sai password, hết token        |
| 403    | Không có quyền       | Negative — user thường truy cập admin API |
| 404    | Không tìm thấy       | Negative — ID không tồn tại               |
| 422    | Dữ liệu không hợp lệ | Negative — validation error               |
| 500    | Lỗi server           | Edge — không bao giờ được xảy ra với input hợp lệ |

---

## Cấu trúc file API test

```
tests/
  specs/
    login.spec.js       ← UI tests
    login.api.spec.js   ← API tests cho cùng feature
  fixtures/
    loginData.js        ← dùng chung cho UI và API test
```

---

## Checklist khi viết API test

- [ ] Luôn dùng `process.env` cho credentials, không hardcode
- [ ] Test cả happy case (2xx) và error case (4xx, 5xx)
- [ ] Kiểm tra response body có đúng fields không
- [ ] Kiểm tra error message không lộ thông tin kỹ thuật (SQL, stack trace)
- [ ] Test với Authorization header cho endpoint cần auth
- [ ] Đo response time cho endpoint quan trọng

---

## Cách thêm Authorization header

```javascript
test('[API] GET /api/campaigns — cần auth', async ({ request }) => {
  // Bước 1: Login để lấy token
  const loginRes = await request.post('/api/auth/login', {
    data: { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD },
  });
  const { token } = await loginRes.json();

  // Bước 2: Gọi API với token
  const response = await request.get('/api/campaigns', {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);
});
```

---

## Lệnh chạy API test

```bash
# Chạy tất cả API test
npx playwright test --grep "\[API\]"

# Chạy API test không mở browser (nhanh hơn)
npx playwright test tests/specs/*.api.spec.js
```
