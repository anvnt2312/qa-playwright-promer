# ==============================================================================
# FEATURE: Dashboard / Homepage
# App: https://app.promer.ai (sau khi đăng nhập)
# Design System: Shopify Polaris
# Requirement refs: AC-2.1 → AC-2.7, EC-2.1 → EC-2.6
# ==============================================================================

Feature: Dashboard / Trang chủ sau đăng nhập
  # VI: Màn hình chính hiển thị tổng quan dữ liệu sau khi đăng nhập thành công
  # EN: Main screen showing data overview after successful login

  Background:
    # VI: Các scenario Happy/UI/Perf bắt đầu ở trạng thái đã đăng nhập
    # EN: Happy/UI/Perf scenarios start in a logged-in state
    Given Tôi đã đăng nhập thành công với tài khoản "anvnt@firegroup.io"
    And   Tôi đang ở trang Dashboard

  # ============================================================================
  # HAPPY CASE
  # ============================================================================

  @happy @AC-2.1
  Scenario: Tự động redirect về Dashboard sau khi đăng nhập / Auto-redirect to Dashboard after login
    # VI: Sau login thành công, URL không còn chứa "/sign-in"
    # EN: After successful login, URL no longer contains "/sign-in"
    Given Tôi đang ở trang đăng nhập "https://app.promer.ai/sign-in"
    When  Tôi đăng nhập với email "anvnt@firegroup.io" và password đúng
    Then  URL trang không còn chứa "/sign-in"
    And   Tôi thấy giao diện Dashboard

  @happy @AC-2.2
  Scenario: Dashboard hiển thị đúng tên hoặc email người dùng / Dashboard shows correct user name or email
    # VI: Thông tin tài khoản phải hiển thị đúng, không phải "undefined" hoặc rỗng
    # EN: Account info must display correctly, not "undefined" or blank
    Then  Tên hoặc email "anvnt@firegroup.io" được hiển thị trên Dashboard
    And   Không có chỗ nào hiện chữ "undefined" hoặc ô trống thay vì tên người dùng

  @happy @AC-2.3
  Scenario: Các widget thống kê hiển thị giá trị thực / Statistic widgets display real values
    # VI: Widget/card phải hiển thị số thực, không phải placeholder "—" hay 0
    # EN: Widgets/cards must show real values, not placeholder "—" or 0
    Then  Tất cả widget thống kê trên Dashboard đều hiển thị
    And   Không có widget nào hiển thị giá trị placeholder "—"
    And   Không có widget nào hiển thị giá trị 0 khi thực tế có dữ liệu

  @happy @AC-2.4
  Scenario: Điều hướng qua Navigation menu / Navigation menu works correctly
    # VI: Click vào menu item → điều hướng đúng trang
    # EN: Click menu item → navigate to the correct page
    When  Tôi click vào một mục trong Navigation menu
    Then  Tôi được điều hướng đến đúng trang tương ứng với mục đó
    And   Không có lỗi 404 hoặc trang trắng xuất hiện

  @happy @AC-2.5
  Scenario: Đăng xuất thành công / Successful logout
    # VI: Click Logout → xóa session, redirect về /sign-in
    # EN: Click Logout → clear session, redirect to /sign-in
    When  Tôi click nút "Logout" hoặc "Đăng xuất"
    Then  Session và cookie đăng nhập bị xóa
    And   Tôi được redirect về trang "/sign-in"
    And   Khi tôi nhấn nút Back của trình duyệt, tôi không thể quay lại Dashboard

  # ============================================================================
  # NEGATIVE CASE
  # ============================================================================

  @negative @EC-2.2
  Scenario: Truy cập Dashboard khi chưa đăng nhập / Access Dashboard without being logged in
    # VI: Truy cập URL Dashboard trực tiếp khi chưa có session → phải redirect về login
    # EN: Direct URL access to Dashboard without session → must redirect to login
    Given Tôi chưa đăng nhập vào hệ thống (không có session)
    When  Tôi truy cập trực tiếp URL "https://app.promer.ai/"
    Then  Tôi được tự động redirect về trang "/sign-in"
    And   Tôi không thể thấy bất kỳ dữ liệu nào của Dashboard

  @negative @EC-2.3
  Scenario: Session hết hạn trong khi đang xem Dashboard / Session expires while viewing Dashboard
    # VI: Token hết hạn → thông báo rõ ràng và redirect về login, không crash
    # EN: Token expires → clear notification and redirect to login, no crash
    Given Session đăng nhập đã hết hạn (token expired)
    When  Tôi thực hiện một hành động trên Dashboard (scroll, click...)
    Then  Thông báo "Phiên đăng nhập đã hết hạn / Session expired" được hiển thị
    And   Tôi được redirect về trang "/sign-in"

  @negative @EC-2.4
  Scenario: Dashboard xử lý đúng khi API trả về lỗi 500 / Dashboard handles API 500 error gracefully
    # VI: Server lỗi → hiện thông báo lỗi thân thiện, không hiện màn hình trắng
    # EN: Server error → show friendly error message, no blank screen crash
    Given API của Dashboard đang trả về lỗi 500
    When  Tôi mở trang Dashboard
    Then  Trang không hiển thị màn hình trắng hoặc lỗi JavaScript
    And   Thông báo lỗi thân thiện được hiển thị cho người dùng
    And   Tôi vẫn nhìn thấy phần Navigation menu và header

  # ============================================================================
  # EDGE CASE
  # ============================================================================

  @edge @EC-2.1
  Scenario: Dashboard với người dùng mới chưa có dữ liệu / Dashboard for new user with no data
    # VI: Tài khoản mới → phải hiện empty state, không crash, không lỗi API
    # EN: New account → must show empty state, no crash, no API error
    Given Tôi đã đăng nhập với tài khoản mới chưa có dữ liệu nào
    When  Tôi xem trang Dashboard
    Then  Dashboard hiển thị trạng thái "empty state" rõ ràng
    And   Không có thông báo lỗi API nào xuất hiện
    And   Không có lỗi JavaScript nào trong console

  @edge @EC-2.5
  Scenario: Widget hiển thị đúng khi số liệu rất lớn / Widget displays correctly with very large numbers
    # VI: Số triệu, tỷ → phải format đúng (1.2M, 3.5B), không tràn layout
    # EN: Millions, billions → must format correctly (1.2M, 3.5B), no layout overflow
    Given Có tài khoản với dữ liệu số liệu lớn hơn 1.000.000
    When  Tôi xem trang Dashboard
    Then  Số liệu lớn được format thành dạng rút gọn (ví dụ: "1.2M", "3.5B")
    And   Số liệu không bị tràn ra ngoài widget card

  @edge @EC-2.6
  Scenario: Logout ở một tab ảnh hưởng đến các tab khác / Logout in one tab affects other open tabs
    # VI: Nhiều tab mở → logout ở tab 1 → tab 2 phải nhận biết session hết
    # EN: Multiple tabs → logout in tab 1 → tab 2 must detect session ended
    Given Tôi đang mở Dashboard trên Tab 1 và Tab 2 cùng lúc
    When  Tôi click "Logout" trên Tab 1
    And   Tôi chuyển sang Tab 2 và thực hiện một thao tác
    Then  Tab 2 nhận biết session đã hết và redirect về trang "/sign-in"

  # ============================================================================
  # UI / UX
  # ============================================================================

  @ui @AC-2.7
  Scenario: Dashboard hiển thị đúng trên màn hình mobile / Dashboard displays correctly on mobile
    # VI: Viewport mobile 390px → layout single-column, không có scroll ngang
    # EN: Mobile viewport 390px → single-column layout, no horizontal scroll
    Given Trình duyệt đang ở chế độ mobile viewport (390x844 - iPhone 13)
    When  Tôi đăng nhập và xem trang Dashboard
    Then  Layout Dashboard chuyển sang dạng một cột (single-column)
    And   Trang không có scroll ngang (horizontal scroll)
    And   Tất cả nội dung hiển thị trong màn hình

  # ============================================================================
  # PERFORMANCE
  # ============================================================================

  @perf @AC-2.6
  Scenario: Dashboard phải load xong trong vòng 5 giây / Dashboard must fully load within 5 seconds
    # VI: Cho phép tối đa 5s vì Dashboard phải load nhiều data từ API
    # EN: Allow up to 5s because Dashboard loads multiple data from APIs
    When  Tôi bắt đầu đo thời gian và mở trang Dashboard
    And   Tôi chờ đến khi tất cả widget thống kê đều hiển thị
    Then  Tổng thời gian load phải nhỏ hơn 5000ms

  @perf
  Scenario: Navigation giữa các trang diễn ra trong vòng 2 giây / Navigation between pages within 2 seconds
    # VI: Điều hướng client-side (SPA) phải nhanh, tối đa 2 giây
    # EN: Client-side navigation (SPA) must be fast, maximum 2 seconds
    When  Tôi bắt đầu đo thời gian và click vào một mục Navigation menu
    Then  Trang mới hiển thị xong trong vòng 2000ms
