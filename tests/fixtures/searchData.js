// Test data cho tính năng Search & Filter — app.promer.ai
// Skill ref: qa-skill.md § Fixture pattern
// AC refs: AC-4.1 → AC-4.8, EC-4.1 → EC-4.9

const VALID = {
  email:    process.env.TEST_EMAIL,
  password: process.env.TEST_PASSWORD,
};

if (!VALID.email || !VALID.password) {
  throw new Error(
    'Thiếu thông tin đăng nhập trong file .env!\n' +
    '  TEST_EMAIL=your_email@example.com\n' +
    '  TEST_PASSWORD=your_password'
  );
}

// ── URL trang danh sách có thanh tìm kiếm ─────────────────────────────────────
// /ad-library — trang thư viện quảng cáo, thường có search + filter đầy đủ nhất
// Điều chỉnh SEARCH_LIST_URL trong .env nếu app dùng URL khác
const SEARCH_URLS = {
  listPage: process.env.SEARCH_LIST_URL || '/ad-library',
};

// ── Dữ liệu tìm kiếm ──────────────────────────────────────────────────────────
const SEARCH_DATA = {
  // AC-4.1, AC-4.3: từ khóa hợp lệ (cần có item này trong hệ thống để test HAPPY)
  existingKeyword:  'Promer',
  existingItemName: 'Promer Campaign',

  // AC-4.2: từ khóa chắc chắn không tồn tại → kiểm tra empty state
  noResultKeyword: 'xyzxyzxyz_không_tồn_tại_99999',

  // EC-4.1: ký tự đặc biệt SQL — test SQL injection / escaping
  sqlChars: ["100% valid", "O'Brien", "1 OR 1=1", "'; DROP TABLE"],

  // EC-4.3: từ khóa rất dài (> 200 ký tự) → không crash
  longKeyword: 'A'.repeat(300),

  // EC-4.7: từ khóa có khoảng trắng thừa
  keywordWithSpaces: '  Apple  ',
  keywordTrimmed:    'Apple',

  // EC-4.2: case-insensitive search
  mixedCaseKeyword:  'apple',
  upperCaseKeyword:  'APPLE',
  existingCaseName:  'Apple Campaign',

  // EC-4.9: tiếng Việt có dấu / không dấu
  vietnameseWithAccent: 'Hà Nội',
  vietnameseNoAccent:   'ha noi',
  vietnameseItemName:   'Chiến dịch Hà Nội',

  // EC-4.6: debounce test — gõ nhanh N ký tự
  debounceTypingChars: 'PromerTest',

  // AC-4.4, AC-4.8: filter ngày hợp lệ (tháng 3/2026)
  dateFilter: {
    start: '01/03/2026',
    end:   '31/03/2026',
  },

  // EC-4.5: filter ngày không hợp lệ (start > end)
  invalidDateFilter: {
    start: '31/12/2026',
    end:   '01/01/2026',
  },

  // AC-4.7: filter trạng thái
  statusValues: {
    active:   'Active',
    inactive: 'Inactive',
  },
};

// ── Ngưỡng hiệu năng / SLA ─────────────────────────────────────────────────────
const SLA = {
  searchResultMs: 1000,   // PERF: sau debounce → kết quả hiện trong ≤ 1s
  filterUpdateMs: 1500,   // PERF: áp dụng filter → kết quả cập nhật trong ≤ 1.5s
  debounceMs:     500,    // EC-4.6: debounce window
};

// ── Text kỳ vọng / Expected patterns ──────────────────────────────────────────
const EXPECTED = {
  emptyState:       /no results|không tìm thấy|0 result/i,
  searchPlaceholder: /search|tìm kiếm/i,
  resultCountFormat: /\d+\s*(result|kết quả)/i,
  dateRangeError:   /start date|ngày bắt đầu.*trước|before end date/i,
  // Text KHÔNG được xuất hiện khi có SQL injection
  sqlErrorText:     /sql error|syntax error|ORA-|mysql_fetch|pg_query/i,
  serverErrorText:  /internal server error|uncaught exception|500/i,
};

module.exports = { VALID, SEARCH_URLS, SEARCH_DATA, SLA, EXPECTED };
