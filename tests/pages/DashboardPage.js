// Page Object cho trang Dashboard — app.promer.ai (sau khi đăng nhập)
// Skill ref: qa-skill.md § Page Object pattern
// Ghi chú: App dùng <div> generic thay vì <nav> cho sidebar.
//   Indicator "ready" là link "Home" và button "User menu" trong sidebar.

const { LoginPage } = require('./LoginPage');

class DashboardPage {
  constructor(page) {
    this.page = page;

    // ── Navigation sidebar (dựa trên page snapshot thực tế) ────────────────
    // Sidebar dùng generic <div>, không có <nav>
    // Dùng link "Home" làm indicator trang đã load xong
    this.homeLink   = page.getByRole('link', { name: 'Home' });

    // Tất cả nav links đã biết trong sidebar
    this.navLinks   = page.getByRole('link', {
      name: /^(Home|Static ads|Video ads|Ad library|Ad spy|My ads|Products|Brand kit)$/i,
    });

    // ── TopBar / User Menu ──────────────────────────────────────────────────
    // Button "User menu" ở góc trên sidebar — chứa avatar hoặc initials của user
    this.userMenuBtn = page.getByRole('button', { name: 'User menu' });

    // ── Main content area ───────────────────────────────────────────────────
    // Outer: main[e4] (toàn bộ app shell)
    // Inner: main[e118] (phần nội dung chính, không gồm sidebar)
    this.appShell    = page.locator('main').first();
    this.contentArea = page.locator('main').nth(1);

    // ── Stat widgets / headings ─────────────────────────────────────────────
    // Dashboard hiện số liệu dạng heading (ví dụ: "1M+")
    this.statCards    = page.locator('[class*="Card"], [class*="card"]');
    this.statHeadings = page.locator('h1, h2, h3').filter({ hasText: /\d/ });

    // ── Logout ──────────────────────────────────────────────────────────────
    // Logout xuất hiện sau khi click "User menu" button
    this.logoutOption = page
      .getByRole('button', { name: /log.?out|sign.?out/i })
      .or(page.getByRole('menuitem', { name: /log.?out|sign.?out/i }))
      .or(page.getByRole('link',   { name: /log.?out|sign.?out/i }));

    // ── Error / Alert ────────────────────────────────────────────────────────
    this.alertBanner = page.locator('[role="alert"]').first();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  // Đăng nhập và chờ Dashboard load xong (link "Home" hiển thị)
  async loginAndGoto(email, password) {
    const loginPage = new LoginPage(this.page);
    await loginPage.goto();
    await loginPage.waitForReady();
    await loginPage.login(email, password);

    // Chờ URL rời khỏi /sign-in
    await this.page.waitForURL(
      url => !url.toString().includes('/sign-in'),
      { timeout: 15000 }
    );

    // Chờ link "Home" xuất hiện trong sidebar — xác nhận Dashboard đã render
    await this.homeLink.waitFor({ state: 'visible', timeout: 10000 });
  }

  // Điều hướng về trang chủ Dashboard (khi đã có session)
  async goto() {
    await this.page.goto('/');
    await this.homeLink.waitFor({ state: 'visible', timeout: 10000 });
  }

  // ── Truy vấn / Query ───────────────────────────────────────────────────────

  // Lấy text của toàn bộ body (để tìm email/tên user)
  async getBodyText() {
    return (await this.page.locator('body').textContent() || '').trim();
  }

  // Kiểm tra "User menu" button có visible không
  async isUserMenuVisible() {
    return this.userMenuBtn.isVisible().catch(() => false);
  }

  // Đếm số nav links trong sidebar
  async getNavLinkCount() {
    return await this.navLinks.count();
  }

  // Lấy text của nav link đầu tiên (không phải "Home")
  async getFirstNonHomeNavLinkText() {
    const links = this.navLinks;
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const text = (await links.nth(i).textContent() || '').trim();
      if (text.toLowerCase() !== 'home') return { text, index: i };
    }
    return null;
  }

  // Đếm số stat heading (h1/h2/h3 có chứa số)
  async getStatHeadingCount() {
    return await this.statHeadings.count();
  }

  // ── Thao tác / Actions ─────────────────────────────────────────────────────

  // Click vào nav link đầu tiên KHÔNG phải Home
  async clickFirstNavLink() {
    const info = await this.getFirstNonHomeNavLinkText();
    if (!info) {
      // fallback: click link thứ 2 (sau Home)
      await this.navLinks.nth(1).click();
      return 'unknown';
    }
    await this.navLinks.nth(info.index).click();
    return info.text;
  }

  // Logout: click User menu → chờ dropdown → click logout option
  async logout() {
    // Mở user menu
    await this.userMenuBtn.click();

    // Chờ logout option xuất hiện (tối đa 5s)
    await this.logoutOption.first().waitFor({ state: 'visible', timeout: 5000 });
    await this.logoutOption.first().click();
  }
}

module.exports = { DashboardPage };
