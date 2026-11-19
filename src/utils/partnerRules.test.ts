import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPTIVE_DEVICE_BRANDS,
  validateMacAddress,
  validateIPv4,
  simulateRouterScan,
  validatePartnerDeviceRegistration,
  authorizePartnerDeviceWithPfSense,
  computePartnerDashboardStats,
} from './partnerRules.ts';
import { PartnerDevice } from '../types/index.ts';

test('includes pfSense+ and all major commercial captive portal router brands', () => {
  assert.ok(CAPTIVE_DEVICE_BRANDS.length >= 10);
  const ids = CAPTIVE_DEVICE_BRANDS.map((b) => b.id);
  assert.ok(ids.includes('pfsense-plus'));
  assert.ok(ids.includes('mikrotik'));
  assert.ok(ids.includes('unifi'));
  assert.ok(ids.includes('tplink-omada'));
  assert.ok(ids.includes('cisco-meraki'));
  assert.ok(ids.includes('openwrt'));
});

test('validates and normalizes MAC and IPv4 addresses', () => {
  const goodMac = validateMacAddress('d4-5d-64-1b-9a-80');
  assert.equal(goodMac.isValid, true);
  assert.equal(goodMac.normalized, 'D4:5D:64:1B:9A:80');

  const badMac = validateMacAddress('12345');
  assert.equal(badMac.isValid, false);

  assert.equal(validateIPv4('192.168.88.1').isValid, true);
  assert.equal(validateIPv4('999.168.1.1').isValid, false);
});

test('scans connected router device details and points endpoint to pfSense+ master', () => {
  const scan = simulateRouterScan('unifi', 'aa:bb:cc:11:22:33');
  assert.equal(scan.brandId, 'unifi');
  assert.equal(scan.gatewayIp, '192.168.10.1');
  assert.equal(scan.macAddress, 'AA:BB:CC:11:22:33');
  assert.ok(scan.pfsenseEndpoint.includes('pfsense-master.vxktech.co.za'));
  assert.equal(scan.pfsenseReachable, true);
});

test('enforces direct-router scan and confirmation before adding partner device', () => {
  const missingConfirmation = validatePartnerDeviceRegistration({
    partnerBusinessName: 'Soweto Hub Cafe',
    location: 'Soweto',
    deviceName: 'Cafe Main Router',
    brandId: 'mikrotik',
    macAddress: 'D4:5D:64:1B:9A:80',
    gatewayIp: '192.168.88.1',
    isDirectConnection: true,
    scanCompleted: true,
    scanConfirmed: false,
  });
  assert.equal(missingConfirmation.isValid, false);
  assert.ok(missingConfirmation.errors.scanConfirmed);

  const validDirect = validatePartnerDeviceRegistration({
    partnerBusinessName: 'Soweto Hub Cafe',
    location: 'Soweto',
    deviceName: 'Cafe Main Router',
    brandId: 'mikrotik',
    macAddress: 'D4:5D:64:1B:9A:80',
    gatewayIp: '192.168.88.1',
    isDirectConnection: true,
    scanCompleted: true,
    scanConfirmed: true,
  });
  assert.equal(validDirect.isValid, true);
});

test('authorizes partner device internet access via pfSense+ voucher approval', () => {
  const pending: PartnerDevice = {
    id: 'pd-test',
    partnerBusinessName: 'Test Partner',
    location: 'Midrand',
    deviceName: 'Lobby AP',
    brandId: 'tplink-omada',
    brandName: 'TP-Link Omada',
    model: 'EAP650 Wi-Fi 6',
    macAddress: '00:11:22:33:44:55',
    gatewayIp: '192.168.0.1',
    localIp: '192.168.0.156',
    syncProtocol: 'Omada External Web Portal + RADIUS -> pfSense+',
    pfsenseAuthStatus: 'Pending Auth',
    voucherAuthority: 'pfSense+ Master',
    activeSessions: 4,
    lastSyncedAt: '2026-11-18 10:00',
    connectionType: 'Direct Scan',
  };

  const invalidVoucher = authorizePartnerDeviceWithPfSense(pending, '12');
  assert.equal(invalidVoucher.ok, false);

  const authorized = authorizePartnerDeviceWithPfSense(pending, 'VXK-8821-4400');
  assert.equal(authorized.ok, true);
  assert.equal(authorized.updatedDevice?.pfsenseAuthStatus, 'Authorized');
  assert.equal(authorized.updatedDevice?.approvedVoucherCode, 'VXK88214400');
});

test('computes partner dashboard summary stats dynamically', () => {
  const sample: PartnerDevice[] = [
    {
      id: '1',
      partnerBusinessName: 'A',
      location: 'PTA',
      deviceName: 'R1',
      brandId: 'mikrotik',
      brandName: 'MikroTik',
      model: 'hAP ax3',
      macAddress: 'AA:BB:CC:DD:EE:01',
      gatewayIp: '192.168.88.1',
      localIp: '192.168.88.10',
      syncProtocol: 'RADIUS -> pfSense+',
      pfsenseAuthStatus: 'Authorized',
      voucherAuthority: 'pfSense+ Master',
      activeSessions: 12,
      lastSyncedAt: '2026-11-18 10:00',
      connectionType: 'Direct Scan',
    },
    {
      id: '2',
      partnerBusinessName: 'B',
      location: 'JHB',
      deviceName: 'R2',
      brandId: 'unifi',
      brandName: 'UniFi',
      model: 'U6-Pro',
      macAddress: 'AA:BB:CC:DD:EE:02',
      gatewayIp: '192.168.10.1',
      localIp: '192.168.10.10',
      syncProtocol: 'External Portal -> pfSense+',
      pfsenseAuthStatus: 'Pending Auth',
      voucherAuthority: 'pfSense+ Master',
      activeSessions: 5,
      lastSyncedAt: '2026-11-18 10:05',
      connectionType: 'Remote Manual',
    },
  ];
  const stats = computePartnerDashboardStats(sample);
  assert.equal(stats.totalDevices, 2);
  assert.equal(stats.authorizedCount, 1);
  assert.equal(stats.pendingCount, 1);
  assert.equal(stats.uniqueBrandsCount, 2);
  assert.equal(stats.totalActiveSessions, 17);
});
