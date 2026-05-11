// Page Object cho trang Tìm kiếm & Filter — app.promer.ai
// Design System: custom (không phải Polaris chuẩn)
// Skill ref: qa-skill.md § Page Object pattern
//
// DOM thực tế của /ad-library (từ page snapshot):
//   - Search box: textbox "Search ads by product or style"
//   - Clear search: button "Clear search"
//   - Filters: sidebar có Ad theme / Aspect ratio / Industry / Seasonal
//   - "Clear all" + "Apply" buttons (disabled khi chưa chọn filter)
//   - Ad cards: img[src*="static-photo-studio.promer.ai"]
//   - Tabs: "Winning ads" (default) và "My library"

const { DashboardPage } = require('./DashboardPage');

class SearchPage {
  constructor(page) {
    this.page = page;

    // ── Search box ────────────────────────────────────────────────────────────
    // DOM thực: textbox placeholder "Search ads by product or style"
    this.searchInput = page.getByPlaceholder('Search ads by product or style')
      .or(page.getByRole('textbox', { name: /search/i }))
      .or(page.locator('input[type="search"]'))
      .or(page.locator('input[placeholder*="search" i]'))
      .first();

    // Nút "Clear search" — xuất hiện khi search box có nội dung
    this.searchClearBtn = page.getByRole('button', { name: 'Clear search' })
      .or(page.locator('[aria-label*="clear search" i]'))
      .first();

    // ── Danh sách kết quả (Ad cards) ─────────────────────────────────────────
    // Ad library hiển thị ads dưới dạng img từ static-photo-studio.promer.ai
    this.listItems = page.locator('img[src*="static-photo-studio.promer.ai"]')
      .or(page.locator('[class*="ResourceItem__ListItem"]'));

    // ── Empty state / No results ───────────────────────────────────────────────
    // Khi không có kết quả → heading "Browse ad ideas for your product" xuất hiện
    this.emptyState = page.getByRole('heading', { name: /browse ad ideas/i })
      .or(page.getByText(/no results|không tìm thấy/i))
      .first();

    // ── Filter sidebar ────────────────────────────────────────────────────────
    // /ad-library dùng sidebar filter với category buttons
    // Ad theme button (để expand/collapse theme list)
    this.adThemeFilterBtn = page.getByRole('button', { name: /ad theme/i }).first();

    // Filter options — click để chọn một filter
    this.boldClaimFilterBtn   = page.getByRole('button', { name: 'Bold Claim' }).first();
    this.beforeAfterFilterBtn = page.getByRole('button', { name: 'Before & After' }).first();
    this.headlineFilterBtn    = page.getByRole('button', { name: 'Headline' }).first();

    // Nút Apply — áp dụng filter đã chọn
    this.applyFilterBtn = page.getByRole('button', { name: /^apply$/i }).first();

    // Nút "Clear all" — chỉ enabled sau khi đã chọn và apply filter
    this.clearAllFiltersBtn = page.getByRole('button', { name: /^clear all$/i }).first();

    // ── Tabs ──────────────────────────────────────────────────────────────────
    this.winningAdsTab = page.getByRole('tab', { name: /winning ads/i }).first();
    this.myLibraryTab  = page.getByRole('tab', { name: /my library/i }).first();

    // ── Pagination ────────────────────────────────────────────────────────────
    this.pagination = page.locator('[class*="Pagination"]')
      .or(page.locator('nav[aria-label*="Pagination" i]'))
      .first();

    // Số lượng kết quả
    this.resultCountLabel = page.locator('text=/showing.*of.*result/i')
      .or(page.locator('[class*="result-count"]'))
      .first();

    // ── Error ─────────────────────────────────────────────────────────────────
    this.alertBanner = page.locator('[role="alert"]').first();
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async loginAndGoto(email, password, listUrl) {
    const dashboard = new DashboardPage(this.page);
    await dashboard.loginAndGoto(email, password);
    await this.page.goto(listUrl);
    // Chờ search box hoặc heading của page xuất hiện
    await Promise.race([
      this.searchInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      this.page.getByRole('heading', { name: /ad library/i }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    ]);
  }

  async goto(url) {
    await this.page.goto(url);
    await this.searchInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  // Nhập từ khóa — chờ debounce 600ms sau khi gõ xong
  async search(keyword) {
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(600);
  }

  // Xóa ô tìm kiếm
  async clearSearch() {
    const hasClearBtn = await this.searchClearBtn.isVisible().catch(() => false);
    if (hasClearBtn) {
      await this.searchClearBtn.click();
    } else {
      await this.searchInput.clear();
    }
    await this.page.waitForTimeout(600);
  }

  // Focus vào search box
  async focusSearch() {
    await this.searchInput.click();
  }

  // Gõ nhanh từng ký tự (dùng cho debounce test)
  async typeQuickly(chars) {
    for (const char of chars) {
      await this.searchInput.pressSequentially(char, { delay: 80 });
    }
  }

  // Chọn một filter và Apply — dùng cho AC-4.5 test
  async applyFilter(filterBtn) {
    await filterBtn.click();
    await this.page.waitForTimeout(200);
    const applyEnabled = await this.applyFilterBtn.isEnabled().catch(() => false);
    if (applyEnabled) {
      await this.applyFilterBtn.click();
      await this.page.waitForTimeout(800);
    }
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  async getSearchPlaceholder() {
    return await this.searchInput.getAttribute('placeholder') || '';
  }

  async getListItemCount() {
    return await this.listItems.count();
  }

  async isEmptyStateVisible() {
    return this.emptyState.isVisible().catch(() => false);
  }

  async hasServerError() {
    const bodyText = (await this.page.locator('body').textContent()) || '';
    return /sql error|syntax error|ORA-|mysql_fetch|pg_query|internal server error/i.test(bodyText);
  }

  async getUrlParams() {
    return new URL(this.page.url()).searchParams;
  }

  async hasPagination() {
    return this.pagination.isVisible().catch(() => false);
  }

  async isSearchReady() {
    const visible = await this.searchInput.isVisible().catch(() => false);
    const enabled = await this.searchInput.isEnabled().catch(() => false);
    return visible && enabled;
  }

  async isClearAllEnabled() {
    return this.clearAllFiltersBtn.isEnabled().catch(() => false);
  }
}

module.exports = { SearchPage };
