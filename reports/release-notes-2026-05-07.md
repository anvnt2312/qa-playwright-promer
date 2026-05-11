# Test Report — Login / Authentication
**Ngày báo cáo:** 2026-05-07
**Tester:** QA Team
**Môi trường:** https://app.promer.ai
**Feature:** Login / Authentication (Sprint 1)
**Browser:** Chromium + Mobile Chrome (iPhone 13)

---

## Tóm tắt kết quả / Executive Summary

| Chỉ số            | Số lượng |
|---|---|
| Tổng test cases   | 17       |
| ✅ Pass            | 13       |
| ❌ Fail            | 4        |
| ⚠️ Skip            | 0        |
| Tỉ lệ pass        | 76%      |

**Đề xuất:** ❌ NO-GO

> **Lý do:** Tìm thấy 1 lỗ hổng bảo mật nghiêm trọng (BUG-03 — User Enumeration, OWASP A07:2021). Hacker có thể dùng trang login để liệt kê email người dùng đã đăng ký. **Không được release lên production cho đến khi BUG-03 được fix và retest.**

---

## Kết quả theo loại test / Results by Test Type

| Loại test    | Tổng | ✅ Pass | ❌ Fail | ⚠️ Skip | Ghi chú                                    |
|---|---|---|---|---|---|
| Happy case   | 3    | 3       | 0       | 0        | Luồng chính hoạt động tốt                  |
| Negative     | 5    | 5       | 0       | 0        | Validation form đúng, error message đúng   |
| Edge case    | 6    | 3       | 3       | 0        | EC-1.1, EC-1.6 fail bug; EC-1.2 nghi vấn  |
| UI / Layout  | 2    | 2       | 0       | 0        | Desktop + mobile layout đúng               |
| Performance  | 1    | 0       | 1       | 0        | EC-1.7 load time vượt SLA 3000ms           |
| **Tổng**     | **17** | **13** | **4**  | **0**    |                                            |

---

## Bug tìm được / Bugs Found

| ID      | Tên bug                                              | Severity    | Priority | Status | Test Case       |
|---|---|---|---|---|---|
| BUG-01  | Trang login load chậm (3.6–4.2s > SLA 3000ms)       | Medium      | P2       | Open   | [PERF] EC-1.7   |
| BUG-02  | Email có khoảng trắng không được trim → login fail   | Medium      | P2       | Open   | [EDGE] EC-1.1   |
| BUG-03  | **Lỗ hổng bảo mật: User Enumeration qua error msg** | **High**    | **P1**   | Open   | [EDGE] EC-1.6   |

**Tổng bug mới:** 3 (Critical: 0, **High: 1**, Medium: 2, Low: 0)

> **Lưu ý thêm:** Test `[EDGE] EC-1.2` (Password ký tự đặc biệt) cũng bị FAIL trên cả Chromium và Mobile. Nguyên nhân đang điều tra — có thể là false positive do chuỗi "500" xuất hiện trong HTML (script asset name) thay vì lỗi server thật. Cần review lại assertion của test này.

---

## Chi tiết từng test FAIL / Failed Test Details

### ❌ BUG-01 — Trang login load chậm

- **Test:** `[PERF] EC-1.7 — Trang login load xong trong 3 giây`
- **Kết quả thực tế:** 3,624ms (dao động 3,600–4,200ms tùy lần chạy)
- **Expected:** < 3,000ms (SLA)
- **Playwright Error:**
  ```
  Error: expect(received).toBeLessThan(expected)
  Expected: < 3000
  Received: 3624
  ```
- **Tác động:** Người dùng chờ ~1s lâu hơn; ảnh hưởng rõ trên mạng chậm (3G, wifi yếu)
- **Đề xuất:** Bật CDN, lazy load ảnh testimonial, phân tích Network waterfall

---

### ❌ BUG-02 — Email có khoảng trắng không được trim

- **Test:** `[EDGE] EC-1.1 — Email có khoảng trắng đầu/cuối: app nên tự trim`
- **Kết quả thực tế:** App hiện `"Enter a valid email"` và giữ URL tại `/sign-in`
- **Expected:** App trim space tự động → login thành công
- **Playwright Error:**
  ```
  Error: expect(page).not.toHaveURL(expected) failed
  Expected pattern: not /\/sign-in/
  Received string: "https://app.promer.ai/sign-in"
  ```
- **Browser:** FAIL trên cả **Chromium** và **Mobile Chrome** (retry 2 lần đều fail)
- **Tác động:** User copy-paste email từ email client → bị block không login được
- **Đề xuất:** `email.trim()` trước khi validate (frontend + backend)

---

### ❌ BUG-03 — ⚠️ User Enumeration (Security)

- **Test:** `[EDGE] EC-1.6 — Thông báo lỗi giống nhau cho email sai vs password sai`
- **Kết quả thực tế:** Hai error message khác nhau tiết lộ email có tồn tại hay không:
  ```
  Email không tồn tại → "You mistyped your email, can you check it?"
  Email đúng + password sai → "Invalid email or password"
  ```
- **Expected:** Luôn trả về `"Invalid email or password"` cho cả hai trường hợp
- **Playwright Error:**
  ```
  Error: expect(received).toBe(expected) // Object.is equality
  Expected: "You mistyped your email, can you check it?"
  Received: "Invalid email or password"
  ```
- **Tác động (Security):**
  - Hacker có thể tự động thu thập danh sách email hợp lệ
  - Tối ưu tấn công brute-force chỉ vào email đã xác nhận tồn tại
  - Vi phạm **OWASP A07:2021 — Identification and Authentication Failures**
  - **CWE-204: Observable Response Discrepancy**
- **Đề xuất:** Backend luôn trả cùng 1 message và cùng HTTP status bất kể lý do fail

---

## Test nào PASS / Tests Passing

| Test Case | Tên test                                                   | Browser         |
|---|---|---|
| AC-1.1    | Đăng nhập thành công với thông tin hợp lệ                  | Chromium        |
| AC-1.2    | Phiên đăng nhập duy trì sau khi reload                     | Chromium        |
| AC-1.6    | Nhấn Enter trên ô password để submit                       | Chromium        |
| AC-1.3a   | Thất bại khi password sai                                  | Chromium        |
| AC-1.3b   | Thất bại khi email không tồn tại                           | Chromium        |
| AC-1.4a   | Nút Continue bị disable khi form trống                     | Chromium        |
| AC-1.4b   | Nút Continue bị disable khi thiếu password                 | Chromium        |
| AC-1.5    | Lỗi inline khi email sai định dạng                         | Chromium        |
| EC-1.3    | Email dài 252 ký tự không làm crash server                 | Chromium        |
| EC-1.4    | SQL Injection bị chặn                                      | Chromium        |
| EC-1.5    | XSS payload không được thực thi                            | Chromium        |
| UI AC-1.7 | Trang login hiển thị đủ 3 element và 2 label               | Chromium        |
| UI Mobile | Trang login không vỡ layout trên mobile (iPhone 13 390px)  | Mobile Chrome   |

---

## Test coverage / Độ phủ test

| Loại test    | Số lượng | Kết quả                                         |
|---|---|---|
| Happy case   | 3        | ✅ Tất cả pass — luồng chính hoạt động đúng      |
| Negative     | 5        | ✅ Tất cả pass — validation và error msg đúng    |
| Edge case    | 6        | ❌ 3 fail — email trim, user enum, special char  |
| UI/Visual    | 2        | ✅ Tất cả pass — layout desktop + mobile đúng    |
| Performance  | 1        | ❌ 1 fail — load time 3.6s vượt SLA 3s          |
| Security     | 2        | ✅ SQL injection + XSS đều bị chặn đúng          |

---

## Rủi ro còn lại / Remaining Risks

| Mức độ | Rủi ro                                                                   |
|---|---|
| 🔴 Cao  | **BUG-03 chưa fix** — lỗ hổng bảo mật active trên production            |
| 🟡 TB   | **BUG-02 chưa fix** — user copy-paste email bị block, ảnh hưởng UX      |
| 🟡 TB   | **BUG-01 chưa fix** — load chậm ảnh hưởng bounce rate trên mạng chậm    |
| 🟡 TB   | EC-1.2 fail chưa rõ nguyên nhân — cần review lại test assertion          |
| 🟢 Thấp | Chưa test cross-browser trên Firefox và Safari                           |
| 🟢 Thấp | Chưa test trên Android (chỉ test Mobile Chrome / iPhone 13 viewport)     |

---

## Đề xuất trước khi release

- [x] Test đã chạy toàn bộ 17 test cases (Login feature)
- [ ] **Fix BUG-03 (High/P1)** — bắt buộc trước khi go-live
- [ ] Retest EC-1.6 sau khi dev fix backend error message
- [ ] **Fix BUG-02 (Medium/P2)** — nên fix cùng sprint với BUG-03
- [ ] Retest EC-1.1 sau khi dev thêm `email.trim()`
- [ ] Review lại test EC-1.2 (kiểm tra assertion có false positive không)
- [ ] BUG-01 (Medium/P2) — có thể ship nhưng cần monitor load time sau release
- [ ] Thêm rate limiting / account lockout sau khi fix BUG-03 (chống brute force)

---

## Xem báo cáo chi tiết / Detailed Reports

```bash
# Mở HTML report với đầy đủ log, screenshot và video
npx playwright show-report

# Xem bug reports chi tiết
cat reports/bug-reports.md
```

**File báo cáo:**
- `reports/bug-reports.md` — Chi tiết 3 bug reports (BUG-01, BUG-02, BUG-03)
- `playwright-report/index.html` — HTML report đầy đủ
- `test-results/` — Screenshots của các test fail

---

## Template email gửi team

```
Subject: [QA Report] Login / Authentication — Sprint 1 — 76% Pass — NO-GO ❌

Hi team,

Kết quả test Login / Authentication (2026-05-07):
• ✅ 13/17 test PASS (76%)
• ❌ 4 FAIL — 3 bug được xác nhận:
  - BUG-01 (Medium): Trang login load 3.6s > SLA 3s
  - BUG-02 (Medium): Email có space không được trim → login fail
  - BUG-03 (High ⚠️): Lỗ hổng bảo mật User Enumeration (OWASP A07)

Đề xuất: ❌ NO-GO — Cần fix BUG-03 trước khi release.
BUG-03 cho phép hacker biết email nào đã đăng ký hệ thống.

Chi tiết: reports/bug-reports.md | playwright-report/index.html

QA Team
```
