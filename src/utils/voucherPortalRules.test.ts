import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TILL_GATEWAY_TAG,
  PRESET_CAPTIVE_VOUCHERS,
  calculateDurationMinutes,
  formatDurationLabel,
  formatRemainingCountdown,
  isVoucherSessionExpired,
  issuePartnerReceiptVoucher,
  redeemCaptiveVoucher,
} from './voucherPortalRules.ts';
import { INITIAL_PARTNER_DEVICES } from '../data/seedData.ts';

test('rejects missing terms, invalid MAC, or invalid voucher code', () => {
  const res = redeemCaptiveVoucher({
    voucherCode: '123',
    subscriberName: 'Guest',
    clientMac: 'invalid-mac',
    clientIp: '192.168.1.156',
    gatewayDevice: INITIAL_PARTNER_DEVICES[0],
    acceptedTerms: false,
  });

  assert.equal(res.ok, false);
  assert.ok(res.errors.voucherCode);
  assert.ok(res.errors.clientMac);
  assert.ok(res.errors.acceptedTerms);
});

test('redeems valid pfSense+ captive voucher and creates active session + live user', () => {
  const fixedNow = Date.UTC(2026, 10, 19, 10, 0, 0);
  const res = redeemCaptiveVoucher({
    voucherCode: PRESET_CAPTIVE_VOUCHERS[0].code,
    subscriberName: 'Kagiso Guest',
    accountNumber: 'VXK-8421',
    clientMac: 'aa-bb-cc-dd-ee-01',
    clientIp: '192.168.1.156',
    gatewayDevice: INITIAL_PARTNER_DEVICES[0],
    acceptedTerms: true,
    nowMs: fixedNow,
  });

  assert.equal(res.ok, true);
  assert.equal(res.session?.voucherCode, 'VXK771299014421');
  assert.equal(res.session?.gatewayIp, '192.168.1.1');
  assert.equal(res.session?.clientMac, 'AA:BB:CC:DD:EE:01');
  assert.equal(res.liveUserEntry?.status, 'Online');
  assert.equal(res.liveUserEntry?.voucherCode, 'VXK771299014421');
  assert.equal(res.captiveDeviceEntry?.quotaRemainingMb, 5000);
});

test('formats remaining captive portal countdown accurately', () => {
  const start = 1_000_000;
  const expires = start + 3665_000; // 1h 1m 5s
  assert.equal(formatRemainingCountdown(expires, start), '01:01:05');
  assert.equal(formatRemainingCountdown(expires, expires + 5000), '00:00:00');
});

test('includes all 5 unlimited bundle presets matching the VXK captive portal tariff card', () => {
  assert.equal(PRESET_CAPTIVE_VOUCHERS.length, 5);
  const prices = PRESET_CAPTIVE_VOUCHERS.map((v) => v.priceZar);
  assert.deepEqual(prices, ['R10.00', 'R5.00', 'R30.00', 'R60.00', 'R350.00']);

  const familyVoucher = PRESET_CAPTIVE_VOUCHERS[4];
  const res = redeemCaptiveVoucher({
    voucherCode: familyVoucher.code,
    subscriberName: 'Family Home',
    clientMac: 'd4:5d:64:1b:9a:80',
    clientIp: '192.168.1.156',
    gatewayDevice: INITIAL_PARTNER_DEVICES[0],
    acceptedTerms: true,
    nowMs: 1_000_000,
  });

  assert.equal(res.ok, true);
  assert.equal(res.session?.tierLabel, 'Family Wi-Fi 30 days (Multi-device)');
  assert.equal(res.session?.expiresAtMs, 1_000_000 + 43200 * 60_000);
});

test('calculates custom durations and issues vxk-GiyaniShop770 tiller receipt voucher', () => {
  assert.equal(calculateDurationMinutes(45, 'minutes'), 45);
  assert.equal(calculateDurationMinutes(3, 'hours'), 180);
  assert.equal(calculateDurationMinutes(2, 'days'), 2880);
  assert.equal(calculateDurationMinutes(0, 'hours'), 0);
  assert.equal(formatDurationLabel(45), '45 Minutes');
  assert.equal(formatDurationLabel(180), '3 Hours');
  assert.equal(formatDurationLabel(2880), '2 Days');

  const fixedNow = Date.UTC(2026, 10, 19, 12, 30, 0);
  const issued = issuePartnerReceiptVoucher({
    buyerName: 'Ntsako Baloyi',
    buyerPhone: '0790001122',
    purchaseItem: 'In-Store Till Purchase',
    priceZar: 'R85.00',
    durationAmount: 45,
    durationUnit: 'minutes',
    nowMs: fixedNow,
    customSeed: '9A2B',
  });

  assert.equal(issued.ok, true);
  assert.ok(issued.voucher);
  assert.equal(issued.voucher?.gatewayTag, DEFAULT_TILL_GATEWAY_TAG);
  assert.equal(issued.voucher?.durationMinutes, 45);
  assert.equal(issued.voucher?.periodLabel, '45 Minutes');
  assert.ok(issued.voucher?.displayCode.startsWith('VXK-770-'));
  assert.ok(issued.voucher?.receiptText.includes('vxk-GiyaniShop770'));
  assert.ok(issued.voucher?.receiptText.includes('45 Minutes'));
  assert.ok(issued.voucher?.portalLoginUrl.includes('gateway=vxk-GiyaniShop770'));
});

test('redeems issued till voucher for exact purchased period and expires when time is up', () => {
  const issuedAt = Date.UTC(2026, 10, 19, 12, 30, 0);
  const issued = issuePartnerReceiptVoucher({
    buyerName: 'Giyani Shopper',
    purchaseItem: 'Till Purchase Bonus',
    durationAmount: 45,
    durationUnit: 'minutes',
    nowMs: issuedAt,
    customSeed: '44CC',
  });
  assert.ok(issued.voucher);

  const giyaniGateway =
    INITIAL_PARTNER_DEVICES.find((d) => d.gatewayTag === 'vxk-GiyaniShop770') ||
    INITIAL_PARTNER_DEVICES[0];

  const redeemAt = issuedAt + 60_000;
  const redeemed = redeemCaptiveVoucher({
    voucherCode: issued.voucher!.displayCode,
    subscriberName: 'Giyani Shopper',
    clientMac: 'aa:bb:cc:11:22:33',
    clientIp: '192.168.1.180',
    gatewayDevice: giyaniGateway,
    acceptedTerms: true,
    nowMs: redeemAt,
    issuedVouchers: [issued.voucher!],
  });

  assert.equal(redeemed.ok, true);
  assert.equal(redeemed.session?.gatewayTag, 'vxk-GiyaniShop770');
  assert.equal(redeemed.session?.durationMinutes, 45);
  assert.equal(redeemed.session?.expiresAtMs, redeemAt + 45 * 60_000);
  assert.equal(isVoucherSessionExpired(redeemed.session, redeemAt + 44 * 60_000), false);
  assert.equal(isVoucherSessionExpired(redeemed.session, redeemAt + 45 * 60_000), true);
});
