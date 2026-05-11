# ==============================================================================
# FEATURE: Tìm kiếm & Filter / Search & Filter
# App: https://app.promer.ai
# Design System: Shopify Polaris
# Requirement refs: AC-4.1 → AC-4.8, EC-4.1 → EC-4.9
# ==============================================================================

Feature: Tìm kiếm và lọc dữ liệu / Search and Filter
  # VI: Người dùng tìm kiếm theo từ khóa và lọc danh sách theo tiêu chí
  # EN: Users search by keyword and filter lists by criteria

  Background:
    # VI: Đã đăng nhập, đang ở trang có danh sách và thanh tìm kiếm
    # EN: Logged in, currently on a page with a list and search bar
    Given Tôi đã đăng nhập thành công với tài khoản "anvnt@firegroup.io"
    And   Tôi đang ở trang có danh sách dữ liệu và thanh tìm kiếm
    And   Danh sách đang hiển thị đầy đủ (chưa có filter nào active)

  # ============================================================================
  # HAPPY CASE
  # ============================================================================

  @happy @AC-4.1
  Scenario: Tìm kiếm theo từ khóa trả về đúng kết quả / Keyword search returns correct results
    # VI: Nhập từ khóa → chỉ hiện item chứa từ khóa, không có item không liên quan
    # EN: Type keyword → only matching items shown, no unrelated items
    Given Danh sách có chứa item với tên "Promer Campaign"
    When  Tôi nhập "Promer" vào ô tìm kiếm
    Then  Danh sách chỉ hiển thị các item có chứa từ "Promer"
    And   Không có item nào không liên quan đến "Promer" được hiển thị

  @happy @AC-4.3
  Scenario: Xóa từ khóa tìm kiếm khôi phục toàn bộ danh sách / Clear search keyword restores full list
    # VI: Xóa từ khóa → danh sách quay về trạng thái ban đầu, đầy đủ item
    # EN: Clear keyword → list returns to original state with all items
    Given Tôi đã nhập từ khóa "Promer" và danh sách đang được lọc
    When  Tôi xóa toàn bộ nội dung trong ô tìm kiếm
    Then  Danh sách hiển thị lại đầy đủ tất cả item như trước khi tìm kiếm

  @happy @AC-4.4
  Scenario: Filter nhiều tiêu chí cùng lúc cho kết quả giao (AND) / Multiple filters return intersection (AND) results
    # VI: Bật nhiều filter → kết quả phải thỏa mãn TẤT CẢ filter (logic AND)
    # EN: Enable multiple filters → results must satisfy ALL filters (AND logic)
    When  Tôi chọn filter trạng thái "Active"
    And   Tôi chọn filter khoảng ngày từ "01/01/2026" đến "31/01/2026"
    Then  Chỉ hiển thị item vừa có trạng thái "Active" vừa nằm trong khoảng ngày đã chọn
    And   Item chỉ thỏa một trong hai điều kiện không được hiển thị

  @happy @AC-4.5
  Scenario: Nút "Xóa tất cả filter" reset toàn bộ về mặc định / "Clear all filters" resets everything to default
    # VI: Đang có nhiều filter active → click "Clear all" → danh sách đầy đủ trở lại
    # EN: Multiple filters active → click "Clear all" → full list restored
    Given Tôi đang có filter trạng thái "Active" và filter ngày đang active
    When  Tôi nhấn nút "Xóa tất cả / Clear all filters"
    Then  Tất cả filter được bỏ về trạng thái mặc định
    And   Danh sách hiển thị lại đầy đủ tất cả item

  @happy @AC-4.7
  Scenario: Filter theo trạng thái Active/Inactive hoạt động đúng / Status filter Active/Inactive works correctly
    # VI: Chọn filter "Active" → chỉ hiện item có status Active
    # EN: Select "Active" filter → only show items with Active status
    When  Tôi chọn filter trạng thái "Active" từ dropdown
    Then  Tất cả item trong danh sách đều có trạng thái "Active"
    And   Không có item nào có trạng thái "Inactive" được hiển thị
    And   Số lượng kết quả hiển thị là chính xác

  @happy @AC-4.8
  Scenario: Filter theo khoảng ngày ẩn item ngoài phạm vi / Date range filter hides out-of-range items
    # VI: Chọn khoảng ngày → item ngoài khoảng bị ẩn
    # EN: Select date range → items outside the range are hidden
    When  Tôi chọn khoảng ngày từ "01/03/2026" đến "31/03/2026"
    Then  Chỉ hiển thị item có ngày nằm trong tháng 3/2026
    And   Các item có ngày trước 01/03/2026 hoặc sau 31/03/2026 không được hiển thị

  @happy @AC-4.6
  Scenario: Số lượng kết quả tìm kiếm hiển thị chính xác / Search result count is accurate
    # VI: "Showing X of Y results" phải khớp với số item thực sự trên màn hình
    # EN: "Showing X of Y results" must match actual number of visible items
    When  Tôi nhập từ khóa và danh sách được lọc
    Then  Số lượng kết quả hiển thị (ví dụ "12 results") khớp với số item thực tế trên trang
    And   Tổng số (ví dụ "of 150") phản ánh đúng tổng số item khớp từ khóa

  # ============================================================================
  # NEGATIVE CASE
  # ============================================================================

  @negative @AC-4.2
  Scenario: Hiển thị empty state khi không có kết quả tìm kiếm / Show empty state when no search results
    # VI: Tìm từ không tồn tại → hiện thông báo "Không tìm thấy kết quả", không hiện trang trắng
    # EN: Search non-existent term → show "No results found", never show blank page
    When  Tôi nhập "xyzxyzxyz_không_tồn_tại_99999" vào ô tìm kiếm
    Then  Thông báo "Không tìm thấy kết quả / No results found" được hiển thị
    And   Trang không hiển thị màn hình trắng hoặc lỗi
    And   Thanh tìm kiếm vẫn hiển thị và có thể nhập lại

  @negative @EC-4.5
  Scenario: Lỗi khi ngày bắt đầu lớn hơn ngày kết thúc trong filter / Error when start date is after end date in filter
    # VI: Ngày bắt đầu > ngày kết thúc → validation báo lỗi, không áp dụng filter sai
    # EN: Start date > end date → validation error, invalid filter not applied
    When  Tôi chọn ngày bắt đầu "31/12/2026"
    And   Tôi chọn ngày kết thúc "01/01/2026" (trước ngày bắt đầu)
    Then  Thông báo lỗi "Ngày bắt đầu phải trước ngày kết thúc / Start date must be before end date" được hiển thị
    And   Filter ngày không được áp dụng với giá trị không hợp lệ này

  # ============================================================================
  # EDGE CASE
  # ============================================================================

  @edge @EC-4.1 @security
  Scenario: Từ khóa tìm kiếm chứa ký tự đặc biệt SQL không gây lỗi / Special SQL characters in search don't cause errors
    # VI: Ký tự "%" hay "'" thường dùng trong SQL LIKE → phải escape đúng, không gây lỗi
    # EN: "%" or "'" are SQL LIKE special chars → must be properly escaped, no errors
    When  Tôi nhập "100% valid" vào ô tìm kiếm
    Then  Trang không hiển thị lỗi SQL hoặc lỗi server
    And   Kết quả tìm kiếm hiển thị bình thường (có thể không có kết quả, nhưng không crash)
    When  Tôi nhập "O'Brien" vào ô tìm kiếm
    Then  Trang không hiển thị lỗi SQL hoặc lỗi server

  @edge @EC-4.2
  Scenario: Tìm kiếm không phân biệt chữ hoa/thường / Search is case-insensitive
    # VI: "Apple", "apple", "APPLE" đều phải cho cùng kết quả
    # EN: "Apple", "apple", "APPLE" must all return the same results
    Given Danh sách có chứa item với tên "Apple Campaign"
    When  Tôi nhập "apple" (chữ thường) vào ô tìm kiếm
    Then  Item "Apple Campaign" được tìm thấy trong kết quả
    When  Tôi nhập "APPLE" (chữ hoa) vào ô tìm kiếm
    Then  Item "Apple Campaign" vẫn được tìm thấy trong kết quả

  @edge @EC-4.3
  Scenario: Tìm kiếm với từ khóa rất dài không gây crash / Very long search keyword doesn't crash the app
    # VI: > 200 ký tự → không crash, cắt bớt hoặc hiện lỗi rõ ràng
    # EN: > 200 characters → no crash, truncate or show clear error
    When  Tôi nhập chuỗi ký tự dài 300 ký tự vào ô tìm kiếm
    Then  Trang không crash hoặc hiện lỗi JavaScript
    And   App xử lý gracefully (cắt bớt từ khóa hoặc hiện thông báo giới hạn)

  @edge @EC-4.4
  Scenario: Tìm kiếm trả về nhiều kết quả phải có phân trang / Large search results must be paginated
    # VI: Hàng nghìn kết quả → không load tất cả một lúc, phải có pagination
    # EN: Thousands of results → must not load all at once, must paginate
    Given Hệ thống có hơn 1000 item khớp với từ khóa tìm kiếm
    When  Tôi nhập từ khóa và nhận được nhiều kết quả
    Then  Chỉ một trang kết quả được load (không load toàn bộ 1000+ item)
    And   Có điều khiển phân trang (pagination) hiển thị trên trang

  @edge @EC-4.6
  Scenario: Tìm kiếm liên tục nhanh được debounce, không spam API / Rapid typing is debounced, API not spammed
    # VI: Mỗi lần gõ không gọi API ngay — chờ 300-500ms sau lần gõ cuối mới gọi
    # EN: Each keystroke doesn't trigger API immediately — wait 300-500ms after last keystroke
    When  Tôi gõ nhanh 10 ký tự liên tiếp "P-r-o-m-e-r-T-e-s-t" trong vòng 1 giây
    Then  Số lần gọi API tìm kiếm ít hơn 10 lần (debounce hoạt động)
    And   Kết quả cuối cùng hiển thị đúng với từ khóa "PromerTest"

  @edge @EC-4.7
  Scenario: Từ khóa có khoảng trắng đầu/cuối cho kết quả như không có / Keyword with extra whitespace returns same results
    # VI: " apple " và "apple" phải cho cùng kết quả (server trim whitespace)
    # EN: " apple " and "apple" must return same results (server trims whitespace)
    Given Danh sách có chứa item với tên "Apple Campaign"
    When  Tôi nhập "  Apple  " (có khoảng trắng đầu và cuối)
    Then  Item "Apple Campaign" vẫn được tìm thấy trong kết quả
    And   Kết quả giống hệt như khi tìm "Apple" không có khoảng trắng

  @edge @EC-4.8
  Scenario: URL phản chiếu trạng thái filter để hỗ trợ deep link / URL reflects filter state for deep link support
    # VI: Copy URL đang filter → paste vào tab mới → filter được áp dụng lại đúng
    # EN: Copy filtered URL → paste in new tab → same filter correctly applied
    When  Tôi chọn filter trạng thái "Active" và nhập từ khóa "Promer"
    Then  URL thay đổi để chứa thông tin filter (ví dụ "?status=active&q=Promer")
    When  Tôi copy URL hiện tại và mở trong tab trình duyệt mới
    Then  Filter "Active" và từ khóa "Promer" được áp dụng lại tự động

  @edge @EC-4.9
  Scenario: Tìm kiếm tiếng Việt có dấu và không dấu cho cùng kết quả / Vietnamese with and without diacritics returns same results
    # VI: "Hà Nội" và "ha noi" nên trả cùng kết quả (nếu app hỗ trợ không dấu)
    # EN: "Hà Nội" and "ha noi" should return same results (if app supports diacritic-insensitive search)
    Given Danh sách có chứa item với tên "Chiến dịch Hà Nội"
    When  Tôi nhập "ha noi" (không dấu) vào ô tìm kiếm
    Then  Item "Chiến dịch Hà Nội" được tìm thấy trong kết quả
    # Ghi chú / Note: Test này ghi nhận hành vi. Nếu FAIL → app chưa hỗ trợ tìm kiếm không dấu

  # ============================================================================
  # UI / UX
  # ============================================================================

  @ui
  Scenario: Placeholder text hiển thị đúng trên ô tìm kiếm / Search box shows correct placeholder text
    # VI: Ô tìm kiếm trống → hiện placeholder hướng dẫn người dùng
    # EN: Empty search box → show placeholder to guide user
    Then  Ô tìm kiếm hiển thị placeholder text hướng dẫn (ví dụ "Tìm kiếm..." hoặc "Search...")
    And   Ô tìm kiếm có thể nhận focus và nhập liệu

  @ui
  Scenario: Tag/badge hiển thị filter đang active / Tags/badges show active filters
    # VI: Khi có filter active → hiện tag/badge thể hiện filter nào đang bật
    # EN: When filters are active → show tags/badges indicating active filters
    When  Tôi chọn filter trạng thái "Active"
    Then  Một tag/badge "Active" hiển thị gần khu vực filter
    And   Tôi có thể click "x" trên tag đó để bỏ filter "Active"

  # ============================================================================
  # PERFORMANCE
  # ============================================================================

  @perf
  Scenario: Kết quả tìm kiếm hiển thị trong vòng 1 giây / Search results appear within 1 second
    # VI: Sau khi debounce kết thúc → kết quả phải hiện trong ≤ 1s
    # EN: After debounce ends → results must appear within ≤ 1s
    When  Tôi nhập từ khóa "Promer" và chờ debounce kết thúc (500ms)
    Then  Kết quả tìm kiếm hiển thị trong vòng 1000ms sau khi debounce kết thúc

  @perf
  Scenario: Áp dụng filter không làm trang bị giật hoặc tải lại toàn trang / Applying filter doesn't cause page reload
    # VI: Filter là client-side hoặc partial update — không reload toàn trang
    # EN: Filter is client-side or partial update — no full page reload
    When  Tôi chọn một filter từ dropdown
    Then  Trang không reload hoàn toàn (URL có thể thay đổi nhưng không flicker)
    And   Kết quả được cập nhật trong vòng 1500ms
