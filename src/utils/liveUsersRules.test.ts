import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLiveDuration,
  formatSASTClock,
  computeLiveSessionUsageMb,
  maskEmailForPublic,
  filterLiveConnectedUsers,
  computeLiveUsersSummary,
  connectProfileAsLiveUser,
  toggleLiveUserStatus,
} from './liveUsersRules.ts';
import { INITIAL_USER, INITIAL_PARTNER_DEVICES } from '../data/seedData.ts';
import { LiveConnectedUser } from '../types/index.ts';

const SAMPLE_LIVE_USER: LiveConnectedUser = {
  id: 'live-1',
  profileName: 'Sipho Khumalo',
  username: 'sipho.khumalo',
  accountNumber: 'VXK-8421',
  phone: '0824559102',
  email: 'sipho.k@gmail.com',
  role: 'customer',
  lineSpeed: '10/5Mbps @R900pm',
  deviceName: 'Samsung Galaxy A54',
  macAddress: 'DC:A6:32:89:FE:10',
  ipAddress: '192.168.88.114',
  partnerDeviceId: 'pd-102',
  partnerVenue: 'Soweto Junction Hotspot',
  routerBrand: 'MikroTik RouterOS',
  voucherCode: 'VXK771299014421',
  connectedAtMs: 1_000_000,
  baseUsedMb: 400,
  downloadMbps: 10,
  uploadMbps: 5,
  quotaLimitMb: 5000,
  status: 'Online',
};

test('formats live elapsed session durations and SAST clock accurately', () => {
  assert.equal(formatLiveDuration(10_000, 10_000 + 3665_000), '01:01:05');
  assert.equal(formatLiveDuration(50_000, 10_000), '00:00:00');
  const clock = formatSASTClock(Date.UTC(2026, 10, 18, 12, 30, 45));
  assert.equal(clock, '14:30:45 SAST');
});

test('computes incremental live data usage and masks emails in public view', () => {
  const usage = computeLiveSessionUsageMb(SAMPLE_LIVE_USER, SAMPLE_LIVE_USER.connectedAtMs + 60_000);
  assert.ok(usage > 400);
  assert.equal(maskEmailForPublic('sipho.k@gmail.com'), 'si***@gmail.com');
});

test('filters live connected users by partner hub and search query', () => {
  const disconnected: LiveConnectedUser = {
    ...SAMPLE_LIVE_USER,
    id: 'live-2',
    profileName: 'Nomsa Dlamini',
    partnerDeviceId: 'pd-103',
    partnerVenue: 'Midrand Taxi Rank Wi-Fi',
    status: 'Disconnected',
  };
  const all = [SAMPLE_LIVE_USER, disconnected];
  assert.equal(filterLiveConnectedUsers(all, 'nomsa', 'all', true).length, 1);
  assert.equal(filterLiveConnectedUsers(all, '', 'all', false).length, 1);
  assert.equal(filterLiveConnectedUsers(all, '', 'pd-102', true).length, 1);
});

test('connects a real user profile into a live session and toggles disconnect/reconnect', () => {
  const now = 2_000_000;
  const connected = connectProfileAsLiveUser(INITIAL_USER, INITIAL_PARTNER_DEVICES[1], now);
  assert.equal(connected.profileName, 'Sipho Khumalo');
  assert.equal(connected.accountNumber, 'VXK-8421');
  assert.equal(connected.status, 'Online');
  assert.equal(connected.isCurrentBrowser, true);

  const summary = computeLiveUsersSummary([connected], now + 5000);
  assert.equal(summary.onlineCount, 1);
  assert.ok(summary.totalDownloadMbps > 0);

  const afterKick = toggleLiveUserStatus([connected], connected.id, now + 10_000);
  assert.equal(afterKick[0].status, 'Disconnected');
  assert.equal(afterKick[0].downloadMbps, 0);

  const afterReconnect = toggleLiveUserStatus(afterKick, connected.id, now + 15_000);
  assert.equal(afterReconnect[0].status, 'Online');
});
