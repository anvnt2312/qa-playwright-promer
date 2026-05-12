# Design: Login + Dashboard Regression Suite

**Ngày:** 2026-05-11  
**Tác giả:** QA Team  
**App:** https://app.promer.ai  
**Trigger:** Sau mỗi lần dev fix bug — chạy để xác nhận không có regression mới

---

## Mục tiêu

Tạo regression suite riêng biệt, chạy nhanh (~10-15 phút), ổn định (không flaky), tập trung vào Login + Dashboard — hai feature cốt lõi của app.promer.ai.

---

## Cấu trúc file

Tạo 2 file mới, **không sửa bất kỳ file hiện có**:

```
tests/
  regression/
    login-dashboard.spec.js   ← spec duy nhất của regression suite
playwright.regression.js      ← config riêng cho regression
```

Reuse hoàn toàn từ infrastructure hiện có:
- `tests/pages/LoginPage.js`
- `tests/pages/DashboardPage.js`
- `tests/fixtures/loginData.js`
- `tests/fixtures/dashboardData.js`

---

## Danh sách test

### Login (12 tests)

| # | Test | Tag | Xử lý |
|---|---|---|---|
| 1 | Đăng nhập thành công | HAPPY AC-1.1 | Bình thường |
| 2 | Nhớ phiên sau reload | HAPPY AC-1.2 | Bình thường |
| 3 | Nhấn Enter để submit | HAPPY AC-1.6 | Bình thường |
| 4 | Password sai → hiện lỗi | NEGATIVE AC-1.3 | Bình thường |
| 5 | Email không tồn tại → hiện lỗi | NEGATIVE AC-1.3 | Bình thường |
| 6 | Form trống → button disabled | NEGATIVE AC-1.4 | Bình thường |
| 7 | Email sai định dạng → inline error | NEGATIVE AC-1.5 | Bình thường |
| 8 | Email dài 252 ký tự không crash | EDGE EC-1.3 | Bình thường |
| 9 | SQL Injection bị chặn | EDGE EC-1.4 | Bình thường |
| 10 | Hiển thị đủ 3 element + 2 label | UI AC-1.7 | Bình thường |
| 11 | Email có khoảng trắng → login fail | EDGE EC-1.1 | `test.fail()` — BUG-02 |
| 12 | Thông báo lỗi giống nhau (user enum) | EDGE EC-1.6 | Bình thường — BUG-03 Fixed (2026-05-11) |

### Dashboard (4 tests)

| # | Test | Tag | Xử lý |
|---|---|---|---|
| 13 | Dashboard load sau khi login | HAPPY AC-2.1 | Bình thường |
| 14 | Các widget hiển thị đúng | HAPPY AC-2.3 | Bình thường |
| 15 | Chưa login → redirect về /sign-in | NEGATIVE EC-2.2 | `test.fail()` — BUG-04 |
| 16 | API 500 → không crash app shell | NEGATIVE EC-2.4 | `test.fail()` — BUG-05 |

**Tổng: 16 tests — 13 bình thường + 3 `test.fail()` (known bugs)**

> **Cập nhật 2026-05-11:** BUG-03 (EC-1.6) đã được fix — test.fail() báo "unexpected pass" khi chạy thực tế → chuyển EC-1.6 thành normal test. Regression suite hiện có 3 test.fail() thay vì 4.

### Loại bỏ khỏi regression (lý do)

| Test | Lý do loại bỏ |
|---|---|
| `[PERF] EC-1.7` Load < 3s | BUG-01 còn open, kết quả phụ thuộc mạng → không ổn định |
| `EC-1.5 XSS payload` | Flaky do `waitForTimeout(1000)` timing-sensitive |
| `EC-1.2 Password ký tự đặc biệt` | BUG chưa fix, gây Internal Server Error → test riêng |

---

## Config: playwright.regression.js

| Setting | Giá trị | Lý do |
|---|---|---|
| `retries` | `0` | Flaky phải lộ ra, không được che bằng retry |
| `timeout` | `20000ms` | Test ổn định không cần 30s |
| `projects` | Chromium only | Nhanh hơn 2x so với chromium + mobile |
| `reporter html output` | `reports/regression/` | Tách biệt khỏi full suite report |

---

## Lệnh chạy

```bash
# Chạy regression suite
npx playwright test --config=playwright.regression.js

# Xem HTML report
npx playwright show-report reports/regression
```

---

## Cách đọc kết quả

**Không có regression mới (bình thường):**
```
16 passed
0 failed
```
*Lưu ý: 4 test.fail() hiện là "passed" theo Playwright vì chúng fail đúng như dự kiến.*

**Phát hiện regression mới:**
```
1 failed — [HAPPY] AC-1.1 Đăng nhập thành công
→ Hành động: tạo bug report mới trong reports/bug-reports.md
```

**Một known bug được fix:**
```
1 unexpected pass — [EDGE] EC-1.1 Email có khoảng trắng
→ Hành động: đổi Status BUG-02 → Fixed, xóa test.fail() khỏi regression
```

---

## Known bugs hiện tại (4 bugs được track qua test.fail())

| Bug | Test | Severity |
|---|---|---|
| BUG-02 | EC-1.1 Email có khoảng trắng | Medium P2 |
| ~~BUG-03~~ | ~~EC-1.6 User enumeration~~ | ~~High P1~~ → **Fixed 2026-05-11** |
| BUG-04 | EC-2.2 Không redirect sau logout | Medium P2 |
| BUG-05 | EC-2.4 App vỡ khi API 500 | High P1 |

*BUG-01 (PERF) không đưa vào regression vì phụ thuộc network.*
