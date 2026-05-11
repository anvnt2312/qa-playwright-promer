// Test data cho tính năng Form nhập liệu — app.promer.ai
// Skill ref: qa-skill.md § Fixture pattern
// AC refs: AC-3.1 → AC-3.7, EC-3.1 → EC-3.8

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

// ── URL trang form ─────────────────────────────────────────────────────────────
// Ghi chú: điều chỉnh FORM_PAGE_URL trong .env nếu trang form ở URL khác
// FormPage.loginAndGoto() sẽ tự tìm nút Create nếu đang ở trang list
const FORM_URLS = {
  listPage: process.env.FORM_LIST_URL  || '/static-ads',
  formPage: process.env.FORM_PAGE_URL  || '/static-ads',
};

// ── Dữ liệu điền vào form ─────────────────────────────────────────────────────
const FORM_DATA = {
  text: {
    valid:         'Test Campaign Promer',
    longText:      'A'.repeat(300),          // EC-3.1: > 255 ký tự
    emoji:         'Xin chào 👋 từ Việt Nam 🇻🇳',  // EC-3.7: Unicode emoji
    htmlInjection: '<b>Tiêu đề</b><script>alert(1)</script>',  // EC-3.2: XSS
  },
  number: {
    valid: '100',
    // AC-3.6 / EC-3.6: danh sách input không hợp lệ cho number field
    invalidInputs: [
      { value: 'abc',  label: 'Chữ cái / Letters' },
      { value: '!@#',  label: 'Ký tự đặc biệt / Special chars' },
      { value: '1.5',  label: 'Số thập phân / Decimal' },
      { value: '-5',   label: 'Số âm / Negative' },
    ],
  },
};

// ── Ngưỡng hiệu năng / SLA ─────────────────────────────────────────────────────
const SLA = {
  formLoadMs:      3000,   // AC-3.X perf: form load + pre-fill xong trong 3s
  submitResponseMs: 3000,  // AC-3.X perf: từ click Save đến toast thành công ≤ 3s
};

// ── Text kỳ vọng / Expected patterns ──────────────────────────────────────────
const EXPECTED = {
  successToast:     /saved|success|thành công|lưu/i,
  validationError:  /required|bắt buộc|cannot be blank|không được để trống/i,
  numberError:      /number|số|invalid|only numbers/i,
  maxLengthWarning: /255|maximum|max length|tối đa|too long/i,
  networkError:     /không thể kết nối|unable to connect|network error|offline/i,
  serverError:      /something went wrong|lỗi server|internal server|error/i,
  // EC-3.2: text HTML không được render thành HTML thật
  htmlNotRendered:  '<b>Tiêu đề</b>',  // phải hiện đúng ký tự, không in đậm
};

module.exports = { VALID, FORM_URLS, FORM_DATA, SLA, EXPECTED };
