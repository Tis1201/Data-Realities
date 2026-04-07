# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: compare-dashboard-device.test.js >> Compare Dashboard vs Device Listing metrics >> should compare dashboard metrics with device listing metrics
- Location: tests\compare-dashboard-device.test.js:15:3

# Error details

```
Error: Could not capture listing __data.json response
```

# Test source

```ts
  1   | const { expect } = require('@playwright/test');
  2   | 
  3   | class DeviceListingPage {
  4   |   constructor(page) {
  5   |     this.page = page;
  6   |     this.url = 'https://app-dev-v2.datarealities.com/user/devices/listing?tab=remote-devices&per_page=10000&page=1';
  7   |     this.table = this.page.locator('table');
  8   |     this.bodyRows = this.page.locator('tbody tr');
  9   |   }
  10  | 
  11  |   async goto() {
  12  |     await this.page.goto(this.url, { waitUntil: 'networkidle' });
  13  |     await expect(this.page).toHaveURL(/\/user\/devices\/listing/);
  14  |     await this.page.waitForTimeout(2000);
  15  |     await expect(this.table).toBeVisible();
  16  |   }
  17  | 
  18  |   parseAsDate(value) {
  19  |     if (!value) return null;
  20  |     const d = new Date(value);
  21  |     return Number.isNaN(d.getTime()) ? null : d;
  22  |   }
  23  | 
  24  |   getDiffHours(date) {
  25  |     if (!date) return null;
  26  |     return (Date.now() - date.getTime()) / (1000 * 60 * 60);
  27  |   }
  28  | 
  29  |   getDiffDays(date) {
  30  |     if (!date) return null;
  31  |     return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  32  |   }
  33  | 
  34  |   async getListingDataResponse() {
  35  |     const captured = [];
  36  | 
  37  |     const onResponse = async (response) => {
  38  |       const url = response.url();
  39  |       if (
  40  |         url.includes('/user/devices/listing') &&
  41  |         url.includes('__data.json')
  42  |       ) {
  43  |         try {
  44  |           const json = await response.json();
  45  |           captured.push({ url, json });
  46  |         } catch (e) {
  47  |           // ignore
  48  |         }
  49  |       }
  50  |     };
  51  | 
  52  |     this.page.on('response', onResponse);
  53  | 
  54  |     await this.goto();
  55  |     await this.page.waitForTimeout(2500);
  56  | 
  57  |     this.page.off('response', onResponse);
  58  | 
  59  |     if (captured.length === 0) {
> 60  |       throw new Error('Could not capture listing __data.json response');
      |             ^ Error: Could not capture listing __data.json response
  61  |     }
  62  | 
  63  |     return captured[captured.length - 1].json;
  64  |   }
  65  | 
  66  |   extractServerData(payload) {
  67  |     const nodes = payload?.nodes || [];
  68  |     for (const node of nodes) {
  69  |       if (!node || typeof node !== 'object') continue;
  70  |       if (
  71  |         node.data &&
  72  |         typeof node.data === 'object' &&
  73  |         (
  74  |           node.data.devices ||
  75  |           node.data.deviceInformation ||
  76  |           node.data.deviceInformationByDeviceId
  77  |         )
  78  |       ) {
  79  |         return node.data;
  80  |       }
  81  |     }
  82  | 
  83  |     throw new Error('Could not find devices data inside __data.json payload');
  84  |   }
  85  | 
  86  |   transformServerData(serverData) {
  87  |     const devices = serverData?.devices || [];
  88  |     const deviceInformation = serverData?.deviceInformation || {};
  89  |     const deviceInformationByDeviceId = serverData?.deviceInformationByDeviceId || {};
  90  | 
  91  |     return devices.map((device) => {
  92  |       const mac = device.macAddress || device.lanMac || device.wifiMac;
  93  |       const deviceInfo =
  94  |         deviceInformation[mac] ||
  95  |         deviceInformationByDeviceId[device.id] ||
  96  |         {};
  97  | 
  98  |       const connected = device.connected ?? false;
  99  |       const disconnected = !connected;
  100 | 
  101 |       const connectedAt = this.parseAsDate(device.connectedAt);
  102 |       const disconnectedAt = this.parseAsDate(device.disconnectedAt);
  103 |       const lastUsedAt = this.parseAsDate(device.lastUsedAt || device.lastSeenAt);
  104 |       const lastConnectedAt = this.parseAsDate(deviceInfo.last_connected_at || deviceInfo.last_status_at);
  105 | 
  106 |       const lastSeenAt = lastUsedAt || lastConnectedAt;
  107 | 
  108 |       const cpuUsage = Number(deviceInfo.cpu_usage ?? deviceInfo.cpuUsage ?? 0);
  109 |       const memUsage = Number(deviceInfo.ram_usage ?? deviceInfo.memUsage ?? 0);
  110 |       const diskUsage = Number(deviceInfo.disk_usage ?? deviceInfo.diskUsage ?? 0);
  111 |       const signalStrength = deviceInfo.signal_strength_dbm ?? null;
  112 | 
  113 |       return {
  114 |         id: device.id,
  115 |         name: device.name,
  116 |         connected,
  117 |         disconnected,
  118 |         connectedAt,
  119 |         disconnectedAt,
  120 |         lastSeenAt,
  121 |         cpuUsage,
  122 |         memUsage,
  123 |         diskUsage,
  124 |         signalStrength
  125 |       };
  126 |     });
  127 |   }
  128 | 
  129 |   calculateMetricsFromDevices(devices) {
  130 |     const CRITICAL_CPU_THRESHOLD = 80;
  131 |     const CRITICAL_MEMORY_THRESHOLD = 80;
  132 |     const CRITICAL_STORAGE_THRESHOLD = 80;
  133 |     const WEAK_NETWORK_SIGNAL_DBM = -75;
  134 |     const OFFLINE_70_PCT_DAYS = 21;
  135 | 
  136 |     let healthy = 0;
  137 |     let offline = 0;
  138 |     let warnings = 0;
  139 |     const criticalDeviceIds = new Set();
  140 | 
  141 |     const criticalRows = [];
  142 |     const warningRows = [];
  143 | 
  144 |     for (const device of devices) {
  145 |       if (device.connected) healthy++;
  146 |       else offline++;
  147 | 
  148 |       const cpuCritical = device.cpuUsage >= CRITICAL_CPU_THRESHOLD;
  149 |       const memCritical = device.memUsage >= CRITICAL_MEMORY_THRESHOLD;
  150 |       const diskCritical = device.diskUsage >= CRITICAL_STORAGE_THRESHOLD;
  151 |       const networkCritical =
  152 |         device.signalStrength !== null &&
  153 |         device.signalStrength < WEAK_NETWORK_SIGNAL_DBM;
  154 | 
  155 |       const offlineTooLong =
  156 |         device.disconnected &&
  157 |         device.disconnectedAt &&
  158 |         this.getDiffDays(device.disconnectedAt) > OFFLINE_70_PCT_DAYS;
  159 | 
  160 |       if (cpuCritical || memCritical || diskCritical || networkCritical || offlineTooLong) {
```