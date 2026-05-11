// Test data cho tính năng Login — app.promer.ai
// Skill ref: qa-skill.md § Fixture pattern
// Thông tin nhạy cảm (email/password thật) được đọc từ file .env

// ── Tài khoản hợp lệ — đọc từ .env, không hardcode ──────────────────────────
const VALID = {
  email:    process.env.TEST_EMAIL,
  password: process.env.TEST_PASSWORD,
};

// Kiểm tra sớm: nếu thiếu .env thì dừng lại và báo lỗi rõ ràng
if (!VALID.email || !VALID.password) {
  throw new Error(
    'Thiếu thông tin đăng nhập trong file .env!\n' +
    'Hãy điền vào:\n' +
    '  TEST_EMAIL=your_email@example.com\n' +
    '  TEST_PASSWORD=your_password'
  );
}

// ── Tài khoản không hợp lệ — dùng cho @negative cases ───────────────────────
const INVALID = {
  wrongPassword:    'wrong-password-999',
  nonExistentEmail: 'notexist_xyz@fake.com',
  anyPassword:      'anyPassword123',
  badFormatEmail:   'not-an-email',
  somePassword:     'somePassword123',
};

// ── Dữ liệu biên — dùng cho @edge cases ──────────────────────────────────────
const EDGE = {
  // EC-1.1: Email có khoảng trắng đầu/cuối (copy-paste nhầm)
  emailWithSpaces: `  ${VALID.email}  `,

  // EC-1.2: Password chứa ký tự đặc biệt — test backend escaping
  specialCharPassword: '!@#$%^&*()_+Test1',

  // EC-1.3: Email dài 252 ký tự — gần giới hạn RFC 5321 (max 254)
  longEmail: 'a'.repeat(243) + '@test.com',

  // EC-1.4: SQL Injection — test prepared statements
  sqlInjection: "' OR '1'='1",

  // EC-1.5: XSS payload — test output escaping
  xssPayload: "<script>alert('XSS')</script>",

  // Từ khóa lỗi SQL điển hình — dùng để kiểm tra response không lộ lỗi DB
  sqlErrorKeywords: /sql|syntax error|ORA-|mysql|pg_query/i,
};

module.exports = { VALID, INVALID, EDGE };
