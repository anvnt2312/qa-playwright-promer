// Page Object cho trang đăng nhập app.promer.ai/sign-in
// Design System: Shopify Polaris — dùng autocomplete attribute để locate input
// Skill ref: qa-skill.md § Page Object pattern

class LoginPage {
  constructor(page) {
    this.page = page;

    // ── Locators ─────────────────────────────────────────────────────────────
    // Polaris dùng type="text" với autocomplete="email", không phải type="email"
    this.emailInput = page.locator('input[autocomplete="email"]').first();
    this.passInput  = page.locator('input[autocomplete="current-password"]').first();
    this.submitBtn  = page.locator('button[type="submit"]').first();

    // Thông báo lỗi của Polaris: class critical hoặc role alert
    this.errorMsg   = page.locator('.Polaris-Text--critical, [role="alert"]').first();

    // Label để kiểm tra UI accessibility
    this.emailLabel = page.locator('label:has-text("Email")').first();
    this.passLabel  = page.locator('label:has-text("Password")').first();

    // Thông báo lỗi inline format email
    this.emailFormatError = page.locator('text=Enter a valid email').first();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  // Mở trang login và chờ form sẵn sàng (ô email hiển thị)
  async goto() {
    await this.page.goto('/sign-in');
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  // Chờ form đã load đủ 3 element: email, password, button
  async waitForReady() {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.submitBtn.waitFor({ state: 'visible', timeout: 10000 });
  }

  // ── Thao tác nhập liệu ─────────────────────────────────────────────────────

  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passInput.fill(password);
  }

  // Nhấn nút Continue (click thường)
  async submit() {
    await this.submitBtn.click();
  }

  // Force click dùng khi button bị disable — để test validation behavior
  async submitForce() {
    await this.submitBtn.click({ force: true });
  }

  // Nhấn phím Enter trên ô password (thay vì click chuột)
  async pressEnterOnPassword() {
    await this.passInput.press('Enter');
  }

  // Helper tổng hợp: điền form và submit — dùng trong beforeEach hoặc fixture
  async login(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  // ── Trạng thái / Truy vấn ──────────────────────────────────────────────────

  // Kiểm tra button có đang bị disable không (Polaris dùng aria-disabled)
  async isButtonDisabled() {
    const ariaDisabled   = await this.submitBtn.getAttribute('aria-disabled');
    const classAttr      = await this.submitBtn.getAttribute('class') || '';
    return ariaDisabled === 'true' || classAttr.includes('disabled');
  }

  // Lấy text của thông báo lỗi đang hiển thị
  async getErrorText() {
    await this.errorMsg.waitFor({ state: 'visible', timeout: 5000 });
    return (await this.errorMsg.textContent() || '').trim();
  }

  // Kiểm tra có lỗi nào đang hiện không (trả về boolean)
  async isErrorVisible() {
    return this.errorMsg.isVisible().catch(() => false);
  }
}

module.exports = { LoginPage };
