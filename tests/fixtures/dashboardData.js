// Test data cho tính năng Dashboard — app.promer.ai
// Skill ref: qa-skill.md § Fixture pattern
// Thông tin nhạy cảm (email/password thật) được đọc từ file .env

// ── Tài khoản hợp lệ — đọc từ .env, không hardcode ──────────────────────────
const VALID = {
  email:    process.env.TEST_EMAIL,
  password: process.env.TEST_PASSWORD,
};

if (!VALID.email || !VALID.password) {
  throw new Error(
    'Thiếu thông tin đăng nhập trong file .env!\n' +
    'Hãy điền vào:\n' +
    '  TEST_EMAIL=your_email@example.com\n' +
    '  TEST_PASSWORD=your_password'
  );
}

// ── Ngưỡng performance / SLA ─────────────────────────────────────────────────
const SLA = {
  dashboardLoadMs:  5000,   // AC-2.6: Dashboard phải load xong trong 5 giây
  navigationMs:     2000,   // perf: SPA navigation tối đa 2 giây
};

// ── URL Dashboard ─────────────────────────────────────────────────────────────
const URLS = {
  dashboard: '/',           // URL gốc — redirect đến dashboard sau login
  signIn:    '/sign-in',
};

// ── Text cần kiểm tra (không phụ thuộc ngôn ngữ UI) ──────────────────────────
const EXPECTED = {
  // AC-2.2: user info phải hiển thị — không được là "undefined" hoặc rỗng
  forbiddenUserText: /undefined|null/i,

  // AC-2.3: placeholder value trong widget khi chưa có data
  widgetPlaceholder: '—',

  // EC-2.4: nội dung KHÔNG được xuất hiện trên màn hình khi API lỗi
  forbiddenErrorText: /internal server error|uncaught|error boundary|something went wrong/i,
};

module.exports = { VALID, SLA, URLS, EXPECTED };
