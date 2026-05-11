# ==============================================================================
# FEATURE: Login / Authentication
# App: https://app.promer.ai/sign-in
# Design System: Shopify Polaris
# Requirement refs: AC-1.1 → AC-1.7, EC-1.1 → EC-1.7
# ==============================================================================

Feature: Đăng nhập / Login Authentication
  # VI: Người dùng xác thực danh tính bằng email và password tại trang /sign-in
  # EN: Users authenticate with email and password at /sign-in page

  Background:
    # VI: Mỗi scenario đều bắt đầu từ trang login
    # EN: Each scenario starts from the login page
    Given Tôi đang ở trang đăng nhập "https://app.promer.ai/sign-in"
    And   Trang hiển thị đủ ô email, ô password và nút "Continue"

  # ============================================================================
  # HAPPY CASE
  # ============================================================================

  @happy @AC-1.1
  Scenario: Đăng nhập thành công với thông tin hợp lệ / Successful login with valid credentials
    # VI: Luồng chính — người dùng nhập đúng email + password, vào được app
    # EN: Main flow — user enters correct email + password, enters the app
    Given Tôi có tài khoản hợp lệ trong hệ thống
    When  Tôi nhập email "anvnt@firegroup.io" vào ô email
    And   Tôi nhập password đúng vào ô password
    And   Tôi nhấn nút "Continue"
    Then  URL trang không còn chứa "/sign-in"
    And   Tôi được điều hướng vào bên trong ứng dụng

  @happy @AC-1.2
  Scenario: Phiên đăng nhập được duy trì sau khi reload trang / Session persists after page reload
    # VI: Sau khi login, reload trang → vẫn ở trong app, không bị đá về login
    # EN: After login, reload page → stay in app, not redirected back to login
    Given Tôi đã đăng nhập thành công vào hệ thống
    When  Tôi reload lại trang trình duyệt
    Then  URL trang vẫn không chứa "/sign-in"
    And   Tôi vẫn ở trong ứng dụng, không bị đăng xuất

  @happy @AC-1.6
  Scenario: Nhấn phím Enter trên ô password để submit form / Press Enter on password field to submit
    # VI: UX phổ biến — user nhấn Enter thay vì dùng chuột bấm nút
    # EN: Common UX — user presses Enter instead of clicking the button
    Given Tôi có tài khoản hợp lệ trong hệ thống
    When  Tôi nhập email "anvnt@firegroup.io" vào ô email
    And   Tôi nhập password đúng vào ô password
    And   Tôi nhấn phím "Enter" trên bàn phím
    Then  Form được submit thành công
    And   Tôi được điều hướng vào bên trong ứng dụng

  # ============================================================================
  # NEGATIVE CASE
  # ============================================================================

  @negative @AC-1.3
  Scenario: Đăng nhập thất bại khi password sai / Login fails with wrong password
    # VI: Password sai → phải ở lại trang login và hiện thông báo lỗi
    # EN: Wrong password → must stay on login page and show error message
    Given Tôi có tài khoản hợp lệ trong hệ thống
    When  Tôi nhập email "anvnt@firegroup.io" vào ô email
    And   Tôi nhập password sai "wrong-password-999" vào ô password
    And   Tôi nhấn nút "Continue"
    Then  Tôi vẫn ở lại trang "/sign-in"
    And   Thông báo lỗi "Invalid email or password" được hiển thị

  @negative @AC-1.3
  Scenario: Đăng nhập thất bại khi email không tồn tại / Login fails with non-existent email
    # VI: Email chưa đăng ký → thông báo lỗi, không cho vào app
    # EN: Unregistered email → error message, cannot enter app
    When  Tôi nhập email "notexist_xyz@fake.com" vào ô email
    And   Tôi nhập password "anyPassword123" vào ô password
    And   Tôi nhấn nút "Continue"
    Then  Tôi vẫn ở lại trang "/sign-in"
    And   Thông báo lỗi được hiển thị trên trang

  @negative @AC-1.4
  Scenario: Nút Continue bị vô hiệu hóa khi form trống / Continue button disabled when form is empty
    # VI: Không nhập gì → button bị disable, không gọi API
    # EN: No input → button is disabled, no API call made
    When  Tôi không nhập gì vào ô email và ô password
    Then  Nút "Continue" có thuộc tính "aria-disabled" bằng "true"
    And   Không có request nào được gửi lên server

  @negative @AC-1.4
  Scenario: Nút Continue bị vô hiệu hóa khi chỉ có email, thiếu password / Button disabled with email but no password
    # VI: Nhập email nhưng quên password → button vẫn bị disable
    # EN: Enter email but no password → button still disabled
    When  Tôi nhập email "anvnt@firegroup.io" vào ô email
    And   Tôi để trống ô password
    Then  Nút "Continue" có thuộc tính "aria-disabled" bằng "true"

  @negative @AC-1.5
  Scenario: Hiển thị lỗi inline khi email sai định dạng / Show inline error for invalid email format
    # VI: Nhập email không có "@" → hiện "Enter a valid email", button bị disable
    # EN: Enter email without "@" → show "Enter a valid email", button disabled
    When  Tôi nhập email "not-an-email" vào ô email
    And   Tôi nhập password "somePassword123" vào ô password
    And   Tôi nhấn nút "Continue" dù button có thể bị disable
    Then  Thông báo "Enter a valid email" được hiển thị inline
    And   Nút "Continue" bị vô hiệu hóa

  # ============================================================================
  # EDGE CASE
  # ============================================================================

  @edge @EC-1.1
  Scenario: Đăng nhập với email có khoảng trắng đầu/cuối / Login with email containing leading/trailing spaces
    # VI: Copy-paste email có space → app nên tự trim để login thành công
    # EN: Copy-paste email with spaces → app should auto-trim for successful login
    Given Tôi có tài khoản hợp lệ trong hệ thống
    When  Tôi nhập email "  anvnt@firegroup.io  " (có khoảng trắng đầu cuối) vào ô email
    And   Tôi nhập password đúng vào ô password
    And   Tôi nhấn nút "Continue"
    Then  App tự động loại bỏ khoảng trắng và xử lý đăng nhập
    # Ghi chú / Note: Nếu FAIL → Bug: app không trim → user bị lỗi âm thầm

  @edge @EC-1.2
  Scenario: Đăng nhập với password chứa ký tự đặc biệt / Login with special characters in password
    # VI: Password có ký tự đặc biệt → không được crash hay lỗi 500
    # EN: Password with special characters → must not crash or return 500
    When  Tôi nhập email "anvnt@firegroup.io" vào ô email
    And   Tôi nhập password "!@#$%^&*()_+Test1" vào ô password
    And   Tôi nhấn nút "Continue"
    Then  Trang không hiển thị lỗi 500 hoặc màn hình trắng
    And   App xử lý gracefully (thành công hoặc hiện thông báo lỗi bình thường)

  @edge @EC-1.3
  Scenario: Đăng nhập với email dài 252 ký tự / Login with 252-character email
    # VI: Gần giới hạn RFC 5321 → server phải validate, không được crash
    # EN: Near RFC 5321 limit → server must validate, must not crash
    When  Tôi nhập email dài 252 ký tự (243 ký tự "a" + "@test.com") vào ô email
    And   Tôi nhập password "somePassword" vào ô password
    And   Tôi nhấn nút "Continue"
    Then  Trang không hiển thị lỗi 500 hoặc màn hình trắng
    And   App xử lý gracefully

  @edge @EC-1.4 @security
  Scenario: Ngăn chặn SQL Injection qua field email / Prevent SQL Injection via email field
    # VI: Nhập chuỗi SQL injection → phải bị từ chối, không vào được app
    # EN: SQL injection input → must be rejected, cannot enter app
    When  Tôi nhập email "' OR '1'='1" vào ô email
    And   Tôi nhập password "' OR '1'='1" vào ô password
    And   Tôi nhấn nút "Continue"
    Then  Tôi vẫn ở lại trang đăng nhập
    And   Nội dung trang không chứa thông báo lỗi SQL như "syntax error" hoặc "mysql"

  @edge @EC-1.5 @security
  Scenario: Ngăn chặn XSS qua field email / Prevent XSS via email field
    # VI: Nhập script tag → JavaScript không được thực thi
    # EN: Script tag input → JavaScript must not be executed
    When  Tôi nhập email "<script>alert('XSS')</script>" vào ô email
    And   Tôi nhập password "password123" vào ô password
    And   Tôi nhấn nút "Continue"
    Then  Không có dialog hoặc alert nào được kích hoạt bởi script
    And   Trang xử lý input bình thường

  @edge @EC-1.6 @security
  Scenario: Thông báo lỗi phải giống nhau cho email sai và password sai / Error messages must be identical for wrong email vs wrong password
    # VI: Tránh lộ thông tin tài khoản có tồn tại không (user enumeration)
    # EN: Prevent user enumeration — don't reveal if account exists
    When  Tôi đăng nhập với email không tồn tại và password bất kỳ
    Then  Tôi ghi lại thông báo lỗi hiển thị là "<error_message_1>"
    When  Tôi đăng nhập với email đúng nhưng password sai
    Then  Thông báo lỗi hiển thị phải giống hệt "<error_message_1>"

  # ============================================================================
  # UI / UX
  # ============================================================================

  @ui @AC-1.7
  Scenario: Trang đăng nhập hiển thị đủ các element bắt buộc / Login page displays all required elements
    # VI: Kiểm tra UI cơ bản — đủ 3 element, không có element nào bị ẩn
    # EN: Basic UI check — all 3 elements present and visible
    Then  Ô nhập email hiển thị và có thể tương tác
    And   Ô nhập password hiển thị và có thể tương tác
    And   Nút "Continue" hiển thị trên trang
    And   Label "Email" hiển thị trên form
    And   Label "Password" hiển thị trên form

  @ui
  Scenario: Giao diện đăng nhập hiển thị đúng trên màn hình mobile / Login page displays correctly on mobile
    # VI: Kiểm tra responsive — form không bị vỡ layout trên iPhone 13
    # EN: Responsive check — form layout intact on iPhone 13 viewport
    Given Trình duyệt đang ở chế độ mobile viewport (390x844 - iPhone 13)
    When  Tôi mở trang "https://app.promer.ai/sign-in"
    Then  Ô email vẫn hiển thị và có thể tương tác
    And   Trang không có scroll ngang (horizontal scroll)

  # ============================================================================
  # PERFORMANCE
  # ============================================================================

  @perf @EC-1.7
  Scenario: Trang đăng nhập phải load xong trong vòng 3 giây / Login page must load within 3 seconds
    # VI: BUG-01 đã xác nhận — thực tế đang load 3.6–4.2s, vượt ngưỡng
    # EN: BUG-01 confirmed — currently loads 3.6–4.2s, exceeds threshold
    When  Tôi bắt đầu đo thời gian và mở trang "https://app.promer.ai/sign-in"
    And   Tôi chờ đến khi ô email hiển thị và sẵn sàng nhập liệu
    Then  Tổng thời gian load phải nhỏ hơn 3000ms
    # Kết quả thực tế / Actual result: ~3600–4200ms → FAIL (BUG-01)
