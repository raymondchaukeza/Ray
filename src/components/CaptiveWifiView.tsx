import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Radio,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Scan,
  Router,
  Building2,
} from 'lucide-react';
import {
  CaptiveDevice,
  LiveConnectedUser,
  PartnerDevice,
  RouterScanResult,
  UserSession,
} from '../types/index.ts';
import { LoginForm } from './LoginForm.tsx';
import {
  CAPTIVE_DEVICE_BRANDS,
  PFSENSE_AUTHORITY_CONFIG,
  simulateRouterScan,
  validateMacAddress,
  validatePartnerDeviceRegistration,
} from '../utils/partnerRules.ts';

interface CaptiveWifiViewProps {
  currentUser: UserSession | null;
  onLoginSuccess: (user: UserSession) => void;
  onOpenFaultOverlay: () => void;
  devices: CaptiveDevice[];
  onRegisterDevice: (device: CaptiveDevice) => void;
  onAddPartnerDevice: (partnerDevice: PartnerDevice) => void;
  onOpenPartnerDashboard: () => void;
  partnerDeviceCount: number;
  liveUsers?: LiveConnectedUser[];
  initialBrandId?: string;
}

export const CaptiveWifiView: React.FC<CaptiveWifiViewProps> = ({
  currentUser,
  onLoginSuccess,
  onOpenFaultOverlay,
  devices,
  onRegisterDevice,
  onAddPartnerDevice,
  onOpenPartnerDashboard,
  partnerDeviceCount,
  liveUsers = [],
  initialBrandId,
}) => {
  const [currentMac, setCurrentMac] = useState('D4:5D:64:1B:9A:80');
  const [currentIp, setCurrentIp] = useState('192.168.88.156');
  const [deviceName, setDeviceName] = useState('Current Browser Device');
  const [selectedBrandId, setSelectedBrandId] = useState(initialBrandId || 'mikrotik');
  const [partnerBusinessName, setPartnerBusinessName] = useState('');
  const [partnerLocation, setPartnerLocation] = useState('');
  const [gatewayIp, setGatewayIp] = useState('192.168.88.1');

  // Direct router connection & scan workflow
  const [isDirectConnection, setIsDirectConnection] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<RouterScanResult | null>(null);
  const [scanConfirmed, setScanConfirmed] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialBrandId) {
      const brand = CAPTIVE_DEVICE_BRANDS.find((b) => b.id === initialBrandId);
      if (brand) {
        setSelectedBrandId(brand.id);
        setGatewayIp(brand.defaultSubnet);
        setScanResult(null);
        setScanConfirmed(false);
      }
    }
  }, [initialBrandId]);

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    const brand = CAPTIVE_DEVICE_BRANDS.find((b) => b.id === brandId);
    if (brand) {
      setGatewayIp(brand.defaultSubnet);
      const octets = brand.defaultSubnet.split('.');
      setCurrentIp(`${octets[0]}.${octets[1]}.${octets[2]}.156`);
    }
    setScanResult(null);
    setScanConfirmed(false);
  };

  const handleScanConnectedRouter = () => {
    setIsScanning(true);
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.scan;
      delete next.scanConfirmed;
      return next;
    });

    setTimeout(() => {
      const result = simulateRouterScan(selectedBrandId, currentMac);
      setScanResult(result);
      setGatewayIp(result.gatewayIp);
      setCurrentIp(result.deviceIp);
      setCurrentMac(result.macAddress);
      setScanConfirmed(false);
      setIsScanning(false);
    }, 450);
  };

  const handleRegisterCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePartnerDeviceRegistration({
      partnerBusinessName,
      location: partnerLocation,
      deviceName,
      brandId: selectedBrandId,
      macAddress: currentMac,
      gatewayIp,
      isDirectConnection,
      scanCompleted: Boolean(scanResult),
      scanConfirmed,
    });

    setFormErrors(validation.errors);
    if (!validation.isValid) {
      return;
    }

    setIsRegistering(true);
    setTimeout(() => {
      const normalizedMac = validateMacAddress(currentMac).normalized;
      const brand =
        CAPTIVE_DEVICE_BRANDS.find((b) => b.id === selectedBrandId) || CAPTIVE_DEVICE_BRANDS[0];
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      const newDev: CaptiveDevice = {
        id: `dev-${Date.now()}`,
        macAddress: normalizedMac,
        ipAddress: currentIp,
        deviceName: deviceName.trim(),
        registeredAt: nowStr,
        status: 'Connected',
        quotaRemainingMb: 5000,
      };
      onRegisterDevice(newDev);

      const newPartnerDevice: PartnerDevice = {
        id: `pd-${Date.now().toString().slice(-5)}`,
        partnerBusinessName: partnerBusinessName.trim(),
        location: partnerLocation.trim() || 'South Africa Partner Hub',
        deviceName: deviceName.trim(),
        brandId: brand.id,
        brandName: brand.name,
        model: scanResult?.model || brand.models[0],
        macAddress: normalizedMac,
        gatewayIp: gatewayIp.trim(),
        localIp: currentIp.trim(),
        syncProtocol: brand.syncProtocol,
        pfsenseAuthStatus: isDirectConnection && scanConfirmed ? 'Authorized' : 'Pending Auth',
        voucherAuthority: 'pfSense+ Master',
        approvedVoucherCode:
          isDirectConnection && scanConfirmed ? 'PFS-VOUCH-SYNC' : undefined,
        activeSessions: 1,
        lastSyncedAt: nowStr,
        connectionType: isDirectConnection ? 'Direct Scan' : 'Remote Manual',
      };
      onAddPartnerDevice(newPartnerDevice);

      fetch('/api/pfsense/voucher/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherCode: newPartnerDevice.approvedVoucherCode || 'PFS-VOUCH-SYNC',
          gatewayIp: newPartnerDevice.gatewayIp,
          zone: 'vxk_partner_portal',
          clientMac: newPartnerDevice.macAddress,
          clientIp: newPartnerDevice.localIp,
          subscriberName: newPartnerDevice.partnerBusinessName,
        }),
      }).catch(() => {});

      setIsRegistering(false);
      setSuccessMsg(
        `Device ${newDev.deviceName} (${newDev.macAddress} • ${brand.name}) confirmed, synced back-to-back with ${PFSENSE_AUTHORITY_CONFIG.masterHost}, and added to the Wi-Fi Business Partners Dashboard!`
      );
    }, 450);
  };

  const handleRandomizeMac = () => {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    setCurrentMac(`${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`);
    setScanResult(null);
    setScanConfirmed(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          backgroundColor: '#16a01a',
          borderColor: '#13e511',
          borderStyle: 'groove',
          borderWidth: '3.25px',
          borderRadius: '20px',
        }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase bg-black/45 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40">
              Drupal Node / 16
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/45 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-400/40 text-xs font-semibold">
              <span
                className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"
                style={{ backgroundColor: '#00f302' }}
              />
              pfSense+ Authority &amp; All Router Brands Synced
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Wifi className="w-6 h-6 text-cyan-400" />
            <span>REGISTER CAPTIVE WIFI</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl" style={{ fontSize: '17px' }}>
            Register any captive-portal router brand, scan directly connected router details, and
            authorize internet voucher access through <strong>pfSense+ Master Authority</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPartnerDashboard}
            style={{ backgroundColor: '#146100', color: '#fffdfd' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-400/50 font-semibold text-xs hover:brightness-110 transition"
          >
            <Building2 className="w-4 h-4" />
            <span>Partners Dashboard ({partnerDeviceCount})</span>
          </button>
          <button
            type="button"
            onClick={onOpenFaultOverlay}
            style={{ fontSize: '17px', borderRadius: '8px' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-semibold text-xs transition shrink-0"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Troubleshoot / Report Fault</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={onOpenPartnerDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shrink-0 transition"
          >
            <span>Open Wi-Fi Business Partners Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Device Registration & Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registration Card */}
        <div
          className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
          style={{ backgroundColor: '#000000' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span style={{ fontSize: '18px' }}>Current Device Network Profile</span>
            </h3>
            <span
              className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60"
              style={{
                fontSize: '16px',
                fontWeight: 'normal',
                color: '#fffdfd',
                backgroundColor: '#146100',
              }}
            >
              SSID: VXK_PREPAID_HOTSPOT
            </span>
          </div>

          <form onSubmit={handleRegisterCurrent} className="space-y-4 text-xs">
            {/* div:nth-of-type(1) - MAC Address */}
            <div>
              <div className="flex items-center justify-between mb-1" style={{ fontSize: '14px' }}>
                <label className="font-bold text-slate-300 uppercase tracking-wider">
                  Detected Hardware MAC Address:
                </label>
                <button
                  type="button"
                  onClick={handleRandomizeMac}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span style={{ fontSize: '16px' }}>Simulate Device Change</span>
                </button>
              </div>
              <input
                type="text"
                value={currentMac}
                onChange={(e) => setCurrentMac(e.target.value)}
                style={{ fontSize: '19px', fontWeight: 'bold', color: '#18ff00' }}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl font-mono text-cyan-300 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              {formErrors.macAddress && (
                <p className="mt-1 text-red-400 font-semibold">{formErrors.macAddress}</p>
              )}
              <p
                className="mt-1 text-[11px] text-slate-500"
                style={{ fontSize: '19px', color: '#48fb00' }}
              >
                Your device's physical network adapter identifier detected by the captive gateway.
              </p>
            </div>

            {/* div:nth-of-type(2) - Local Hotspot IP */}
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Local Hotspot IP Assignment:
              </label>
              <input
                type="text"
                value={currentIp}
                readOnly
                style={{ fontSize: '20px', fontWeight: 'bold' }}
                className="w-full px-3 py-2.5 bg-slate-800/40 border border-slate-800 rounded-xl font-mono text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            {/* div:nth-of-type(3) - Device Name / Friendly Label (Focus Mode Selector Target) */}
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Device Name / Friendly Label:
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Sipho's iPhone 14 or Main Shop Router"
                style={{ fontSize: '16px', fontWeight: 'normal' }}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              {formErrors.deviceName && (
                <p className="mt-1 text-red-400 font-semibold">{formErrors.deviceName}</p>
              )}
            </div>

            {/* Direct Connection Check + Multi-Brand pfSense+ Sync */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3">
              <div>
                <span className="font-bold text-white block mb-2 text-xs uppercase tracking-wider">
                  Are you connected directly to the router device you want to register?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectConnection(true);
                      setFormErrors({});
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 ${
                      isDirectConnection
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Scan className="w-4 h-4 shrink-0" />
                    <span>Yes — Scan Connected Router</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectConnection(false);
                      setScanResult(null);
                      setScanConfirmed(false);
                      setFormErrors({});
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 ${
                      !isDirectConnection
                        ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Router className="w-4 h-4 shrink-0" />
                    <span>No — Remote / Manual Entry</span>
                  </button>
                </div>
              </div>

              {/* Captive Brand & Partner Business Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 items-start">
                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Captive Router Brand *:
                  </label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    aria-label="Router or Captive Brand"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {CAPTIVE_DEVICE_BRANDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Router Gateway IP:
                  </label>
                  <input
                    type="text"
                    value={gatewayIp}
                    onChange={(e) => setGatewayIp(e.target.value)}
                    placeholder="e.g. 192.168.88.1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-cyan-300 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  {formErrors.gatewayIp && (
                    <p className="mt-1 text-red-400 font-semibold">{formErrors.gatewayIp}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Partner / Venue Name *:
                  </label>
                  <input
                    type="text"
                    value={partnerBusinessName}
                    onChange={(e) => setPartnerBusinessName(e.target.value)}
                    placeholder="e.g. Kasi Hub Wi-Fi"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  {formErrors.partnerBusinessName && (
                    <p className="mt-1 text-red-400 font-semibold">
                      {formErrors.partnerBusinessName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Site Location / Area:
                  </label>
                  <input
                    type="text"
                    value={partnerLocation}
                    onChange={(e) => setPartnerLocation(e.target.value)}
                    placeholder="e.g. Midrand, Gauteng"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Direct Scan Action & Scan Results */}
              {isDirectConnection && (
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={handleScanConnectedRouter}
                    disabled={isScanning}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Scan className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>
                      {isScanning
                        ? 'Scanning Connected Router & pfSense+ Authority...'
                        : scanResult
                        ? 'Re-scan Connected Router Device'
                        : 'Scan Connected Router Device'}
                    </span>
                  </button>

                  {formErrors.scan && (
                    <p className="text-red-400 font-semibold">{formErrors.scan}</p>
                  )}

                  {scanResult && (
                    <div className="p-3.5 rounded-xl bg-black border border-emerald-500/60 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Scanned Router Device Results</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {scanResult.scannedAt}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Detected Brand &amp; Model</span>
                          <span className="font-bold text-white">
                            {scanResult.brandName} — {scanResult.model}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Firmware / OS</span>
                          <span className="font-mono text-cyan-300">{scanResult.firmware}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Gateway &amp; Subnet</span>
                          <span className="font-mono text-white">
                            {scanResult.gatewayIp} ({scanResult.subnet})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Hardware MAC</span>
                          <span className="font-mono font-bold" style={{ color: '#18ff00' }}>
                            {scanResult.macAddress}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block">
                            pfSense+ Voucher &amp; Access Sync Endpoint
                          </span>
                          <span className="font-mono text-emerald-300 break-all">
                            {scanResult.pfsenseEndpoint} (Reachable)
                          </span>
                        </div>
                      </div>

                      <label className="flex items-start gap-2 pt-2 border-t border-slate-800 cursor-pointer text-slate-200">
                        <input
                          type="checkbox"
                          checked={scanConfirmed}
                          onChange={(e) => {
                            setScanConfirmed(e.target.checked);
                            if (e.target.checked) {
                              setFormErrors((prev) => {
                                const next = { ...prev };
                                delete next.scanConfirmed;
                                return next;
                              });
                            }
                          }}
                          className="mt-0.5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] leading-snug">
                          I confirm these scanned device details are accurate and authorize adding
                          this router to the <strong>Wi-Fi Business Partners Dashboard</strong>{' '}
                          with <strong>pfSense+</strong> as the master voucher authority.
                        </span>
                      </label>

                      {formErrors.scanConfirmed && (
                        <p className="text-red-400 font-semibold">{formErrors.scanConfirmed}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Account Tied to Auth:</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {currentUser ? currentUser.accountNumber : 'Guest / Business Partner'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Master Voucher Authority:</span>
                <span className="font-semibold text-emerald-400">
                  pfSense+ ({PFSENSE_AUTHORITY_CONFIG.masterHost})
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              style={{ backgroundColor: '#ff0000' }}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              {isRegistering ? (
                <span style={{ color: '#00ff77' }}>Syncing with pfSense+ Authority...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#00ff77' }} />
                  <span style={{ fontSize: '20px', color: '#00ff77' }}>
                    Confirm &amp; Add to Partners Dashboard
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Registered Devices / Login Block + Partner Dashboard Link */}
        <div className="lg:col-span-6 space-y-6">
          {!currentUser ? (
            <div className="space-y-4">
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-xs text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Partner or Subscriber Account Login (Optional)</h4>
                  <p className="text-amber-300/80 mt-0.5">
                    You can register and scan routers directly in public view, or sign in to link
                    sessions to your VXK prepaid subscriber balance.
                  </p>
                </div>
              </div>
              <LoginForm onLoginSuccess={onLoginSuccess} />
            </div>
          ) : (
            <div
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
              style={{ backgroundColor: '#000000' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span style={{ fontSize: '19px' }}>Authorized Devices on Account</span>
                </h3>
                <span className="text-xs text-slate-400" style={{ fontSize: '14px' }}>
                  {devices.length} Active / 3 Max
                </span>
              </div>

              <div className="space-y-3">
                {devices.map((dev, idx) => (
                  <div
                    key={dev.id}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                        {dev.deviceName.toLowerCase().includes('laptop') ? (
                          <Laptop className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{dev.deviceName}</div>
                        <div
                          className="text-[11px] font-mono text-slate-400"
                          style={{ fontSize: idx === 0 ? '14px' : idx === 1 ? '14px' : undefined }}
                        >
                          {dev.macAddress} • {dev.ipAddress}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        style={{ fontSize: idx === 0 ? '14px' : idx === 1 ? '13px' : undefined }}
                      >
                        {dev.status}
                      </span>
                      <div
                        className="text-[10px] text-slate-400 mt-1"
                        style={{ fontSize: idx === 0 ? '17px' : idx === 1 ? '17px' : undefined }}
                      >
                        {dev.quotaRemainingMb} MB quota
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={onOpenFaultOverlay}
                  className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold"
                >
                  <span>Cannot connect or captive screen blank? Report Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Partner Dashboard Quick Card */}
          <div
            className="border rounded-2xl p-5 shadow-xl space-y-3"
            style={{ backgroundColor: '#000000', borderColor: '#13e511' }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Wi-Fi Business Partners &amp; pfSense+ Sync</span>
              </h4>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: '#146100', color: '#fffdfd' }}
              >
                {partnerDeviceCount} Routers Synced
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Supports all {CAPTIVE_DEVICE_BRANDS.length} commercial captive-portal router brands
              (pfSense+, MikroTik, UniFi, TP-Link Omada, Cisco Meraki, Aruba, Ruckus, Cambium,
              Ruijie, Grandstream, OpenWrt, EnGenius) synchronized to{' '}
              <strong>pfSense+ Master</strong> for voucher approval and internet access.
            </p>
            {liveUsers.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
                    <span
                      className="w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: '#00f302' }}
                    />
                    <span>
                      {liveUsers.filter((u) => u.status === 'Online').length} Sample Users Online Now
                    </span>
                  </span>
                  <span className="font-mono text-slate-400">Real-Time pfSense+</span>
                </div>
                <div className="space-y-1.5">
                  {liveUsers
                    .filter((u) => u.status === 'Online')
                    .slice(0, 3)
                    .map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-black/70 border border-slate-800/80"
                      >
                        <span className="font-semibold text-white">
                          {u.profileName}{' '}
                          <span className="font-mono text-cyan-300 text-[10px]">
                            ({u.accountNumber})
                          </span>
                        </span>
                        <span className="font-mono text-[10px]" style={{ color: '#48fb00' }}>
                          {u.partnerVenue} • {u.downloadMbps} Mbps
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onOpenPartnerDashboard}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-emerald-700/60 flex items-center justify-center gap-2 transition"
            >
              <span>Open Wi-Fi Business Partners Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
