# Requirements — app.promer.ai

**App:** https://app.promer.ai  
**Design System:** Shopify Polaris  
**Cập nhật lần cuối / Last updated:** 2026-05-07  

---

## Mục lục / Table of Contents

1. [Login / Authentication](#1-login--authentication)
2. [Dashboard / Homepage](#2-dashboard--homepage)
3. [Form nhập liệu / Data Entry Form](#3-form-nhập-liệu--data-entry-form)
4. [Tìm kiếm & Filter / Search & Filter](#4-tìm-kiếm--filter--search--filter)

---

## 1. Login / Authentication

### Mô tả tính năng / Feature Description

> **VI:** Cho phép người dùng xác thực danh tính bằng email và password để truy cập vào hệ thống. Trang đăng nhập nằm tại `/sign-in`, sử dụng Polaris form với button "Continue".  
> **EN:** Allows users to authenticate with email and password to access the system. The login page is at `/sign-in`, built with a Polaris form and a "Continue" button.

---

### Acceptance Criteria

| # | Tiêu chí / Criteria | Kết quả mong đợi / Expected Result |
|---|---|---|
| AC-1.1 | **[VI]** Đăng nhập với email + password hợp lệ | Redirect khỏi `/sign-in`, vào được app |
| | **[EN]** Login with valid email + password | Redirected away from `/sign-in`, enters the app |
| AC-1.2 | **[VI]** Phiên đăng nhập được duy trì sau reload | Reload trang → vẫn ở trong app, không bị đá về `/sign-in` |
| | **[EN]** Session persists after page reload | Reload → user stays in app, not redirected to `/sign-in` |
| AC-1.3 | **[VI]** Email hoặc password sai → hiện thông báo lỗi | Ở lại `/sign-in`, hiện "Invalid email or password" |
| | **[EN]** Wrong email or password → show error message | Stay on `/sign-in`, show "Invalid email or password" |
| AC-1.4 | **[VI]** Form trống → button bị vô hiệu hóa | Button `aria-disabled=true`, không gọi API |
| | **[EN]** Empty form → button is disabled | Button `aria-disabled=true`, no API call made |
| AC-1.5 | **[VI]** Email sai định dạng → hiện lỗi inline | Hiện "Enter a valid email", button bị disable |
| | **[EN]** Invalid email format → show inline error | Show "Enter a valid email", button disabled |
| AC-1.6 | **[VI]** Nhấn Enter trên field password → submit được | Hoạt động tương đương click button |
| | **[EN]** Press Enter on password field → form submits | Works the same as clicking the button |
| AC-1.7 | **[VI]** Trang `/sign-in` hiển thị đủ 3 element | Input email, input password, button "Continue" đều visible |
| | **[EN]** `/sign-in` displays all 3 required elements | Email input, password input, "Continue" button all visible |

---

### Edge Cases cần lưu ý / Edge Cases to Note

| # | Edge Case | Rủi ro / Risk |
|---|---|---|
| EC-1.1 | **[VI]** Email có khoảng trắng đầu/cuối (copy-paste) | App không trim → login âm thầm thất bại, user bối rối |
| | **[EN]** Email with leading/trailing spaces (copy-paste) | App doesn't trim → silent login failure, user confused |
| EC-1.2 | **[VI]** Password chứa ký tự đặc biệt `!@#$%^&*()` | Backend không escape → crash hoặc lỗi SQL |
| | **[EN]** Password with special characters `!@#$%^&*()` | Backend escaping failure → crash or SQL error |
| EC-1.3 | **[VI]** Email dài 252 ký tự (gần giới hạn RFC 5321) | Server không validate độ dài → database error |
| | **[EN]** Email of 252 characters (near RFC 5321 limit) | Server skips length validation → database error |
| EC-1.4 | **[VI]** SQL Injection trong field email | Backend không dùng prepared statement → bị tấn công |
| | **[EN]** SQL Injection in email field | Backend not using prepared statements → vulnerable |
| EC-1.5 | **[VI]** XSS qua field email (`<script>alert()</script>`) | Render email chưa escape → JavaScript độc hại chạy |
| | **[EN]** XSS via email field (`<script>alert()</script>`) | Unescaped email render → malicious JS executes |
| EC-1.6 | **[VI]** Thông báo lỗi khác nhau cho "email sai" vs "password sai" | Lộ thông tin tài khoản có tồn tại không → security risk |
| | **[EN]** Different error messages for "wrong email" vs "wrong password" | Reveals account existence → security risk |
| EC-1.7 | **[VI]** Trang `/sign-in` load > 3 giây (đã phát hiện: 3.6–4.2s) | UX kém, tỷ lệ bounce cao *(Bug đã xác nhận — BUG-01)* |
| | **[EN]** `/sign-in` loads > 3 seconds (observed: 3.6–4.2s) | Poor UX, high bounce rate *(confirmed bug — BUG-01)* |

---

## 2. Dashboard / Homepage

### Mô tả tính năng / Feature Description

> **VI:** Màn hình chính sau khi đăng nhập, hiển thị tổng quan dữ liệu của người dùng (số liệu thống kê, danh sách gần đây, thông báo). Là điểm xuất phát để điều hướng sang các tính năng khác.  
> **EN:** The main screen after login, displaying the user's data overview (statistics, recent items, notifications). Acts as the starting point for navigating to other features.

---

### Acceptance Criteria

| # | Tiêu chí / Criteria | Kết quả mong đợi / Expected Result |
|---|---|---|
| AC-2.1 | **[VI]** Sau login thành công, tự động redirect về Dashboard | URL không còn chứa `/sign-in` |
| | **[EN]** After successful login, auto-redirect to Dashboard | URL no longer contains `/sign-in` |
| AC-2.2 | **[VI]** Dashboard hiển thị tên/email người dùng đang đăng nhập | Đúng tên tài khoản, không hiển thị "undefined" hoặc rỗng |
| | **[EN]** Dashboard shows name/email of logged-in user | Correct account name, no "undefined" or empty value |
| AC-2.3 | **[VI]** Các số liệu thống kê (widget/card) hiển thị đúng | Giá trị là số thực, không phải placeholder "—" hoặc 0 khi có data |
| | **[EN]** Statistic widgets/cards display correctly | Real values shown, not placeholder "—" or 0 when data exists |
| AC-2.4 | **[VI]** Navigation menu hoạt động đúng | Click vào menu item → điều hướng đến đúng trang |
| | **[EN]** Navigation menu works correctly | Clicking a menu item → navigates to the correct page |
| AC-2.5 | **[VI]** Nút đăng xuất (Logout) hoạt động | Click Logout → xóa session, redirect về `/sign-in` |
| | **[EN]** Logout button works | Click Logout → clears session, redirects to `/sign-in` |
| AC-2.6 | **[VI]** Dashboard load xong trong vòng 5 giây | Tất cả widget visible sau ≤ 5s (cho phép nhiều hơn login vì load data) |
| | **[EN]** Dashboard fully loads within 5 seconds | All widgets visible within ≤ 5s (more than login due to data loading) |
| AC-2.7 | **[VI]** Responsive trên mobile (< 768px) | Layout chuyển sang dạng single-column, không có scroll ngang |
| | **[EN]** Responsive on mobile (< 768px) | Layout switches to single-column, no horizontal scroll |

---

### Edge Cases cần lưu ý / Edge Cases to Note

| # | Edge Case | Rủi ro / Risk |
|---|---|---|
| EC-2.1 | **[VI]** Người dùng mới, chưa có data | Hiện empty state rõ ràng, không crash hoặc hiện lỗi API |
| | **[EN]** New user with no data yet | Clear empty state shown, no crash or API error |
| EC-2.2 | **[VI]** Truy cập Dashboard khi chưa đăng nhập (URL trực tiếp) | Tự động redirect về `/sign-in` |
| | **[EN]** Access Dashboard without login (direct URL) | Auto-redirect to `/sign-in` |
| EC-2.3 | **[VI]** Session hết hạn trong khi đang xem Dashboard | Hiện thông báo "Phiên đăng nhập hết hạn", redirect về login |
| | **[EN]** Session expires while viewing Dashboard | Show "Session expired" notice, redirect to login |
| EC-2.4 | **[VI]** Mạng chậm / API trả về lỗi 500 | Hiện skeleton loader, sau đó hiện thông báo lỗi rõ ràng (không crash trắng trang) |
| | **[EN]** Slow network / API returns 500 | Show skeleton loader, then a clear error message (no blank screen crash) |
| EC-2.5 | **[VI]** Số liệu rất lớn (hàng triệu, tỷ) | Format đúng (1.2M, 3.5B), không tràn ra ngoài card |
| | **[EN]** Very large numbers (millions, billions) | Properly formatted (1.2M, 3.5B), no overflow outside card |
| EC-2.6 | **[VI]** Nhiều tab mở cùng lúc — logout ở 1 tab | Các tab còn lại phải nhận biết session đã hết, redirect về login |
| | **[EN]** Multiple tabs open — logout in one tab | Other tabs should detect session ended, redirect to login |

---

## 3. Form nhập liệu / Data Entry Form

### Mô tả tính năng / Feature Description

> **VI:** Cho phép người dùng nhập, chỉnh sửa và lưu dữ liệu vào hệ thống. Form sử dụng Polaris components (TextField, Select, DatePicker...), có validation inline trước khi submit.  
> **EN:** Allows users to input, edit, and save data to the system. Form uses Polaris components (TextField, Select, DatePicker...), with inline validation before submission.

---

### Acceptance Criteria

| # | Tiêu chí / Criteria | Kết quả mong đợi / Expected Result |
|---|---|---|
| AC-3.1 | **[VI]** Các field bắt buộc được đánh dấu rõ ràng | Hiện dấu `*` hoặc label "(Required)" cạnh field |
| | **[EN]** Required fields are clearly marked | Display `*` or "(Required)" label next to the field |
| AC-3.2 | **[VI]** Submit khi còn field bắt buộc trống → hiện lỗi inline | Lỗi hiện ngay dưới field, không submit lên server |
| | **[EN]** Submit with empty required fields → show inline error | Error shown below the field, no server call made |
| AC-3.3 | **[VI]** Nhập đúng và submit thành công → hiện toast/banner | Toast "Đã lưu thành công" hoặc redirect đến trang chi tiết |
| | **[EN]** Fill correctly and submit → show success toast/banner | Toast "Saved successfully" or redirect to detail page |
| AC-3.4 | **[VI]** Chỉnh sửa form đang có data → data cũ hiển thị sẵn | Field pre-filled với giá trị hiện tại |
| | **[EN]** Edit a form with existing data → old data pre-filled | Fields pre-filled with current values |
| AC-3.5 | **[VI]** Nút Cancel / Discard hủy thay đổi | Không lưu thay đổi, quay về trạng thái trước |
| | **[EN]** Cancel / Discard button reverts changes | Changes not saved, returns to previous state |
| AC-3.6 | **[VI]** Validation number field chỉ nhận số | Nhập chữ cái → không được chấp nhận hoặc hiện lỗi |
| | **[EN]** Number field only accepts numbers | Typing letters → rejected or error shown |
| AC-3.7 | **[VI]** Submit form → button bị disable trong lúc đang gửi | Tránh double-submit khi click nhanh nhiều lần |
| | **[EN]** While submitting → button is disabled | Prevents double-submit from rapid clicking |

---

### Edge Cases cần lưu ý / Edge Cases to Note

| # | Edge Case | Rủi ro / Risk |
|---|---|---|
| EC-3.1 | **[VI]** Nhập text quá dài vào TextField (> 255 ký tự) | Database column overflow → lỗi 500, hoặc data bị cắt âm thầm |
| | **[EN]** Typing text longer than 255 characters | Database column overflow → 500 error, or data silently truncated |
| EC-3.2 | **[VI]** Dán HTML/script vào text field | App không được render HTML — hiện dạng plain text |
| | **[EN]** Paste HTML/script into text field | App must not render HTML — display as plain text only |
| EC-3.3 | **[VI]** Submit form khi mất mạng giữa chừng | Hiện lỗi rõ ràng "Không thể kết nối", không mất data đã nhập |
| | **[EN]** Submit while network drops mid-request | Clear "Unable to connect" error, form data not lost |
| EC-3.4 | **[VI]** DatePicker chọn ngày trong quá khứ (nếu không cho phép) | Hiện lỗi "Ngày không hợp lệ", không cho submit |
| | **[EN]** DatePicker selects a past date (if not allowed) | Show "Invalid date" error, block submission |
| EC-3.5 | **[VI]** Rời khỏi trang khi form đang có thay đổi chưa lưu | Hiện dialog xác nhận "Bạn có muốn rời không?" |
| | **[EN]** Navigate away with unsaved form changes | Show confirmation dialog "Are you sure you want to leave?" |
| EC-3.6 | **[VI]** Nhập số âm hoặc số thập phân vào field chỉ nhận số nguyên | Validate và hiện lỗi rõ ràng |
| | **[EN]** Negative or decimal number in integer-only field | Validate and show clear error |
| EC-3.7 | **[VI]** Nhập emoji vào text field | Không crash, lưu đúng ký tự Unicode (cần DB hỗ trợ utf8mb4) |
| | **[EN]** Typing emoji into a text field | No crash, correctly stores Unicode characters (requires utf8mb4 DB) |
| EC-3.8 | **[VI]** API submit trả về lỗi validation từ server (422) | Hiện lỗi đúng field tương ứng, không crash màn hình |
| | **[EN]** Submit API returns server-side validation error (422) | Show error on the correct field, no screen crash |

---

## 4. Tìm kiếm & Filter / Search & Filter

### Mô tả tính năng / Feature Description

> **VI:** Cho phép người dùng tìm kiếm theo từ khóa và lọc danh sách theo các tiêu chí (trạng thái, ngày, danh mục...). Kết quả cập nhật real-time hoặc sau khi nhấn "Tìm kiếm".  
> **EN:** Allows users to search by keyword and filter lists by criteria (status, date, category...). Results update in real-time or after pressing "Search".

---

### Acceptance Criteria

| # | Tiêu chí / Criteria | Kết quả mong đợi / Expected Result |
|---|---|---|
| AC-4.1 | **[VI]** Nhập từ khóa → danh sách lọc đúng kết quả | Chỉ hiện item chứa từ khóa, không có kết quả không liên quan |
| | **[EN]** Type a keyword → list filters correctly | Only items matching the keyword shown, no unrelated results |
| AC-4.2 | **[VI]** Không có kết quả → hiện empty state rõ ràng | Hiện "Không tìm thấy kết quả" (không hiện trang trắng) |
| | **[EN]** No results → display clear empty state | Show "No results found" (never show a blank page) |
| AC-4.3 | **[VI]** Xóa từ khóa → danh sách khôi phục về ban đầu | Hiện lại toàn bộ danh sách như trước khi tìm kiếm |
| | **[EN]** Clear keyword → list restores to original | Full list displayed as before searching |
| AC-4.4 | **[VI]** Filter nhiều tiêu chí cùng lúc → kết quả giao (AND) | Kết quả phải thỏa mãn tất cả filter đang active |
| | **[EN]** Multiple filters active → results are intersection (AND) | Results must satisfy all active filters |
| AC-4.5 | **[VI]** Nút "Xóa tất cả filter" reset toàn bộ về mặc định | Tất cả filter bị bỏ, danh sách đầy đủ hiện lại |
| | **[EN]** "Clear all filters" button resets everything | All filters removed, full list restored |
| AC-4.6 | **[VI]** Kết quả tìm kiếm hiện đúng số lượng | Ví dụ: "Showing 12 of 150 results" phải chính xác |
| | **[EN]** Search result count is accurate | e.g. "Showing 12 of 150 results" must be correct |
| AC-4.7 | **[VI]** Filter trạng thái (Active/Inactive) hoạt động đúng | Chỉ hiện item có trạng thái khớp |
| | **[EN]** Status filter (Active/Inactive) works correctly | Only items matching the status are shown |
| AC-4.8 | **[VI]** Filter theo khoảng ngày hoạt động đúng | Item nằm ngoài khoảng ngày bị ẩn đi |
| | **[EN]** Date range filter works correctly | Items outside the date range are hidden |

---

### Edge Cases cần lưu ý / Edge Cases to Note

| # | Edge Case | Rủi ro / Risk |
|---|---|---|
| EC-4.1 | **[VI]** Từ khóa có ký tự đặc biệt (`%`, `_`, `*`) | Nếu truyền thẳng vào SQL LIKE → SQL injection hoặc kết quả sai |
| | **[EN]** Keyword with special characters (`%`, `_`, `*`) | If passed directly to SQL LIKE → injection or wrong results |
| EC-4.2 | **[VI]** Tìm kiếm bằng chữ HOA/thường khác nhau | "Apple" và "apple" phải cùng cho ra kết quả (case-insensitive) |
| | **[EN]** Search with different letter casing | "Apple" and "apple" must return the same results (case-insensitive) |
| EC-4.3 | **[VI]** Từ khóa rất dài (> 200 ký tự) | Không crash, cắt bớt hoặc hiện lỗi rõ ràng |
| | **[EN]** Very long keyword (> 200 characters) | No crash, truncate or show clear error |
| EC-4.4 | **[VI]** Tìm kiếm trả về hàng nghìn kết quả | Phải có phân trang (pagination), không load tất cả cùng lúc |
| | **[EN]** Search returns thousands of results | Must paginate, not load all at once |
| EC-4.5 | **[VI]** Filter ngày: ngày bắt đầu > ngày kết thúc | Hiện lỗi "Ngày bắt đầu phải trước ngày kết thúc" |
| | **[EN]** Date filter: start date > end date | Show "Start date must be before end date" error |
| EC-4.6 | **[VI]** Tìm kiếm liên tục nhanh (debounce) | Mỗi lần gõ không được gọi API ngay — phải debounce 300–500ms |
| | **[EN]** Rapid successive searches (debounce) | Each keystroke must not trigger API immediately — debounce 300–500ms |
| EC-4.7 | **[VI]** Từ khóa chứa khoảng trắng thừa | `" apple "` và `"apple"` phải cho cùng kết quả (server trim) |
| | **[EN]** Keyword with extra whitespace | `" apple "` and `"apple"` must return same results (server-side trim) |
| EC-4.8 | **[VI]** URL phản chiếu trạng thái filter (deep link) | Copy URL đang filter → paste vào tab mới → filter được áp dụng lại |
| | **[EN]** URL reflects filter state (deep link support) | Copy filtered URL → paste in new tab → same filter applied |
| EC-4.9 | **[VI]** Tìm kiếm tiếng Việt có dấu | "Hà Nội" và "ha noi" nên trả cùng kết quả (nếu app hỗ trợ) |
| | **[EN]** Vietnamese search with diacritics | "Hà Nội" and "ha noi" should return same results (if supported) |

---

## Tổng quan / Summary

| Tính năng / Feature | AC | Edge Cases | File test liên quan |
|---|---|---|---|
| Login / Authentication | 7 | 7 | `tests/login.spec.js` |
| Dashboard / Homepage | 7 | 6 | `tests/dashboard.spec.js` *(chưa tạo)* |
| Form nhập liệu | 7 | 8 | `tests/form.spec.js` *(chưa tạo)* |
| Tìm kiếm & Filter | 8 | 9 | `tests/search.spec.js` *(chưa tạo)* |

> **Ghi chú / Note:** File test cho Login đã có sẵn và đã phát hiện được 3 bug thực tế.  
> Xem chi tiết tại [testcases.md](testcases.md).
