import { LiveConnectedUser, PartnerDevice, UserSession } from '../types/index.ts';

export function formatLiveDuration(connectedAtMs: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((nowMs - connectedAtMs) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatSASTClock(nowMs: number): string {
  const date = new Date(nowMs);
  // SAST is UTC+2 year-round
  const sast = new Date(date.getTime() + 2 * 3600 * 1000);
  const hh = String(sast.getUTCHours()).padStart(2, '0');
  const mm = String(sast.getUTCMinutes()).padStart(2, '0');
  const ss = String(sast.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} SAST`;
}

export function computeLiveSessionUsageMb(user: LiveConnectedUser, nowMs: number): number {
  if (user.status === 'Disconnected') {
    return Number(user.baseUsedMb.toFixed(1));
  }
  const elapsedSec = Math.max(0, (nowMs - user.connectedAtMs) / 1000);
  // Only add incremental live tick beyond initial session baseline capped softly under quota
  const rateFactor = user.status === 'Online' ? (user.downloadMbps + user.uploadMbps) * 0.015 : 0.01;
  const liveDeltaMb = Math.min(250, (elapsedSec % 1200) * rateFactor);
  return Number(Math.min(user.quotaLimitMb, user.baseUsedMb + liveDeltaMb).toFixed(1));
}

export function maskEmailForPublic(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const local = parts[0];
  const domain = parts[1];
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function filterLiveConnectedUsers(
  users: LiveConnectedUser[],
  query: string,
  partnerFilter: string,
  includeDisconnected = true
): LiveConnectedUser[] {
  const q = query.trim().toLowerCase();
  return users.filter((u) => {
    if (!includeDisconnected && u.status === 'Disconnected') {
      return false;
    }
    const matchesPartner =
      partnerFilter === 'all' || u.partnerDeviceId === partnerFilter || u.partnerVenue === partnerFilter;
    const matchesQuery =
      !q ||
      u.profileName.toLowerCase().includes(q) ||
      u.accountNumber.toLowerCase().includes(q) ||
      u.macAddress.toLowerCase().includes(q) ||
      u.ipAddress.toLowerCase().includes(q) ||
      u.partnerVenue.toLowerCase().includes(q) ||
      u.deviceName.toLowerCase().includes(q) ||
      u.voucherCode.toLowerCase().includes(q);
    return matchesPartner && matchesQuery;
  });
}

export function computeLiveUsersSummary(users: LiveConnectedUser[], nowMs: number) {
  const onlineUsers = users.filter((u) => u.status === 'Online');
  const idleUsers = users.filter((u) => u.status === 'Idle');
  const totalDownloadMbps = Number(
    onlineUsers.reduce((acc, u) => acc + u.downloadMbps, 0).toFixed(1)
  );
  const totalUploadMbps = Number(
    onlineUsers.reduce((acc, u) => acc + u.uploadMbps, 0).toFixed(1)
  );
  const totalUsedMb = Number(
    users.reduce((acc, u) => acc + computeLiveSessionUsageMb(u, nowMs), 0).toFixed(1)
  );

  return {
    onlineCount: onlineUsers.length,
    idleCount: idleUsers.length,
    totalActiveCount: onlineUsers.length + idleUsers.length,
    totalDownloadMbps,
    totalUploadMbps,
    totalUsedMb,
  };
}

export function connectProfileAsLiveUser(
  profile: UserSession,
  partnerDevice: PartnerDevice,
  nowMs: number,
  overrideMac?: string
): LiveConnectedUser {
  const role: LiveConnectedUser['role'] =
    profile.role === 'technician' || profile.role === 'admin'
      ? 'technician'
      : profile.lineSpeed.toLowerCase().includes('hotspot')
      ? 'hotspot'
      : 'customer';

  const cleanOctets = partnerDevice.gatewayIp.split('.');
  const assignedIp =
    cleanOctets.length === 4
      ? `${cleanOctets[0]}.${cleanOctets[1]}.${cleanOctets[2]}.${105 + (nowMs % 120)}`
      : '192.168.88.199';

  return {
    id: `live-${profile.accountNumber.toLowerCase()}`,
    profileName: profile.name.replace(/\s*\([^)]*\)\s*/g, '').trim(),
    username: profile.username,
    accountNumber: profile.accountNumber,
    phone: profile.phone,
    email: profile.email,
    role,
    lineSpeed: profile.lineSpeed,
    deviceName: `${profile.name.split(' ')[0]}'s Live Browser Session`,
    macAddress: overrideMac || 'D4:5D:64:1B:9A:80',
    ipAddress: assignedIp,
    partnerDeviceId: partnerDevice.id,
    partnerVenue: partnerDevice.partnerBusinessName,
    routerBrand: partnerDevice.brandName,
    voucherCode: partnerDevice.approvedVoucherCode || 'PFS-LIVE-SESSION',
    connectedAtMs: nowMs,
    baseUsedMb: 12.4,
    downloadMbps: 18.4,
    uploadMbps: 8.6,
    quotaLimitMb: 10000,
    status: 'Online',
    isCurrentBrowser: true,
  };
}

export function toggleLiveUserStatus(
  users: LiveConnectedUser[],
  userId: string,
  nowMs: number
): LiveConnectedUser[] {
  return users.map((u) => {
    if (u.id !== userId) return u;
    if (u.status === 'Disconnected') {
      return {
        ...u,
        status: 'Online',
        connectedAtMs: nowMs,
        downloadMbps: u.downloadMbps > 0 ? u.downloadMbps : 11.2,
        uploadMbps: u.uploadMbps > 0 ? u.uploadMbps : 4.8,
      };
    }
    return {
      ...u,
      status: 'Disconnected',
      downloadMbps: 0,
      uploadMbps: 0,
    };
  });
}
