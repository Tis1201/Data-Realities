const { expect } = require('@playwright/test');

class DeviceListingPage {
  constructor(page) {
    this.page = page;
    this.url = 'https://app-dev-v2.datarealities.com/user/devices/listing?tab=remote-devices&per_page=10000&page=1';
    this.table = this.page.locator('table');
    this.bodyRows = this.page.locator('tbody tr');
  }

  async goto() {
    await this.page.goto(this.url, { waitUntil: 'networkidle' });
    await expect(this.page).toHaveURL(/\/user\/devices\/listing/);
    await this.page.waitForTimeout(2000);
    await expect(this.table).toBeVisible();
  }

  parseAsDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  getDiffHours(date) {
    if (!date) return null;
    return (Date.now() - date.getTime()) / (1000 * 60 * 60);
  }

  getDiffDays(date) {
    if (!date) return null;
    return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  }

  async getListingDataResponse() {
    const captured = [];

    const onResponse = async (response) => {
      const url = response.url();
      if (
        url.includes('/user/devices/listing') &&
        url.includes('__data.json')
      ) {
        try {
          const json = await response.json();
          captured.push({ url, json });
        } catch (e) {
          // ignore
        }
      }
    };

    this.page.on('response', onResponse);

    await this.goto();
    await this.page.waitForTimeout(2500);

    this.page.off('response', onResponse);

    if (captured.length === 0) {
      throw new Error('Could not capture listing __data.json response');
    }

    return captured[captured.length - 1].json;
  }

  extractServerData(payload) {
    const nodes = payload?.nodes || [];
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      if (
        node.data &&
        typeof node.data === 'object' &&
        (
          node.data.devices ||
          node.data.deviceInformation ||
          node.data.deviceInformationByDeviceId
        )
      ) {
        return node.data;
      }
    }

    throw new Error('Could not find devices data inside __data.json payload');
  }

  transformServerData(serverData) {
    const devices = serverData?.devices || [];
    const deviceInformation = serverData?.deviceInformation || {};
    const deviceInformationByDeviceId = serverData?.deviceInformationByDeviceId || {};

    return devices.map((device) => {
      const mac = device.macAddress || device.lanMac || device.wifiMac;
      const deviceInfo =
        deviceInformation[mac] ||
        deviceInformationByDeviceId[device.id] ||
        {};

      const connected = device.connected ?? false;
      const disconnected = !connected;

      const connectedAt = this.parseAsDate(device.connectedAt);
      const disconnectedAt = this.parseAsDate(device.disconnectedAt);
      const lastUsedAt = this.parseAsDate(device.lastUsedAt || device.lastSeenAt);
      const lastConnectedAt = this.parseAsDate(deviceInfo.last_connected_at || deviceInfo.last_status_at);

      const lastSeenAt = lastUsedAt || lastConnectedAt;

      const cpuUsage = Number(deviceInfo.cpu_usage ?? deviceInfo.cpuUsage ?? 0);
      const memUsage = Number(deviceInfo.ram_usage ?? deviceInfo.memUsage ?? 0);
      const diskUsage = Number(deviceInfo.disk_usage ?? deviceInfo.diskUsage ?? 0);
      const signalStrength = deviceInfo.signal_strength_dbm ?? null;

      return {
        id: device.id,
        name: device.name,
        connected,
        disconnected,
        connectedAt,
        disconnectedAt,
        lastSeenAt,
        cpuUsage,
        memUsage,
        diskUsage,
        signalStrength
      };
    });
  }

  calculateMetricsFromDevices(devices) {
    const CRITICAL_CPU_THRESHOLD = 80;
    const CRITICAL_MEMORY_THRESHOLD = 80;
    const CRITICAL_STORAGE_THRESHOLD = 80;
    const WEAK_NETWORK_SIGNAL_DBM = -75;
    const OFFLINE_70_PCT_DAYS = 21;

    let healthy = 0;
    let offline = 0;
    let warnings = 0;
    const criticalDeviceIds = new Set();

    const criticalRows = [];
    const warningRows = [];

    for (const device of devices) {
      if (device.connected) healthy++;
      else offline++;

      const cpuCritical = device.cpuUsage >= CRITICAL_CPU_THRESHOLD;
      const memCritical = device.memUsage >= CRITICAL_MEMORY_THRESHOLD;
      const diskCritical = device.diskUsage >= CRITICAL_STORAGE_THRESHOLD;
      const networkCritical =
        device.signalStrength !== null &&
        device.signalStrength < WEAK_NETWORK_SIGNAL_DBM;

      const offlineTooLong =
        device.disconnected &&
        device.disconnectedAt &&
        this.getDiffDays(device.disconnectedAt) > OFFLINE_70_PCT_DAYS;

      if (cpuCritical || memCritical || diskCritical || networkCritical || offlineTooLong) {
        criticalDeviceIds.add(device.id);
        criticalRows.push({
          id: device.id,
          name: device.name,
          cpuUsage: device.cpuUsage,
          memUsage: device.memUsage,
          diskUsage: device.diskUsage,
          signalStrength: device.signalStrength,
          disconnectedAt: device.disconnectedAt ? device.disconnectedAt.toISOString() : null
        });
      }

      const staleConnected =
        device.connected &&
        (
          !device.connectedAt ||
          this.getDiffHours(device.connectedAt) > 24
        );

      if (staleConnected) {
        warnings++;
        warningRows.push({
          id: device.id,
          name: device.name,
          connectedAt: device.connectedAt ? device.connectedAt.toISOString() : null
        });
      }
    }

    const metrics = {
      criticalIssues: criticalDeviceIds.size,
      warnings,
      healthy,
      offline,
      totalDevices: devices.length
    };

    console.log('[Devices Listing] Computed metrics:', JSON.stringify(metrics, null, 2));
    console.log('[Devices Listing] Critical sample:', JSON.stringify(criticalRows.slice(0, 5), null, 2));
    console.log('[Devices Listing] Warning sample:', JSON.stringify(warningRows.slice(0, 5), null, 2));

    return {
      metrics,
      criticalRows,
      warningRows
    };
  }

  async getListingMetrics() {
    const payload = await this.getListingDataResponse();
    const serverData = this.extractServerData(payload);
    const devices = this.transformServerData(serverData);
    return this.calculateMetricsFromDevices(devices);
  }
}

module.exports = { DeviceListingPage };