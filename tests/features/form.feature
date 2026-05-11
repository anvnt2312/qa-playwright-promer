# ==============================================================================
# FEATURE: Form nhập liệu / Data Entry Form
# App: https://app.promer.ai
# Design System: Shopify Polaris (TextField, Select, DatePicker...)
# Requirement refs: AC-3.1 → AC-3.7, EC-3.1 → EC-3.8
# ==============================================================================

Feature: Form nhập liệu / Data Entry Form
  # VI: Người dùng nhập, chỉnh sửa và lưu dữ liệu thông qua form Polaris
  # EN: Users input, edit, and save data through Polaris-based forms

  Background:
    # VI: Người dùng đã đăng nhập và đang ở trang có form nhập liệu
    # EN: User is logged in and on a page containing a data entry form
    Given Tôi đã đăng nhập thành công với tài khoản "anvnt@firegroup.io"
    And   Tôi đang ở trang có form nhập liệu

  # ============================================================================
  # HAPPY CASE
  # ============================================================================

  @happy @AC-3.3
  Scenario: Submit form thành công với dữ liệu hợp lệ / Successful form submission with valid data
    # VI: Điền đủ và đúng tất cả field → submit → thông báo thành công
    # EN: Fill all fields correctly → submit → success notification
    When  Tôi điền đầy đủ tất cả field bắt buộc với dữ liệu hợp lệ
    And   Tôi nhấn nút "Save" hoặc "Submit"
    Then  Thông báo thành công được hiển thị (toast "Đã lưu thành công" hoặc tương tự)
    And   Dữ liệu được lưu vào hệ thống

  @happy @AC-3.4
  Scenario: Chỉnh sửa form đã có dữ liệu — data cũ hiển thị sẵn / Edit existing form — old data pre-filled
    # VI: Mở form ở chế độ edit → giá trị cũ phải điền sẵn vào các field
    # EN: Open form in edit mode → existing values must be pre-filled
    Given Đã có một bản ghi với dữ liệu cụ thể trong hệ thống
    When  Tôi mở form chỉnh sửa (edit) bản ghi đó
    Then  Tất cả field đều hiển thị giá trị dữ liệu đã lưu trước đó
    And   Không có field nào bị trống khi đã có dữ liệu

  @happy @AC-3.5
  Scenario: Nhấn Cancel hủy mọi thay đổi chưa lưu / Cancel button discards all unsaved changes
    # VI: Thay đổi dữ liệu rồi Cancel → quay về giá trị ban đầu, không lưu
    # EN: Modify data then cancel → revert to original values, nothing saved
    Given Đã có một bản ghi với dữ liệu trong hệ thống
    When  Tôi mở form chỉnh sửa và thay đổi một số field
    And   Tôi nhấn nút "Cancel" hoặc "Discard"
    Then  Các thay đổi không được lưu vào hệ thống
    And   Dữ liệu quay về giá trị ban đầu trước khi chỉnh sửa

  # ============================================================================
  # NEGATIVE CASE
  # ============================================================================

  @negative @AC-3.1 @AC-3.2
  Scenario: Hiển thị lỗi khi submit thiếu field bắt buộc / Show error when submitting with missing required fields
    # VI: Field bắt buộc bị bỏ trống → lỗi inline hiện ngay dưới field, không gọi API
    # EN: Required field is empty → inline error shown below field, no API call
    When  Tôi bỏ trống một field được đánh dấu bắt buộc (dấu "*" hoặc "Required")
    And   Tôi nhấn nút "Save"
    Then  Thông báo lỗi validation hiện ngay dưới field bị bỏ trống
    And   Không có request nào được gửi lên server
    And   Form không bị đóng hay reset

  @negative @AC-3.6
  Scenario Outline: Số field không chấp nhận ký tự không hợp lệ / Number field rejects invalid characters
    # VI: Field chỉ nhận số → nhập chữ cái, ký tự đặc biệt → phải bị từ chối hoặc báo lỗi
    # EN: Number-only field → input letters or special chars → rejected or error shown
    When  Tôi nhập "<invalid_input>" vào field số
    Then  "<invalid_input>" không được chấp nhận vào field
    Or    Thông báo lỗi "Vui lòng nhập số / Please enter a number" được hiển thị

    Examples:
      | invalid_input | mô_tả / description          |
      | abc           | Chữ cái / Letters            |
      | !@#           | Ký tự đặc biệt / Special chars |
      | 1.5           | Số thập phân (nếu chỉ nhận nguyên) / Decimal (if integer only) |
      | -5            | Số âm (nếu không cho phép) / Negative (if not allowed)        |

  # ============================================================================
  # EDGE CASE
  # ============================================================================

  @edge @EC-3.1
  Scenario: TextField từ chối hoặc cảnh báo khi nhập text quá dài / TextField rejects or warns for text over 255 chars
    # VI: > 255 ký tự → cắt hoặc hiện lỗi rõ ràng, không để lọt lên server
    # EN: > 255 characters → truncate or show clear error, don't let it reach server
    When  Tôi nhập đoạn văn bản dài 300 ký tự vào một TextField
    Then  App hiện cảnh báo về độ dài tối đa
    Or    App tự động cắt bớt tại 255 ký tự
    And   Không có lỗi 500 nào từ server

  @edge @EC-3.2
  Scenario: TextField hiển thị HTML/script dạng plain text, không render / TextField displays HTML as plain text, not rendered
    # VI: Dán "<b>bold</b>" → phải hiện đúng ký tự, không in đậm thành bold
    # EN: Paste "<b>bold</b>" → must display the characters, not render as bold
    When  Tôi dán nội dung "<b>Tiêu đề</b><script>alert(1)</script>" vào một TextField
    And   Tôi submit form thành công
    Then  Dữ liệu được hiển thị lại dưới dạng text thuần (plain text)
    And   Không có thẻ HTML nào được render trên trang
    And   Không có JavaScript nào được thực thi

  @edge @EC-3.3
  Scenario: Mất mạng khi đang submit form / Network drops while submitting form
    # VI: Mất kết nối giữa chừng → báo lỗi rõ, dữ liệu đã nhập không bị mất
    # EN: Connection drops mid-submit → clear error shown, entered data not lost
    When  Tôi điền đầy đủ form và nhấn "Save"
    And   Kết nối mạng bị ngắt trong lúc request đang được gửi
    Then  Thông báo lỗi "Không thể kết nối / Unable to connect" được hiển thị
    And   Dữ liệu tôi đã nhập vẫn còn hiển thị trên form (không bị mất)
    And   Tôi có thể thử submit lại sau khi mạng phục hồi

  @edge @EC-3.4
  Scenario: DatePicker không cho chọn ngày trong quá khứ / DatePicker blocks past date selection
    # VI: Nếu field ngày không cho phép quá khứ → chọn ngày hôm qua → báo lỗi
    # EN: If date field disallows past dates → select yesterday → show error
    When  Tôi mở DatePicker trên form
    And   Tôi chọn một ngày trong quá khứ (hôm qua hoặc trước đó)
    Then  Thông báo "Ngày không hợp lệ / Invalid date" được hiển thị
    And   Nút "Save" không cho phép submit

  @edge @EC-3.5
  Scenario: Cảnh báo khi rời trang với thay đổi chưa lưu / Warn before leaving page with unsaved changes
    # VI: Thay đổi form rồi click menu khác → dialog "Bạn có muốn rời không?"
    # EN: Modify form then click elsewhere → dialog "Are you sure you want to leave?"
    When  Tôi thay đổi một field trên form (chưa lưu)
    And   Tôi click vào một mục trên Navigation menu để rời khỏi trang
    Then  Dialog xác nhận "Bạn có muốn rời không? / Are you sure you want to leave?" xuất hiện
    And   Nếu tôi chọn "Ở lại / Stay", form vẫn còn nguyên dữ liệu đã nhập
    And   Nếu tôi chọn "Rời đi / Leave", tôi được điều hướng và thay đổi bị hủy

  @edge @EC-3.7
  Scenario: TextField chấp nhận và lưu đúng ký tự emoji / TextField accepts and correctly stores emoji
    # VI: Emoji là Unicode → không được crash, DB cần hỗ trợ utf8mb4
    # EN: Emoji is Unicode → must not crash, DB needs utf8mb4 support
    When  Tôi nhập "Xin chào 👋 từ Việt Nam 🇻🇳" vào một TextField
    And   Tôi submit form thành công
    Then  Emoji được lưu và hiển thị lại đúng như đã nhập
    And   Không có lỗi nào xuất hiện liên quan đến encoding

  @edge @EC-3.8
  Scenario: Form hiển thị đúng lỗi từ server khi API trả về 422 / Form shows correct field errors from server 422 response
    # VI: Server validation thất bại (422) → hiện lỗi đúng field, không crash
    # EN: Server validation fails (422) → show error on correct field, no crash
    When  Tôi submit form với dữ liệu vượt qua client-side validation nhưng thất bại ở server
    And   Server trả về lỗi 422 với thông tin field cụ thể
    Then  Thông báo lỗi hiển thị ngay dưới đúng field bị lỗi
    And   Màn hình không crash hoặc hiện trang trắng
    And   Các field khác không có lỗi vẫn giữ nguyên dữ liệu đã nhập

  # ============================================================================
  # UI / UX
  # ============================================================================

  @ui @AC-3.1
  Scenario: Field bắt buộc được đánh dấu rõ ràng / Required fields are clearly marked
    # VI: Nhìn vào form → phải thấy dấu "*" hoặc chữ "(Required)" cạnh field bắt buộc
    # EN: Looking at form → must see "*" or "(Required)" next to required fields
    Then  Tất cả field bắt buộc đều có dấu "*" hoặc nhãn "(Required)" hiển thị
    And   Người dùng có thể phân biệt được field bắt buộc và field tùy chọn

  @ui @AC-3.7
  Scenario: Nút Save bị vô hiệu hóa trong lúc đang submit / Save button disabled while submitting
    # VI: Click Save → button bị disable ngay, tránh submit 2 lần do click nhanh
    # EN: Click Save → button disabled immediately, prevents double-submit
    When  Tôi điền đầy đủ dữ liệu hợp lệ và nhấn "Save"
    Then  Nút "Save" bị vô hiệu hóa ngay lập tức trong khi request đang được gửi
    And   Chỉ một request duy nhất được gửi lên server, không bị duplicate

  # ============================================================================
  # PERFORMANCE
  # ============================================================================

  @perf
  Scenario: Form load và hiển thị dữ liệu cũ trong vòng 3 giây / Form loads and pre-fills data within 3 seconds
    # VI: Mở form chỉnh sửa → tất cả field phải điền sẵn xong trong 3 giây
    # EN: Open edit form → all fields must be pre-filled within 3 seconds
    Given Đã có một bản ghi với dữ liệu trong hệ thống
    When  Tôi bắt đầu đo thời gian và mở form chỉnh sửa bản ghi đó
    Then  Tất cả field được điền sẵn dữ liệu trong vòng 3000ms

  @perf
  Scenario: Submit form và nhận phản hồi trong vòng 3 giây / Form submit and response received within 3 seconds
    # VI: Từ lúc click Save đến lúc thấy toast thành công ≤ 3s
    # EN: From clicking Save to seeing success toast ≤ 3s
    When  Tôi điền đầy đủ form hợp lệ và bắt đầu đo thời gian khi nhấn "Save"
    Then  Thông báo thành công xuất hiện trong vòng 3000ms
