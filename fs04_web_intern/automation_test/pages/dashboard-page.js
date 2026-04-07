const { expect } = require('@playwright/test');

class DashboardPage {
  constructor(page) {
    this.page = page;
    this.url = 'https://app-dev-v2.datarealities.com/user/dashboard';

    this.metricCardByTitle = (title) =>
      this.page.locator('.metric-card', {
        has: this.page.locator('.metric-title', { hasText: title })
      }).first();

    this.totalDevicesCard = this.page.locator('.stats-card', {
      has: this.page.locator('.stats-title', { hasText: 'Total Devices' })
    }).first();
  }

  async goto() {
    await this.page.goto(this.url, { waitUntil: 'networkidle' });
    await expect(this.page).toHaveURL(/\/user\/dashboard/);
    await this.page.waitForTimeout(1500);
  }

  async getMetricCardValue(title) {
    const card = this.metricCardByTitle(title);
    await expect(card).toBeVisible();
    const raw = await card.locator('.metric-value').innerText();
    return this.parseNumber(raw);
  }

  async getTotalDevicesValue() {
    await expect(this.totalDevicesCard).toBeVisible();
    const raw = await this.totalDevicesCard.locator('.stats-value').innerText();
    return this.parseNumber(raw);
  }

  parseNumber(value) {
    return Number(String(value).replace(/[^\d]/g, '')) || 0;
  }

  async getDashboardMetrics() {
    const metrics = {
      criticalIssues: await this.getMetricCardValue('Critical Issues'),
      warnings: await this.getMetricCardValue('Warnings'),
      healthy: await this.getMetricCardValue('Healthy'),
      offline: await this.getMetricCardValue('Offline'),
      totalDevices: await this.getTotalDevicesValue()
    };

    console.log('[Dashboard] Metrics:', JSON.stringify(metrics, null, 2));
    return metrics;
  }
}

module.exports = { DashboardPage };