import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  ShieldCheck,
  Router,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  Search,
  Building2,
  MapPin,
  ArrowRight,
  Globe,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { LiveConnectedUser, PartnerDevice, UserSession } from '../types/index.ts';
import {
  CAPTIVE_DEVICE_BRANDS,
  PFSENSE_AUTHORITY_CONFIG,
  authorizePartnerDeviceWithPfSense,
  computePartnerDashboardStats,
} from '../utils/partnerRules.ts';
import {
  PfsenseDispatchRecord,
  normalizePfsenseActionUrl,
} from '../utils/pfsenseBridgeRules.ts';
import { LiveConnectedUsersPanel } from './LiveConnectedUsersPanel.tsx';

interface WifiPartnerDashboardViewProps {
  partnerDevices: PartnerDevice[];
  liveUsers: LiveConnectedUser[];
  currentUser: UserSession | null;
  onUpdatePartnerDevice: (updated: PartnerDevice) => void;
  onToggleLiveUserStatus: (userId: string) => void;
  onConnectSampleUser: (newUser: LiveConnectedUser) => void;
  onGoToRegister: (preferredBrandId?: string) => void;
}

export const WifiPartnerDashboardView: React.FC<WifiPartnerDashboardViewProps> = ({
  partnerDevices,
  liveUsers,
  currentUser,
  onUpdatePartnerDevice,
  onToggleLiveUserStatus,
  onConnectSampleUser,
  onGoToRegister,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [livePartnerFilter, setLivePartnerFilter] = useState('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('__ALL__');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);
  const [dispatchLog, setDispatchLog] = useState<PfsenseDispatchRecord[]>([]);

  const fetchDispatchLog = useCallback(async () => {
    try {
      const res = await fetch('/api/pfsense/ledger');
      if (!res.ok) return;
      const data = (await res.json()) as { recentDispatches?: PfsenseDispatchRecord[] };
      if (Array.isArray(data.recentDispatches)) {
        setDispatchLog(data.recentDispatches);
      }
    } catch {
      // Ignore polling error
    }
  }, []);

  useEffect(() => {
    fetchDispatchLog();
    const id = setInterval(fetchDispatchLog, 5000);
    return () => clearInterval(id);
  }, [fetchDispatchLog]);

  const stats = computePartnerDashboardStats(partnerDevices);

  const filteredDevices = partnerDevices.filter((dev) => {
    const matchesBrand = brandFilter === 'all' || dev.brandId === brandFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      dev.partnerBusinessName.toLowerCase().includes(q) ||
      dev.deviceName.toLowerCase().includes(q) ||
      dev.brandName.toLowerCase().includes(q) ||
      dev.macAddress.toLowerCase().includes(q) ||
      dev.location.toLowerCase().includes(q);
    return matchesBrand && matchesSearch;
  });

  const dispatchVoucherToBackend = async (dev: PartnerDevice, voucherCode: string) => {
    try {
      const targetUrl = normalizePfsenseActionUrl({
        gatewayIp: dev.gatewayIp,
        port: 8003,
        zone: 'vxk_partner_portal',
      });
      await fetch('/api/pfsense/voucher/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherCode,
          portalUrl: targetUrl,
          gatewayIp: dev.gatewayIp,
          zone: 'vxk_partner_portal',
          clientMac: dev.macAddress,
          clientIp: dev.localIp,
          subscriberName: dev.partnerBusinessName,
        }),
      });
    } catch {
      // Continue syncing client dashboard
    }
  };

  const handleAuthorizeVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback(null);

    const targets =
      selectedDeviceId === '__ALL__'
        ? partnerDevices
        : partnerDevices.filter((d) => d.id === selectedDeviceId);

    if (targets.length === 0) {
      setAuthFeedback({ type: 'error', message: 'Select a registered partner router first.' });
      return;
    }

    const approvedList: PartnerDevice[] = [];
    for (const target of targets) {
      const result = authorizePartnerDeviceWithPfSense(target, voucherCodeInput);
      if (!result.ok || !result.updatedDevice) {
        setAuthFeedback({
          type: 'error',
          message: result.error || 'pfSense+ voucher approval failed.',
        });
        return;
      }
      approvedList.push(result.updatedDevice);
    }

    for (const updated of approvedList) {
      onUpdatePartnerDevice(updated);
    }
    await Promise.all(
      approvedList.map((updated) =>
        dispatchVoucherToBackend(updated, updated.approvedVoucherCode || 'PFS-VOUCH-SYNC')
      )
    );
    await fetchDispatchLog();

    const firstCode = approvedList[0].approvedVoucherCode;
    setAuthFeedback({
      type: 'success',
      message:
        approvedList.length > 1
          ? `pfSense+ Master approved & transmitted voucher [${firstCode}] back-to-back across ALL ${approvedList.length} registered partner routers.`
          : `pfSense+ Master approved & transmitted voucher [${firstCode}] to ${approvedList[0].partnerBusinessName} (${approvedList[0].macAddress}).`,
    });
    setVoucherCodeInput('');
  };

  const handleQuickSyncDevice = async (device: PartnerDevice) => {
    setSyncingDeviceId(device.id);
    const result = authorizePartnerDeviceWithPfSense(device);
    if (result.ok && result.updatedDevice) {
      onUpdatePartnerDevice(result.updatedDevice);
      await dispatchVoucherToBackend(
        result.updatedDevice,
        result.updatedDevice.approvedVoucherCode || 'PFS-VOUCH-SYNC'
      );
      await fetchDispatchLog();
      setAuthFeedback({
        type: 'success',
        message: `Synced ${device.deviceName} (${device.brandName}) back-to-back with ${PFSENSE_AUTHORITY_CONFIG.masterHost}.`,
      });
    }
    setSyncingDeviceId(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner — Styled to match Captive Wi-Fi Partnering Design */}
      <div
        className="border rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          backgroundColor: '#000000',
          borderColor: '#13e511',
          borderStyle: 'groove',
          borderWidth: '3.25px',
          borderRadius: '20px',
        }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded border border-emerald-400/50"
              style={{ backgroundColor: '#146100', color: '#fffdfd' }}
            >
              pfSense+ Master Authority
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/45 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-400/40 text-xs font-semibold">
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: '#00f302' }}
              />
              Multi-Brand Captive Portal Sync Active
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-white" />
            <span>WI-FI BUSINESS PARTNERS DASHBOARD</span>
          </h2>
          <p className="text-white/95 mt-1 max-w-3xl" style={{ fontSize: '16px' }}>
            All captive-portal router brands sync through the VXK website with{' '}
            <strong>pfSense+</strong> acting as the main voucher approval and internet access
            authority for every registered partner device.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onGoToRegister()}
          style={{ backgroundColor: '#329f00', borderRadius: '10px', color: '#00ff77' }}
          className="inline-flex items-center gap-2 px-5 py-3 font-bold text-sm shadow-lg hover:brightness-110 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span style={{ color: '#000000', fontSize: '22px' }}>
            Register &amp; Scan Router Device
          </span>
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="border rounded-2xl p-4 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Partner Devices Registered
          </div>
          <div className="text-2xl font-black mt-1" style={{ color: '#18ff00' }}>
            {stats.totalDevices}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.uniqueBrandsCount} router brands synced
          </div>
        </div>

        <div
          className="border rounded-2xl p-4 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            pfSense+ Authorized
          </div>
          <div className="text-2xl font-black mt-1" style={{ color: '#00ff77' }}>
            {stats.authorizedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active internet gateway access
          </div>
        </div>

        <div
          className="border rounded-2xl p-4 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Pending pfSense+ Auth
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Awaiting voucher approval
          </div>
        </div>

        <div
          className="border rounded-2xl p-4 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Live Connected Users
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {liveUsers.filter((u) => u.status === 'Online').length} Live
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.totalActiveSessions} total pooled sessions
          </div>
        </div>
      </div>

      {/* Real-Time Live Connected Users Section */}
      <LiveConnectedUsersPanel
        liveUsers={liveUsers}
        partnerDevices={partnerDevices}
        currentUser={currentUser}
        onToggleUserStatus={onToggleLiveUserStatus}
        onConnectSampleUser={onConnectSampleUser}
        selectedPartnerFilter={livePartnerFilter}
        onChangePartnerFilter={setLivePartnerFilter}
      />

      {authFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            authFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
              : 'bg-red-950/60 border-red-700 text-red-200'
          }`}
        >
          {authFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{authFeedback.message}</span>
        </div>
      )}

      {/* Main Split: Registered Partner Devices & pfSense+ Voucher Authority Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Registered Partner Routers / Devices */}
        <div
          className="lg:col-span-8 border rounded-2xl p-6 shadow-xl space-y-5"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Router className="w-4 h-4 text-cyan-400" />
              <span style={{ fontSize: '18px' }}>Registered Partner Routers &amp; Gateways</span>
            </h3>
            <span
              className="text-xs font-mono px-2.5 py-1 rounded border border-emerald-700"
              style={{ backgroundColor: '#146100', color: '#fffdfd' }}
            >
              Authority: {PFSENSE_AUTHORITY_CONFIG.masterHost}
            </span>
          </div>

          {/* Search and Brand Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search business, router MAC, or area..."
                style={{ backgroundColor: '#060606' }}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              aria-label="Filter by router brand"
              style={{ backgroundColor: '#060606' }}
              className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Supported Brands ({CAPTIVE_DEVICE_BRANDS.length})</option>
              {CAPTIVE_DEVICE_BRANDS.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Devices List */}
          <div className="space-y-3">
            {filteredDevices.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-800 text-xs text-slate-400">
                No partner routers match your filter. Register a new router from Captive Wi-Fi.
              </div>
            ) : (
              filteredDevices.map((dev) => {
                const isAuthorized = dev.pfsenseAuthStatus === 'Authorized';
                return (
                  <div
                    key={dev.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {dev.partnerBusinessName}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                            {dev.brandName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {dev.connectionType}
                          </span>
                          {dev.gatewayTag && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-700/60">
                              Gateway: {dev.gatewayTag}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                          <span className="font-semibold text-slate-200">{dev.deviceName}</span>
                          <span>•</span>
                          <span>{dev.model}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {dev.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            isAuthorized
                              ? 'bg-emerald-950/70 border-emerald-500/60'
                              : 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                          }`}
                          style={isAuthorized ? { color: '#00ff77' } : undefined}
                        >
                          {isAuthorized ? 'Authorized by pfSense+' : 'Pending pfSense+ Auth'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-black/60 p-3 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">
                          Hardware MAC
                        </span>
                        <span className="font-mono font-bold" style={{ color: '#18ff00' }}>
                          {dev.macAddress}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">
                          Router Gateway / IP
                        </span>
                        <span className="font-mono text-cyan-300 font-semibold">
                          {dev.gatewayIp} ({dev.localIp})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">
                          Voucher Approval / Sessions
                        </span>
                        <span className="font-mono text-slate-200">
                          {dev.approvedVoucherCode || 'Not issued'} • {dev.activeSessions} active
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>
                        Sync: <strong className="text-slate-300">{dev.syncProtocol}</strong> • Last
                        synced {dev.lastSyncedAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickSyncDevice(dev)}
                        disabled={syncingDeviceId === dev.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-slate-700 transition"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            syncingDeviceId === dev.id ? 'animate-spin' : ''
                          }`}
                        />
                        <span>
                          {isAuthorized ? 'Re-sync pfSense+ Authority' : 'Sync & Authorize (pfSense+)'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: pfSense+ Master Voucher & Access Authority Control */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className="border rounded-2xl p-6 shadow-xl space-y-4"
            style={{ backgroundColor: '#000000', borderColor: '#232323' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>pfSense+ Voucher Authority</span>
              </h3>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: '#146100', color: '#fffdfd' }}
              >
                Master Sync
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Portal Zone:</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {PFSENSE_AUTHORITY_CONFIG.portalZone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RADIUS Auth / Acct:</span>
                <span className="font-mono text-white">
                  UDP {PFSENSE_AUTHORITY_CONFIG.radiusAuthPort} / {PFSENSE_AUTHORITY_CONFIG.radiusAcctPort}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Web Authority Port:</span>
                <span className="font-mono" style={{ color: '#48fb00' }}>
                  HTTPS :{PFSENSE_AUTHORITY_CONFIG.authPort} Active
                </span>
              </div>
            </div>

            <form onSubmit={handleAuthorizeVoucher} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Target Partner Router / Device:
                </label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  style={{ backgroundColor: '#060606' }}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="__ALL__">
                    All Registered Partner Hubs ({partnerDevices.length} Routers) — Broadcast Sync
                  </option>
                  {partnerDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.partnerBusinessName} — {d.brandName} ({d.pfsenseAuthStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  pfSense+ Voucher Roll / Code (Optional):
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-amber-400" />
                  <input
                    type="text"
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value)}
                    placeholder="e.g. VXK-9901-8812"
                    style={{ backgroundColor: '#060606', color: '#18ff00' }}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Leave blank to sync default pfSense+ partner roll, or enter a voucher PIN to
                  authorize internet access immediately.
                </p>
              </div>

              <button
                type="submit"
                style={{ backgroundColor: '#ff0000', color: '#00ff77' }}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span style={{ color: '#ffffff', fontSize: '25px' }}>
                  Approve Voucher &amp; Grant Access (pfSense+)
                </span>
              </button>
            </form>
          </div>

          {/* Live Shared Back-to-Back pfSense+ Relay Ledger */}
          <div
            className="border rounded-2xl p-6 shadow-xl space-y-3"
            style={{ backgroundColor: '#000000', borderColor: '#232323' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Live pfSense+ Dispatch Log ({dispatchLog.length})</span>
              </h3>
            </div>
            {dispatchLog.length === 0 ? (
              <p className="text-xs text-slate-400">
                Approve a voucher above or redeem one on the Captive Portal page to view real-time
                pfSense+ transmissions across all hubs.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {dispatchLog.slice(0, 6).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-300">{rec.voucherCodeMasked}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                        {rec.outcome}
                      </span>
                    </div>
                    <div className="text-slate-400 truncate">{rec.targetUrl}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Supported Captive Portal Brands Matrix */}
      <div
        className="border rounded-2xl p-6 shadow-xl space-y-4"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>
                Supported Captive Portal Device Brands ({CAPTIVE_DEVICE_BRANDS.length} Brands Synced
                with pfSense+)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every router and AP brand below authenticates users via the VXK website portal and
              delegates voucher validation &amp; internet access control to pfSense+.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPTIVE_DEVICE_BRANDS.map((brand) => (
            <div
              key={brand.id}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white text-sm">{brand.name}</span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
                    {brand.defaultSubnet}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Models: <span className="text-slate-300">{brand.models.join(', ')}</span>
                </div>
                <div className="text-[11px]" style={{ color: '#48fb00' }}>
                  {brand.syncProtocol}
                </div>
                <p className="text-[11px] text-slate-400">{brand.pfsenseRole}</p>
              </div>

              <button
                type="button"
                onClick={() => onGoToRegister(brand.id)}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
              >
                <span>Register {brand.vendor} Device</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
