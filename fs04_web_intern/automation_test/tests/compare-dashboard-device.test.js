const { expect } = require('@playwright/test');
const { test } = require('../utils/persistent-browser');
const { DashboardPage } = require('../pages/dashboard-page');
const { DeviceListingPage } = require('../pages/device-listing-page');

test.describe('Compare Dashboard vs Device Listing metrics', () => {
  let dashboardPage;
  let deviceListingPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    deviceListingPage = new DeviceListingPage(page);
  });

  test('should compare dashboard metrics with device listing metrics', async ({ page }, testInfo) => {
    const mismatches = [];

    await test.step('Open Dashboard and get dashboard metrics', async () => {
      await dashboardPage.goto();

      await page.screenshot({
        path: testInfo.outputPath('dashboard-page.png'),
        fullPage: true
      });
    });

    const dashboardMetrics = await dashboardPage.getDashboardMetrics();

    await test.step('Open Device Listing and compute metrics from listing', async () => {
      await deviceListingPage.goto();

      await page.screenshot({
        path: testInfo.outputPath('device-listing-page.png'),
        fullPage: true
      });
    });

    const listingResult = await deviceListingPage.getListingMetrics();
    const listingMetrics = listingResult.metrics;


    await testInfo.attach('critical-rows.json', {
  body: Buffer.from(JSON.stringify(listingResult.criticalRows, null, 2)),
  contentType: 'application/json'
});

await testInfo.attach('warning-rows.json', {
  body: Buffer.from(JSON.stringify(listingResult.warningRows, null, 2)),
  contentType: 'application/json'
});

await testInfo.attach('all-device-rows.json', {
  body: Buffer.from(JSON.stringify(listingResult, null, 2)),
  contentType: 'application/json'
});
    console.log('====================================================');
    console.log('[COMPARE] Dashboard metrics:', JSON.stringify(dashboardMetrics, null, 2));
    console.log('[COMPARE] Listing metrics:', JSON.stringify(listingMetrics, null, 2));
    console.log('====================================================');

    const fields = [
      { key: 'criticalIssues', label: 'Critical Issues' },
      { key: 'warnings', label: 'Warnings' },
      { key: 'healthy', label: 'Healthy' },
      { key: 'offline', label: 'Offline' },
      { key: 'totalDevices', label: 'Total Devices' }
    ];

    for (const field of fields) {
      const dashboardValue = dashboardMetrics[field.key];
      const listingValue = listingMetrics[field.key];

      if (dashboardValue !== listingValue) {
        mismatches.push({
          field: field.label,
          dashboardValue,
          listingValue
        });

        console.error(
          `[MISMATCH] ${field.label} | Dashboard=${dashboardValue} | Devices=${listingValue}`
        );
      } else {
        console.log(
          `[MATCH] ${field.label} | Dashboard=${dashboardValue} | Devices=${listingValue}`
        );
      }
    }

    await testInfo.attach('dashboard-metrics.json', {
      body: Buffer.from(JSON.stringify(dashboardMetrics, null, 2)),
      contentType: 'application/json'
    });

    await testInfo.attach('listing-metrics.json', {
      body: Buffer.from(JSON.stringify(listingMetrics, null, 2)),
      contentType: 'application/json'
    });

    await testInfo.attach('mismatches.json', {
      body: Buffer.from(JSON.stringify(mismatches, null, 2)),
      contentType: 'application/json'
    });

    if (mismatches.length > 0) {
      await page.screenshot({
        path: testInfo.outputPath('compare-mismatch.png'),
        fullPage: true
      });

      throw new Error(
        '[Dashboard vs Devices] Mismatches found:\n' +
        mismatches
          .map(
            (m) =>
              `- ${m.field}: Dashboard=${m.dashboardValue}, Devices=${m.listingValue}`
          )
          .join('\n')
      );
    }

    expect(mismatches.length).toBe(0);
  });
});