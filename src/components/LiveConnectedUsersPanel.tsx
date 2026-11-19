import React, { useEffect, useState } from 'react';
import {
  Users,
  Wifi,
  Clock,
  ArrowDownUp,
  Search,
  Power,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Radio,
} from 'lucide-react';
import { LiveConnectedUser, PartnerDevice, UserSession } from '../types/index.ts';
import {
  computeLiveSessionUsageMb,
  computeLiveUsersSummary,
  connectProfileAsLiveUser,
  filterLiveConnectedUsers,
  formatLiveDuration,
  formatSASTClock,
  maskEmailForPublic,
} from '../utils/liveUsersRules.ts';
import { maskPublicPhone } from '../utils/ticketRules.ts';
import { SAMPLE_USER_PROFILES } from '../data/seedData.ts';

interface LiveConnectedUsersPanelProps {
  liveUsers: LiveConnectedUser[];
  partnerDevices: PartnerDevice[];
  currentUser: UserSession | null;
  onToggleUserStatus: (userId: string) => void;
  onConnectSampleUser: (newUser: LiveConnectedUser) => void;
  selectedPartnerFilter?: string;
  onChangePartnerFilter?: (partnerId: string) => void;
}

export const LiveConnectedUsersPanel: React.FC<LiveConnectedUsersPanelProps> = ({
  liveUsers,
  partnerDevices,
  currentUser,
  onToggleUserStatus,
  onConnectSampleUser,
  selectedPartnerFilter = 'all',
  onChangePartnerFilter,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [internalPartnerFilter, setInternalPartnerFilter] = useState('all');
  const [showDisconnected, setShowDisconnected] = useState(true);
  const [selectedSampleUsername, setSelectedSampleUsername] = useState(
    SAMPLE_USER_PROFILES[0]?.username || 'sipho.khumalo'
  );
  const [selectedHubId, setSelectedHubId] = useState(partnerDevices[0]?.id || 'pd-101');

  const activeFilter = onChangePartnerFilter ? selectedPartnerFilter : internalPartnerFilter;
  const setFilter = (val: string) => {
    if (onChangePartnerFilter) {
      onChangePartnerFilter(val);
    } else {
      setInternalPartnerFilter(val);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = computeLiveUsersSummary(liveUsers, nowMs);
  const visibleUsers = filterLiveConnectedUsers(
    liveUsers,
    searchQuery,
    activeFilter,
    showDisconnected
  );

  const handleConnectSample = () => {
    const profile =
      SAMPLE_USER_PROFILES.find((p) => p.username === selectedSampleUsername) ||
      SAMPLE_USER_PROFILES[0];
    const targetHub =
      partnerDevices.find((d) => d.id === selectedHubId) || partnerDevices[0];
    if (!profile || !targetHub) return;
    const liveEntry = connectProfileAsLiveUser(profile, targetHub, Date.now());
    onConnectSampleUser(liveEntry);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeStyle = (role: LiveConnectedUser['role']) => {
    switch (role) {
      case 'technician':
        return 'bg-purple-950/70 text-purple-300 border-purple-700/60';
      case 'partner':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
      case 'hotspot':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/60';
      default:
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
    }
  };

  return (
    <div
      className="border rounded-2xl p-6 shadow-xl space-y-5"
      style={{ backgroundColor: '#000000', borderColor: '#232323' }}
    >
      {/* Header Row with Live Clock & Totals */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded border border-emerald-500/50"
              style={{ backgroundColor: '#146100', color: '#fffdfd' }}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: '#00f302' }}
              />
              <span>Live Real-Time Sessions</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span data-testid="live-sast-clock">{formatSASTClock(nowMs)}</span>
            </span>
          </div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Live Connected Users Monitor (Sample Real User Profiles)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time subscriber &amp; partner sessions authenticated through pfSense+ Master across
            active hotspot routers.
          </p>
        </div>

        {/* Live Telemetry Counters */}
        <div className="grid grid-cols-3 gap-2.5 shrink-0 text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Online Users</div>
            <div className="text-lg font-black font-mono" style={{ color: '#00ff77' }}>
              {summary.onlineCount} Online
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Live Down / Up</div>
            <div className="text-sm font-black font-mono mt-0.5" style={{ color: '#18ff00' }}>
              {summary.totalDownloadMbps} / {summary.totalUploadMbps} Mbps
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Active Traffic</div>
            <div className="text-sm font-black font-mono text-cyan-300 mt-0.5">
              {summary.totalUsedMb.toLocaleString()} MB
            </div>
          </div>
        </div>
      </div>

      {/* Connect Sample Real User Profile Live Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Connect Sample User Profile into Live Stream:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSampleUsername}
            onChange={(e) => setSelectedSampleUsername(e.target.value)}
            aria-label="Select sample user profile to connect live"
            style={{ backgroundColor: '#060606' }}
            className="px-3 py-2 rounded-lg border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {SAMPLE_USER_PROFILES.map((p) => (
              <option key={p.username} value={p.username}>
                {p.name} ({p.accountNumber})
              </option>
            ))}
          </select>

          <select
            value={selectedHubId}
            onChange={(e) => setSelectedHubId(e.target.value)}
            aria-label="Select target partner router hub"
            style={{ backgroundColor: '#060606' }}
            className="px-3 py-2 rounded-lg border border-slate-700 text-cyan-300 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {partnerDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.partnerBusinessName} ({d.brandName})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleConnectSample}
            style={{ backgroundColor: '#146100', color: '#00ff77' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-500/60 font-bold text-xs hover:brightness-110 transition whitespace-nowrap"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Connect User Live</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs items-center">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search live user name, account, MAC, IP, or venue..."
            style={{ backgroundColor: '#060606' }}
            className="w-full pl-9 pr-3 py-2 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={activeFilter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter live users by partner router"
            style={{ backgroundColor: '#060606' }}
            className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Partner Routers ({liveUsers.length} Sessions)</option>
            {partnerDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.partnerBusinessName} — {d.brandName}
              </option>
            ))}
          </select>
        </div>

        <label className="md:col-span-3 flex items-center gap-2 text-slate-300 cursor-pointer justify-end">
          <input
            type="checkbox"
            checked={showDisconnected}
            onChange={(e) => setShowDisconnected(e.target.checked)}
            className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
          />
          <span>Show disconnected sessions</span>
        </label>
      </div>

      {/* Live User Session Profiles List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {visibleUsers.length === 0 ? (
          <div className="xl:col-span-2 p-8 text-center rounded-xl border border-slate-800 text-xs text-slate-400">
            No connected users match your current filter.
          </div>
        ) : (
          visibleUsers.map((user) => {
            const liveUsageMb = computeLiveSessionUsageMb(user, nowMs);
            const usagePct = Math.min(100, Math.round((liveUsageMb / user.quotaLimitMb) * 100));
            const isOnline = user.status === 'Online';
            const isIdle = user.status === 'Idle';
            const displayPhone = currentUser ? user.phone : maskPublicPhone(user.phone);
            const displayEmail = currentUser ? user.email : maskEmailForPublic(user.email);

            return (
              <div
                key={user.id}
                className={`p-4 rounded-xl border transition space-y-3 ${
                  user.status === 'Disconnected'
                    ? 'bg-slate-950/60 border-slate-800/70 opacity-75'
                    : 'bg-slate-900/70 border-slate-800 hover:border-emerald-700/60'
                }`}
              >
                {/* Top Identity Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border shrink-0"
                      style={{
                        backgroundColor: isOnline ? '#146100' : '#1e293b',
                        borderColor: isOnline ? '#13e511' : '#334155',
                        color: isOnline ? '#00ff77' : '#cbd5e1',
                      }}
                    >
                      {getInitials(user.profileName)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-white text-sm">{user.profileName}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {user.accountNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                        {user.isCurrentBrowser && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Live Browser
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {displayPhone} • {displayEmail} • {user.lineSpeed}
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                      isOnline
                        ? 'bg-emerald-950/70 border-emerald-500/60'
                        : isIdle
                        ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                        : 'bg-red-950/60 border-red-700/60 text-red-300'
                    }`}
                    style={isOnline ? { color: '#00ff77' } : undefined}
                  >
                    {isOnline && (
                      <span
                        className="w-2 h-2 rounded-full animate-ping"
                        style={{ backgroundColor: '#00f302' }}
                      />
                    )}
                    <span>{user.status}</span>
                  </span>
                </div>

                {/* Network & Hardware Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-black/60 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">
                      Device / Hardware MAC
                    </span>
                    <span className="text-slate-200 font-semibold block truncate">
                      {user.deviceName}
                    </span>
                    <span className="font-mono font-bold" style={{ color: '#18ff00' }}>
                      {user.macAddress}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">
                      Hub / Gateway IP
                    </span>
                    <span className="text-cyan-300 font-semibold block truncate">
                      {user.partnerVenue}
                    </span>
                    <span className="font-mono text-slate-300">
                      {user.ipAddress} ({user.routerBrand})
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase text-slate-500 block">
                      Live Uptime / Speed
                    </span>
                    <span className="font-mono font-bold text-white block">
                      {user.status === 'Disconnected'
                        ? '00:00:00 (Ended)'
                        : formatLiveDuration(user.connectedAtMs, nowMs)}
                    </span>
                    <span className="font-mono inline-flex items-center gap-1" style={{ color: '#48fb00' }}>
                      <ArrowDownUp className="w-3 h-3" />
                      {user.downloadMbps} ↓ / {user.uploadMbps} ↑ Mbps
                    </span>
                  </div>
                </div>

                {/* Quota & Voucher Footer Actions */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      pfSense+ Voucher:{' '}
                      <strong className="font-mono text-cyan-300">{user.voucherCode}</strong>
                    </span>
                    <span className="font-mono text-slate-300">
                      {liveUsageMb.toFixed(1)} / {user.quotaLimitMb.toLocaleString()} MB ({usagePct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${usagePct}%`,
                        backgroundColor:
                          user.status === 'Disconnected'
                            ? '#ef4444'
                            : isIdle
                            ? '#f59e0b'
                            : '#00f302',
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500 inline-flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Auth: pfSense+ Captive Session Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleUserStatus(user.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border transition ${
                      user.status === 'Disconnected'
                        ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-600/60'
                        : 'bg-red-950/60 hover:bg-red-900/70 text-red-300 border-red-700/60'
                    }`}
                  >
                    {user.status === 'Disconnected' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reconnect Session</span>
                      </>
                    ) : (
                      <>
                        <Power className="w-3.5 h-3.5" />
                        <span>Disconnect Session</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
