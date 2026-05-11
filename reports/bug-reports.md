# Bug Reports — Login / Authentication + Dashboard
**Ngày tạo:** 2026-05-07 (cập nhật Dashboard: 2026-05-07)
**Tester:** QA Team
**Môi trường:** https://app.promer.ai
**Feature:** Login / Authentication · Dashboard / Homepage

---

## Tóm tắt / Summary

| ID      | Tiêu đề                                              | Severity | Priority | Status |
|---|---|---|---|---|
| BUG-01  | Trang login load chậm hơn 3 giây                     | Medium   | P2       | Open   |
| BUG-02  | Email có khoảng trắng đầu/cuối không được trim → login thất bại | Medium | P2 | Open |
| BUG-03  | Thông báo lỗi khác nhau giữa email sai và password sai — lộ user enumeration | **High** | **P1** | **Fixed** |
| BUG-04  | App không redirect về /sign-in sau logout / khi chưa đăng nhập | Medium | P2 | Open |
| BUG-05  | App shell vỡ hoàn toàn khi API trả về 500 — màn hình trắng/broken | **High** | **P1** | Open |

---

---

## [BUG-01] Trang login load chậm hơn 3 giây

### Thông tin chung / General Info

| Trường       | Giá trị                        |
|---|---|
| ID           | BUG-01                         |
| Severity     | Medium                         |
| Priority     | P2                             |
| Feature      | Login / Performance            |
| Test Case    | `[PERF] EC-1.7`                |
| Môi trường   | https://app.promer.ai/sign-in  |
| Browser      | Chrome (Chromium)              |
| Ngày tìm     | 2026-05-07                     |

### Mô tả lỗi / Bug Description

Trang `/sign-in` mất **3.6–4.2 giây** để load đến khi ô email hiển thị. Vượt ngưỡng SLA **3000ms** theo Acceptance Criteria EC-1.7.

### Các bước tái hiện / Steps to Reproduce

1. Mở Chrome ở chế độ Incognito (tránh cache)
2. Truy cập `https://app.promer.ai/sign-in`
3. Dùng DevTools → Network → đo thời gian cho đến khi trang load xong
4. Hoặc chạy Playwright test: `npx playwright test --grep "PERF"`

### Kết quả thực tế / Actual Result

```
[PERF] Thời gian load trang /sign-in: 3624ms
[PERF] Ngưỡng: 3000ms | Kết quả: FAIL (BUG-01)
```

Thời gian đo được: **3600–4200ms** (dao động tùy lần chạy)

### Kết quả mong đợi / Expected Result

Trang `/sign-in` phải load xong (ô email visible) trong vòng **< 3000ms**

### Playwright Error

```
Error: expect(received).toBeLessThan(expected)
Expected: < 3000
Received: 3624
```

### Tác động / Impact

- Người dùng phải chờ 1–1.5 giây lâu hơn mức cần thiết
- Ảnh hưởng rõ hơn trên mạng chậm (3G, wifi yếu)
- Tỉ lệ bounce rate tăng nếu user thiếu kiên nhẫn

### Đề xuất fix / Suggested Fix

- Bật CDN cho static assets (JS, CSS, ảnh)
- Lazy load ảnh testimonial bên phải (không ảnh hưởng LCP)
- Phân tích Network waterfall để tìm request block render

### Screenshot / Log

```
test-results/specs-login--Login-Đăng-nh-[PERF]/
```

---

---

## [BUG-02] Email có khoảng trắng đầu/cuối không được trim → login thất bại

### Thông tin chung / General Info

| Trường       | Giá trị                        |
|---|---|
| ID           | BUG-02                         |
| Severity     | Medium                         |
| Priority     | P2                             |
| Feature      | Login / UX / Input Handling    |
| Test Case    | `[EDGE] EC-1.1`                |
| Môi trường   | https://app.promer.ai/sign-in  |
| Browser      | Chrome (Chromium) + Mobile     |
| Ngày tìm     | 2026-05-07                     |

### Mô tả lỗi / Bug Description

Khi người dùng nhập email có **khoảng trắng đầu hoặc cuối** (ví dụ: copy-paste từ email client), app **không tự trim whitespace** mà xử lý email có space như một email sai định dạng — hiện lỗi `"Enter a valid email"` và không cho login.

Người dùng bị stuck mà không hiểu lý do vì họ thấy email của mình hiển thị bình thường trong ô input.

### Các bước tái hiện / Steps to Reproduce

1. Vào `https://app.promer.ai/sign-in`
2. Nhập vào ô Email: `"  user@email.com  "` (có 2 space đầu và 2 space cuối)
3. Nhập Password đúng
4. Nhấn Continue

### Kết quả thực tế / Actual Result

- Trang ở lại `/sign-in`, **không** chuyển sang dashboard
- Hiện thông báo lỗi: `"Enter a valid email"`
- URL vẫn là `https://app.promer.ai/sign-in`

**Page snapshot ghi nhận:**
```yaml
- generic [ref=e46]:
  - img [ref=e49]
  - generic [ref=e53]: Enter a valid email  ← lỗi hiện ra do space
```

### Kết quả mong đợi / Expected Result

App phải **tự động trim** khoảng trắng đầu/cuối của email trước khi validate và gửi request → login thành công như khi không có space.

### Playwright Error

```
Error: expect(page).not.toHaveURL(expected) failed
Expected pattern: not /\/sign-in/
Received string:  "https://app.promer.ai/sign-in"
Timeout: 10000ms (14 lần kiểm tra đều fail)
```

### Tác động / Impact

- Lỗi phổ biến với người dùng copy-paste email từ email client
- User bị block không đăng nhập được dù thông tin đúng
- UX tệ: thông báo "Enter a valid email" gây hiểu nhầm (email đúng, chỉ có thêm space)
- Xảy ra trên cả Desktop (Chromium) và Mobile

### Đề xuất fix / Suggested Fix

Frontend: Trim whitespace trước khi validate email

```javascript
// Trong submit handler hoặc input onChange
const cleanedEmail = email.trim();
```

Backend: Cũng nên trim ở server để đảm bảo (defense in depth)

### Screenshot / Log

```
test-results/specs-login--Login-Đăng-nh-d16c1-ng-đầu-cuối-app-nên-tự-trim-chromium/test-failed-1.png
test-results/specs-login--Login-Đăng-nh-d16c1-ng-đầu-cuối-app-nên-tự-trim-mobile/test-failed-1.png
```

---

---

## [BUG-03] ⚠️ Thông báo lỗi khác nhau giữa email sai và password sai — lộ user enumeration

### Thông tin chung / General Info

| Trường       | Giá trị                        |
|---|---|
| ID           | BUG-03                         |
| Severity     | **High**                       |
| Priority     | **P1**                         |
| Feature      | Login / Security               |
| Test Case    | `[EDGE] EC-1.6` / `[SECURITY]` |
| Môi trường   | https://app.promer.ai/sign-in  |
| Browser      | Chrome (Chromium)              |
| Ngày tìm     | 2026-05-07                     |
| **Ngày fix** | **2026-05-11**                 |
| **Status**   | **Fixed** ✅                   |

> **Ghi chú fix (2026-05-11):** Regression test EC-1.6 chạy với `test.fail()` → báo "unexpected pass" → xác nhận app đã trả về cùng thông báo lỗi cho cả hai trường hợp. BUG-03 đã được fix (không rõ thời điểm fix). Test EC-1.6 đã chuyển sang normal test để monitor security behavior lâu dài.

### Mô tả lỗi / Bug Description

**[SECURITY ISSUE]** Trang login hiển thị **hai thông báo lỗi khác nhau** tùy theo loại lỗi:

| Tình huống                          | Thông báo hiện tại                         |
|---|---|
| Email **không tồn tại** trong hệ thống | `"You mistyped your email, can you check it?"` |
| Email đúng nhưng **password sai**      | `"Invalid email or password"`               |

Điều này tạo ra lỗ hổng **User Enumeration**: hacker có thể biết chính xác email nào đã đăng ký vào hệ thống chỉ bằng cách thử đăng nhập và đọc thông báo lỗi.

### Tại sao đây là lỗ hổng bảo mật?

```
Hacker thử: hacker@target.com + random_password
→ Nhận: "Invalid email or password"  ← email TỒN TẠI trong hệ thống!

Hacker thử: notexist@fake.com + random_password
→ Nhận: "You mistyped your email, can you check it?"  ← email KHÔNG TỒN TẠI

→ Hacker tạo được danh sách email hợp lệ → tấn công brute force có mục tiêu
```

### Các bước tái hiện / Steps to Reproduce

1. Vào `https://app.promer.ai/sign-in`
2. Nhập email **KHÔNG TỒN TẠI**: `notexist_xyz@fake.com` + password bất kỳ → ghi lại thông báo lỗi
3. Reload trang
4. Nhập email **ĐÚNG** + password **SAI**: `user@real.com` + `wrong-password-999` → ghi lại thông báo lỗi
5. So sánh hai thông báo

### Kết quả thực tế / Actual Result

```
Email không tồn tại → "You mistyped your email, can you check it?"
Email đúng, password sai → "Invalid email or password"
```

Hai thông báo **KHÁC NHAU** → lộ thông tin tài khoản có tồn tại.

**Playwright Error:**

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "You mistyped your email, can you check it?"
Received: "Invalid email or password"

→ Test EC-1.6 FAIL: hai message phải giống nhau nhưng thực tế khác nhau
```

### Kết quả mong đợi / Expected Result

**Cả hai tình huống phải trả về cùng một thông báo lỗi chung:**

```
"Invalid email or password"
```

Không được gợi ý email có tồn tại hay không.

### Tác động / Impact

- **Bảo mật:** Cho phép thu thập danh sách email hợp lệ của người dùng hệ thống
- **OWASP:** Vi phạm A07:2021 — Identification and Authentication Failures
- **Brute force:** Hacker có thể tối ưu tấn công password chỉ vào email đã biết tồn tại
- Đặc biệt nguy hiểm với các tài khoản admin/premium

### Đề xuất fix / Suggested Fix

**Backend:** Luôn trả về cùng một response và cùng HTTP status code bất kể lý do lỗi:

```javascript
// SAI — khác nhau tùy loại lỗi:
if (!user) return res.status(401).json({ message: "You mistyped your email" });
if (!validPassword) return res.status(401).json({ message: "Invalid email or password" });

// ĐÚNG — luôn cùng một message:
if (!user || !validPassword) {
  return res.status(401).json({ message: "Invalid email or password" });
}
```

**Lưu ý thêm:** Cần thêm rate limiting (giới hạn số lần thử) để chống brute force.

### Screenshot / Log

```
test-results/specs-login--Login-Đăng-nh-fa07a-o-email-sai-vs-password-sai-chromium/test-failed-1.png
```

### Tham chiếu / References

- OWASP: Authentication Cheat Sheet — Incorrect and correct error messages
- CWE-204: Observable Response Discrepancy

---

---

---

---

## [BUG-04] App không redirect về /sign-in sau logout / khi chưa đăng nhập

### Thông tin chung / General Info

| Trường       | Giá trị                        |
|---|---|
| ID           | BUG-04                         |
| Severity     | Medium                         |
| Priority     | P2                             |
| Feature      | Dashboard / Authentication / UX |
| Test Case    | `[NEGATIVE] EC-2.2`, `[HAPPY] AC-2.5`, `[NEGATIVE] EC-2.3`, `[EDGE] EC-2.6` |
| Môi trường   | https://app.promer.ai          |
| Browser      | Chrome (Chromium) + Mobile Chrome |
| Ngày tìm     | 2026-05-07                     |

### Mô tả lỗi / Bug Description

App **không redirect về `/sign-in`** trong 3 tình huống phải redirect:

1. **Sau khi Logout** — click logout xong, URL ở lại `/`, hiện nút "Sign in" thay vì redirect về `/sign-in`
2. **Truy cập trực tiếp khi chưa đăng nhập** — mở `/` không có session → app hiển thị trang với sidebar + nút "Sign in" (không redirect)
3. **Session hết hạn** — xóa cookie + localStorage, reload trang → URL ở lại `/`, hiện "Sign in" (không redirect)

Hành vi thực tế: app **xóa session đúng** (User menu biến mất, nút "Sign in" hiện ra) nhưng **không thực hiện redirect** về `/sign-in`.

### Các bước tái hiện / Steps to Reproduce

**Scenario 1 — Sau khi Logout:**
1. Đăng nhập vào `https://app.promer.ai`
2. Click button "User menu" ở góc phải sidebar
3. Click Logout
4. Quan sát URL và giao diện

**Scenario 2 — Chưa đăng nhập:**
1. Mở browser mới (không có session)
2. Truy cập `https://app.promer.ai/`
3. Quan sát URL và giao diện

### Kết quả thực tế / Actual Result

```
Scenario 1 (Logout):
  URL sau logout: "https://app.promer.ai/"  (không phải /sign-in)
  User menu: biến mất ✓
  Sign in button: hiện ra ✓
  Redirect: ❌ KHÔNG xảy ra

Scenario 2 (Chưa đăng nhập):
  URL khi truy cập "/": "https://app.promer.ai/" (không phải /sign-in)
  Sidebar + nav links: vẫn hiện (Home, Static ads, Video ads...)
  Sign in button: hiện ra thay vì User menu
  Redirect: ❌ KHÔNG xảy ra
```

**Playwright Error (EC-2.2):**
```
Error: [BUG-04] App không redirect unauthenticated user về /sign-in.
URL thực tế: "https://app.promer.ai/"
Spec yêu cầu: redirect về /sign-in
```

### Kết quả mong đợi / Expected Result

| Tình huống                     | Hành vi mong đợi                     |
|---|---|
| Sau khi logout                 | Redirect ngay về `/sign-in`          |
| Truy cập khi chưa đăng nhập    | Redirect về `/sign-in`               |
| Session hết hạn                | Redirect về `/sign-in` kèm thông báo |

### Tác động / Impact

- **UX**: Người dùng sau khi logout không biết mình đã thoát hay chưa (URL vẫn ở `/`)
- **Nhầm lẫn**: Sidebar vẫn hiển thị nhưng không có user session → hành vi không nhất quán
- **Bảo mật**: Trang `/` không có auth guard → có thể xem app shell mà không cần đăng nhập
- **Ảnh hưởng**: Chromium + Mobile Chrome, tất cả flow logout/unauthenticated

### Đề xuất fix / Suggested Fix

**Frontend (SPA router):** Thêm auth guard ở route level:

```javascript
// Ví dụ với React Router / Vue Router
router.beforeEach((to, from, next) => {
  const isAuthenticated = authStore.isLoggedIn;
  if (!isAuthenticated && to.path !== '/sign-in') {
    next('/sign-in');
  } else {
    next();
  }
});

// Sau khi logout: redirect về /sign-in
async function logout() {
  await authService.logout();
  router.push('/sign-in');  // ← thêm dòng này
}
```

### Screenshot / Log

```
test-results/specs-dashboard--Dashboard-7440e-ăng-nhập-→-không-có-session-chromium/test-failed-1.png
test-results/specs-dashboard--Dashboard-7440e-ăng-nhập-→-không-có-session-mobile/test-failed-1.png
```

---

---

## [BUG-05] ⚠️ App shell vỡ hoàn toàn khi API trả về lỗi 500

### Thông tin chung / General Info

| Trường       | Giá trị                        |
|---|---|
| ID           | BUG-05                         |
| Severity     | **High**                       |
| Priority     | **P1**                         |
| Feature      | Dashboard / Error Handling     |
| Test Case    | `[NEGATIVE] EC-2.4`            |
| Môi trường   | https://app.promer.ai          |
| Browser      | Chrome (Chromium) + Mobile Chrome |
| Ngày tìm     | 2026-05-07                     |

### Mô tả lỗi / Bug Description

Khi **API backend trả về HTTP 500**, toàn bộ **app shell vỡ hoàn toàn**:

- Link "Home" trong sidebar **biến mất**
- Button "User menu" **biến mất**
- Trang hiển thị **màn hình trắng hoặc broken UI**
- Người dùng **mất hoàn toàn khả năng điều hướng** (không còn menu, không còn header)

Đây là **critical UX failure** — khi server lỗi, app không hiển thị thông báo lỗi thân thiện mà thay vào đó làm vỡ toàn bộ giao diện.

### Các bước tái hiện / Steps to Reproduce

1. Đăng nhập vào `https://app.promer.ai`
2. Vào DevTools → Network tab → chọn tất cả API request (`/api/**`)
3. Chặn các request và trả về status 500
4. Reload trang Dashboard
5. Quan sát giao diện

**Hoặc chạy Playwright test:**
```bash
npx playwright test tests/specs/dashboard.spec.js --grep "EC-2.4"
```

### Kết quả thực tế / Actual Result

```
Sau khi API trả về 500 + reload:
  Link "Home" (sidebar nav): KHÔNG VISIBLE ❌
  Button "User menu":        KHÔNG VISIBLE ❌
  App shell: VỠ HOÀN TOÀN
  Thông báo lỗi thân thiện: KHÔNG HIỂN THỊ ❌
  Màn hình: Trắng / Broken UI
```

**Playwright Error (EC-2.4):**
```
Error: [BUG-05] App shell (sidebar nav + User menu) bị vỡ khi API trả về 500.
Link "Home" và button "User menu" đều không visible sau khi API 500.
Spec yêu cầu: navigation và header vẫn hiển thị khi API lỗi.
Tham chiếu: dashboard.feature @negative @EC-2.4
```

### Kết quả mong đợi / Expected Result

Khi API trả về 500, app phải:

1. **Vẫn hiển thị navigation shell** (sidebar, User menu, header)
2. **Hiển thị thông báo lỗi thân thiện** trong vùng content (không crash toàn trang)
3. **Cho phép user điều hướng** sang trang khác hoặc thử lại

```
Hành vi mong đợi:
  Sidebar nav (Home, Static ads...): VẪN HIỂN THỊ ✓
  User menu button:                  VẪN HIỂN THỊ ✓
  Content area: Hiện "Something went wrong. Please try again." ✓
  User có thể click menu khác:       VẪN ĐƯỢC ✓
```

### Tại sao đây là lỗi nghiêm trọng?

```
Server bị quá tải hoặc deploy mới → API trả về 500
→ Toàn bộ Dashboard vỡ (màn hình trắng)
→ User không thể làm gì, không có link để thoát
→ User phải manually gõ URL hoặc hard-refresh
→ Churn / bounce rate tăng cao
```

### Tác động / Impact

- **UX nghiêm trọng**: User bị "kẹt" khi server lỗi — không có navigation, không có nút Reload
- **Không có Error Boundary**: App không có React Error Boundary hoặc fallback UI cho API errors
- **Ảnh hưởng rộng**: Bất kỳ khi nào server lỗi (deploy, outage, timeout) → toàn bộ dashboard vỡ
- **Chromium + Mobile**: Xảy ra trên cả 2 browser
- **Không có monitoring**: Nếu không có error boundary, lỗi JS không được capture để alert team

### Đề xuất fix / Suggested Fix

**1. Thêm Error Boundary (React):**
```javascript
// components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Something went wrong. Please try again.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Bọc chỉ phần content, không bọc toàn bộ app shell
<AppShell>        {/* ← shell luôn visible */}
  <ErrorBoundary> {/* ← chỉ bao content area */}
    <DashboardContent />
  </ErrorBoundary>
</AppShell>
```

**2. API error handling:**
```javascript
// Xử lý API 500 gracefully — không throw, return empty state
async function fetchDashboardData() {
  try {
    const res = await fetch('/api/dashboard');
    if (!res.ok) {
      console.error('API error:', res.status);
      return { error: true, data: null }; // ← return empty, không throw
    }
    return { error: false, data: await res.json() };
  } catch (err) {
    return { error: true, data: null };
  }
}
```

**3. Lưu ý thêm:** Thêm retry button và message "Server đang bận, vui lòng thử lại" thay vì màn hình trắng.

### Screenshot / Log

```
test-results/specs-dashboard--Dashboard-444c0-fully-không-màn-hình-trắng--chromium/test-failed-1.png
test-results/specs-dashboard--Dashboard-444c0-fully-không-màn-hình-trắng--mobile/test-failed-1.png
```

---

---

## Tổng kết / Wrap-up

| ID      | Severity | Priority | Feature     | Đề xuất action                                           |
|---|---|---|---|---|
| BUG-01  | Medium   | P2       | Login/Perf  | Fix trong sprint tiếp — tối ưu performance               |
| BUG-02  | Medium   | P2       | Login/UX    | Fix sớm — ảnh hưởng UX người dùng thông thường           |
| BUG-03  | **High** | **P1**   | Login/Sec   | **Fix ngay** — lỗ hổng bảo mật cần vá trước release      |
| BUG-04  | Medium   | P2       | Dashboard   | Fix sớm — UX confusing sau logout, thiếu auth guard       |
| BUG-05  | **High** | **P1**   | Dashboard   | **Fix ngay** — app crash khi server lỗi, cần Error Boundary |

**Đề xuất:** ❌ NO-GO cho production cho đến khi BUG-03 và BUG-05 được fix.
