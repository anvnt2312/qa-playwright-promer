// Page Object cho trang Form nhập liệu — app.promer.ai
// Design System: Shopify Polaris (TextField, Select, DatePicker)
// Skill ref: qa-skill.md § Page Object pattern
// Ghi chú: Page object này generic — hoạt động với bất kỳ form Polaris nào.
//   Điều chỉnh FORM_PAGE_URL trong .env để trỏ đến đúng form của app.

const { DashboardPage } = require('./DashboardPage');

class FormPage {
  constructor(page) {
    this.page = page;

    // ── Buttons ──────────────────────────────────────────────────────────────
    // Nút Save/Submit — bao gồm "Analyze" (tên nút submit trong luồng tạo ads)
    this.saveBtn = page.getByRole('button', { name: /^(analyze|save|submit|create|publish|lưu|tạo)$/i })
      .or(page.locator('button[type="submit"]'))
      .first();

    // Nút Cancel/Discard
    this.cancelBtn = page.getByRole('button', { name: /^(cancel|discard|hủy|bỏ qua)$/i }).first();

    // Nút tạo mới / mở form — bao gồm "add product" trong luồng tạo ads
    this.createBtn = page
      .getByRole('button', { name: /create|new|add new|tạo mới/i })
      .or(page.locator('button').filter({ hasText: /^add product$/i }))
      .or(page.getByRole('link', { name: /create|new|add new|tạo mới/i }))
      .first();

    // ── Inputs ───────────────────────────────────────────────────────────────
    // Polaris TextField — input text đầu tiên trên form
    this.firstTextInput = page.locator('.Polaris-TextField__Input[type="text"]')
      .or(page.locator('input[type="text"]'))
      .first();

    // Input number — Polaris dùng type="number" hoặc inputmode="numeric"
    this.firstNumberInput = page.locator('input[type="number"]')
      .or(page.locator('input[inputmode="numeric"]'))
      .first();

    // Tất cả input text trên form (dùng để điền required fields)
    this.allTextInputs = page.locator(
      '.Polaris-TextField__Input[type="text"], input[type="text"], textarea'
    );

    // ── Validation errors ────────────────────────────────────────────────────
    // Polaris InlineError — hiện ngay dưới field khi validation fail
    this.inlineErrors = page.locator(
      '.Polaris-InlineError, [id$="-error"], [class*="InlineError"]'
    );

    // Alert banner (toàn trang)
    this.alertBanner = page.locator('[role="alert"]').first();

    // ── Success / Status ─────────────────────────────────────────────────────
    // Polaris Toast — xuất hiện sau khi submit thành công
    this.successToast = page.locator('[class*="Toast"]')
      .or(page.locator('[aria-live="polite"]').filter({ hasText: /saved|success|thành công/i }))
      .or(page.locator('[role="status"]').filter({ hasText: /saved|success|thành công/i }))
      .first();

    // ── Unsaved changes dialog ────────────────────────────────────────────────
    // Polaris Modal dialog — xuất hiện khi điều hướng rời form có thay đổi chưa lưu
    this.unsavedDialog = page.locator('[role="dialog"]').first();
    this.stayBtn = page.getByRole('button', {
      name: /stay|ở lại|keep editing|continue editing/i,
    }).first();
    this.leaveBtn = page.getByRole('button', {
      name: /leave|discard|rời|don.?t save/i,
    }).first();

    // ── DatePicker ────────────────────────────────────────────────────────────
    this.datePicker = page.locator('[class*="DatePicker"]').first();

    // ── Required field indicators ─────────────────────────────────────────────
    // Polaris đánh dấu required bằng "(optional)" trên optional field,
    // hoặc "*" trong label text — kiểm tra cả hai chiến lược
    this.requiredLabels = page.locator('label').filter({ hasText: /\*/ });
    this.optionalLabels = page.locator('label').filter({ hasText: /optional/i });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  // Đăng nhập và điều hướng đến trang form
  // Tự động click "add product" hoặc nút Create nếu cần để mở form nhập liệu
  async loginAndGoto(email, password, formUrl) {
    const dashboard = new DashboardPage(this.page);
    await dashboard.loginAndGoto(email, password);
    await this.page.goto(formUrl);
    // Chờ network idle để SPA render xong main content (sidebar load nhanh, wizard area cần thêm thời gian)
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(500);

    // Kiểm tra đã thấy form chưa
    const formVisible = await this.hasFormVisible().catch(() => false);
    if (formVisible) return;

    // Thử click "add product" (sidebar button trong luồng tạo ads)
    const addProductBtn = this.page.locator('button').filter({ hasText: /^add product$/i }).first();
    const hasAddProduct = await addProductBtn.isVisible().catch(() => false);
    if (hasAddProduct) {
      await addProductBtn.click();
      await this.page.waitForTimeout(800);
      return;
    }

    // Fallback: click nút Create/New nếu đang ở trang list
    const createVisible = await this.createBtn.isVisible().catch(() => false);
    if (createVisible) {
      await this.createBtn.click();
      await Promise.race([
        this.saveBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
        this.firstTextInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      ]);
    }
  }

  async goto(url) {
    await this.page.goto(url);
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async fillFirstTextField(value) {
    await this.firstTextInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.firstTextInput.fill(value);
  }

  async fillFirstNumberField(value) {
    const hasNumber = await this.firstNumberInput.isVisible().catch(() => false);
    if (hasNumber) {
      await this.firstNumberInput.fill(value);
    } else {
      // Fallback: dùng text input nếu không có input[type=number]
      await this.firstTextInput.fill(value);
    }
  }

  // Điền tất cả text input có thể tìm thấy với giá trị mặc định
  async fillAllVisibleTextFields(defaultValue = 'Test data') {
    const inputs = await this.allTextInputs.all();
    for (const input of inputs) {
      const visible = await input.isVisible().catch(() => false);
      const editable = await input.isEditable().catch(() => false);
      if (visible && editable) {
        await input.fill(defaultValue);
      }
    }
  }

  async save() {
    await this.saveBtn.click();
  }

  async cancel() {
    await this.cancelBtn.click();
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  // Kiểm tra Save button có bị disabled không (Polaris dùng aria-disabled)
  async isSaveBtnDisabled() {
    const ariaDisabled = await this.saveBtn.getAttribute('aria-disabled').catch(() => null);
    const disabled     = await this.saveBtn.getAttribute('disabled').catch(() => null);
    const classes      = await this.saveBtn.getAttribute('class').catch(() => '') || '';
    return ariaDisabled === 'true' || disabled !== null || classes.includes('disabled');
  }

  // Đếm số inline error đang hiển thị
  async getInlineErrorCount() {
    return await this.inlineErrors.count();
  }

  // Kiểm tra toast thành công có visible không
  async isSuccessToastVisible() {
    return this.successToast.isVisible().catch(() => false);
  }

  // Lấy giá trị hiện tại của text field đầu tiên (kiểm tra data còn sau network error)
  async getFirstTextFieldValue() {
    return await this.firstTextInput.inputValue().catch(() => '');
  }

  // Kiểm tra dialog unsaved changes có hiển thị không
  async isUnsavedDialogVisible() {
    return this.unsavedDialog.isVisible().catch(() => false);
  }

  // Kiểm tra có bất kỳ form input nào visible không
  async hasFormVisible() {
    const hasSave  = await this.saveBtn.isVisible().catch(() => false);
    const hasInput = await this.firstTextInput.isVisible().catch(() => false);
    return hasSave || hasInput;
  }
}

module.exports = { FormPage };
