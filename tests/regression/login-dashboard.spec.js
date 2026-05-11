const { test, expect }   = require('@playwright/test');
const { LoginPage }      = require('../pages/LoginPage');
const { DashboardPage }  = require('../pages/DashboardPage');
const { VALID, INVALID, EDGE } = require('../fixtures/loginData');
const { EXPECTED }       = require('../fixtures/dashboardData');

// ============================================================
// Login Tests — 12 tests (3 happy · 4 negative · 1 ui · 2 edge · 2 test.fail)
// ============================================================

test.describe('[Login] Regression', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForReady();
  });

  // Tests được thêm ở Task 3, 4, 5
});

// ============================================================
// Dashboard Tests — 4 tests (2 happy · 2 test.fail)
// ============================================================

test.describe('[Dashboard] Regression', () => {
  // Tests được thêm ở Task 6
});
