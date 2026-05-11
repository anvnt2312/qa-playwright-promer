# Test Cases — Login | app.promer.ai

**File test:** `tests/login.spec.js`  
**URL:** `https://app.promer.ai/sign-in`  
**Tổng số:** 21 test cases

---

## HAPPY CASE (2)

### TC-01 · [HAPPY] Đăng nhập thành công
| | |
|---|---|
| **Mục tiêu** | Luồng chính hoạt động đúng |
| **Đầu vào** | Email hợp lệ + password đúng |
| **Kết quả mong đợi** | URL rời khỏi `/sign-in`, vào được app |
| **Bug tiềm ẩn** | Redirect loop → không bao giờ rời khỏi /sign-in |

### TC-02 · [HAPPY] Nhớ phiên đăng nhập sau khi reload
| | |
|---|---|
| **Mục tiêu** | Session được duy trì đúng |
| **Đầu vào** | Login thành công → reload trang |
| **Kết quả mong đợi** | Vẫn ở trong app, không bị redirect về login |
| **Bug tiềm ẩn** | Session/cookie không set đúng → bị đá ra sau reload |

---

## NEGATIVE CASE (6)

### TC-03 · [NEGATIVE] Email đúng nhưng password sai
| | |
|---|---|
| **Đầu vào** | Email hợp lệ + password = `wrong-password-123` |
| **Kết quả mong đợi** | Ở lại `/sign-in`, hiện lỗi "Invalid email or password" |
| **Bug tiềm ẩn** | Lỗi không hiện ra → người dùng không biết mình nhập sai |

### TC-04 · [NEGATIVE] Email không tồn tại
| | |
|---|---|
| **Đầu vào** | Email chưa đăng ký + password bất kỳ |
| **Kết quả mong đợi** | Hiện lỗi "Invalid email or password" |
| **Bug tiềm ẩn** | Thông báo lỗi khác nhau cho "email không tồn tại" vs "password sai" → lộ thông tin tài khoản (security risk) |

### TC-05 · [NEGATIVE] Để trống cả email và password
| | |
|---|---|
| **Đầu vào** | Bấm Continue khi cả 2 field trống |
| **Kết quả mong đợi** | Button bị `aria-disabled=true` (Polaris disable khi form trống), không gọi API |
| **Bug tiềm ẩn** | Form submit mà không validate → gọi API với data rỗng |

### TC-06 · [NEGATIVE] Để trống password, có email hợp lệ
| | |
|---|---|
| **Đầu vào** | Email hợp lệ + password trống |
| **Kết quả mong đợi** | Button bị `aria-disabled=true` |
| **Bug tiềm ẩn** | Bypass client-side validation → server nhận password rỗng |

### TC-07 · [NEGATIVE] Email sai định dạng (thiếu @)
| | |
|---|---|
| **Đầu vào** | Email = `not-an-email` + password bất kỳ |
| **Kết quả mong đợi** | Hiện inline error "Enter a valid email", button bị disable |
| **Bug tiềm ẩn** | Validate client-side bị bypass → server nhận email không hợp lệ |

### TC-08 · [NEGATIVE] Email có khoảng trắng ở đầu/cuối
| | |
|---|---|
| **Đầu vào** | Email = `" user@email.com "` (có space đầu/cuối) + password đúng |
| **Kết quả mong đợi** | App nên tự trim → login thành công *(test ghi nhận hành vi thực tế)* |
| **Bug tiềm ẩn** | App không trim → user bị lỗi login mà không hiểu lý do |

---

## EDGE CASE (4)

### TC-09 · [EDGE] Password chứa ký tự đặc biệt
| | |
|---|---|
| **Đầu vào** | Password = `!@#$%^&*()_+Test1` |
| **Kết quả mong đợi** | Không crash, không hiện lỗi 500 |
| **Bug tiềm ẩn** | Backend không escape ký tự đặc biệt → crash hoặc SQL error |

### TC-10 · [EDGE] Email dài 252 ký tự (gần giới hạn RFC 5321)
| | |
|---|---|
| **Đầu vào** | Email = 243 ký tự `a` + `@test.com` |
| **Kết quả mong đợi** | Không crash, xử lý gracefully |
| **Bug tiềm ẩn** | Server không giới hạn độ dài → buffer overflow hoặc database error |

### TC-11 · [EDGE] Password dài 128 ký tự
| | |
|---|---|
| **Đầu vào** | Password = `Aa1!` + 124 ký tự `x` |
| **Kết quả mong đợi** | Không crash, xử lý gracefully |
| **Bug tiềm ẩn** | Server cắt password ở N ký tự → hành vi khác nhau khi đăng ký vs đăng nhập |

### TC-12 · [EDGE] Nhấn Enter thay vì click button
| | |
|---|---|
| **Đầu vào** | Điền đúng email + password → nhấn `Enter` trên field password |
| **Kết quả mong đợi** | Submit thành công, rời khỏi `/sign-in` |
| **Bug tiềm ẩn** | Enter không trigger submit → UX kém, user nhầm tưởng đã đăng nhập |

---

## UI / UX (4)

### TC-13 · [UI] Hiển thị đúng các element cơ bản
| | |
|---|---|
| **Kiểm tra** | Mở `/sign-in` → tất cả element phải visible |
| **Element cần có** | Input email · Input password · Button "Continue" |
| **Bug tiềm ẩn** | CSS load chậm → element bị ẩn hoặc không render đúng |

### TC-14 · [UI] Label Email và Password hiển thị
| | |
|---|---|
| **Kiểm tra** | Label "Email" và "Password" phải visible (app dùng Polaris — không có placeholder) |
| **Bug tiềm ẩn** | Label bị ẩn → accessibility kém, screen reader không đọc được |

### TC-15 · [UI] Toggle hiện/ẩn password *(SKIP)*
| | |
|---|---|
| **Kiểm tra** | Click icon mắt → password chuyển `type=text`, click lần 2 → `type=password` |
| **Kết quả** | SKIP — app không có nút toggle hiện/ẩn password |
| **Bug tiềm ẩn** | Thiếu tính năng → UX kém, user không kiểm tra được password trước khi submit |

### TC-16 · [UI] Responsive trên mobile (iPhone 13)
| | |
|---|---|
| **Kiểm tra** | Mở `/sign-in` trên viewport iPhone 13 → form không vỡ layout |
| **Kết quả mong đợi** | Input email visible, không có scroll ngang |
| **Bug tiềm ẩn** | Form dùng width cố định (px) → tràn ra ngoài viewport trên màn hình nhỏ |

---

## PERFORMANCE (2)

### TC-17 · [PERF] Trang login load dưới 3 giây
| | |
|---|---|
| **Đo lường** | Từ lúc gửi request đến lúc input email xuất hiện và sẵn sàng dùng |
| **Ngưỡng** | < 3000ms |
| **Kết quả thực tế** | ~3.6–4.2s (FAIL — bug thật của app) |
| **Bug tiềm ẩn** | JS bundle quá lớn, không có CDN cache, API call blocking render |

### TC-18 · [PERF] API đăng nhập phản hồi dưới 3 giây
| | |
|---|---|
| **Đo lường** | Thời gian response của network request tới `/auth` hoặc `/login` |
| **Ngưỡng** | < 3000ms |
| **Bug tiềm ẩn** | Database query không dùng index → chậm khi có nhiều user |

---

## SECURITY (3)

### TC-19 · [SECURITY] SQL Injection trong field email
| | |
|---|---|
| **Đầu vào** | Email = `' OR '1'='1` · Password = `' OR '1'='1` |
| **Kết quả mong đợi** | Ở lại `/sign-in`, không vào app, không hiện thông báo lỗi SQL |
| **Bug tiềm ẩn** | Backend không dùng prepared statement → bị SQL injection |

### TC-20 · [SECURITY] XSS trong field email
| | |
|---|---|
| **Đầu vào** | Email = `<script>alert("XSS")</script>` |
| **Kết quả mong đợi** | Không có alert/dialog nào bị trigger |
| **Bug tiềm ẩn** | App render email từ server response mà không escape HTML |

### TC-21 · [SECURITY] Password không lưu vào browser storage
| | |
|---|---|
| **Kiểm tra** | Sau khi login → `localStorage` và `sessionStorage` không chứa password dạng plain text |
| **Bug tiềm ẩn** | Debug code vô tình log credential vào storage |

---

## Bugs đã phát hiện

| ID | Mức độ | Mô tả |
|---|---|---|
| BUG-01 | Trung bình | **PERF** — Trang `/sign-in` load 3.6–4.2s, vượt ngưỡng 3s (TC-17) |
| BUG-02 | Thấp | **UX** — Không có nút toggle hiện/ẩn password (TC-15) |
| BUG-03 | Thấp | **UX** — App không trim khoảng trắng trong email → login fail âm thầm (TC-08) |

---

## Cách chạy

```bash
# Toàn bộ
npx playwright test tests/login.spec.js --project=chromium

# Từng nhóm
npx playwright test tests/login.spec.js --grep "\[HAPPY\]"
npx playwright test tests/login.spec.js --grep "\[NEGATIVE\]"
npx playwright test tests/login.spec.js --grep "\[EDGE\]"
npx playwright test tests/login.spec.js --grep "\[UI\]"
npx playwright test tests/login.spec.js --grep "\[PERF\]"
npx playwright test tests/login.spec.js --grep "\[SECURITY\]"

# Xem HTML report
npx playwright show-report
```
