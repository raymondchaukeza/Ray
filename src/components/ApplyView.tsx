import React, { useState } from 'react';
import {
  FilePlus2,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  Clock,
  Receipt,
  Router,
  Wifi,
} from 'lucide-react';
import {
  ApplicationServiceType,
  IssuedTimedVoucher,
  ServiceApplication,
  UserSession,
  VoucherDurationUnit,
} from '../types/index.ts';
import { LINE_SPEED_PACKAGES } from '../utils/ticketRules.ts';
import { validateServiceApplication } from '../utils/siteMenuRules.ts';
import {
  CUSTOM_TIMED_VOUCHER_VALUE,
  DEFAULT_TILL_GATEWAY_TAG,
  TIMED_VOUCHER_TIER_OPTIONS,
  calculateDurationMinutes,
  formatDurationLabel,
  issuePartnerReceiptVoucher,
} from '../utils/voucherPortalRules.ts';
import { TillReceiptCard } from './TillReceiptCard.tsx';

interface ApplyViewProps {
  currentUser: UserSession | null;
  applications: ServiceApplication[];
  onSubmitApplication: (app: ServiceApplication) => void;
  defaultPackage?: string;
  issuedVouchers?: IssuedTimedVoucher[];
  onIssueVoucher?: (voucher: IssuedTimedVoucher) => void;
  onConnectVoucherOnPortal?: (voucher: IssuedTimedVoucher) => void;
}

const SERVICE_TYPES: ApplicationServiceType[] = [
  'Residential Fibre / Wireless',
  'Business Dedicated Internet',
  'Captive Hotspot Partner / Reseller',
  'Institutional Connectivity',
];

export const ApplyView: React.FC<ApplyViewProps> = ({
  currentUser,
  applications,
  onSubmitApplication,
  defaultPackage,
  issuedVouchers = [],
  onIssueVoucher,
  onConnectVoucherOnPortal,
}) => {
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [idNumber, setIdNumber] = useState(currentUser?.idNumber || '');
  const [addressArea, setAddressArea] = useState('');
  const [serviceType, setServiceType] = useState<ApplicationServiceType>(
    'Captive Hotspot Partner / Reseller'
  );
  const [packageSpeed, setPackageSpeed] = useState(
    defaultPackage || TIMED_VOUCHER_TIER_OPTIONS[1].value
  );
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRef, setSubmittedRef] = useState<ServiceApplication | null>(null);

  // Timed Hotspot Voucher & Tiller Receipt state (Period of Own Choice + vxk-GiyaniShop770)
  const [durationAmount, setDurationAmount] = useState<number>(3);
  const [durationUnit, setDurationUnit] = useState<VoucherDurationUnit>('hours');
  const [gatewayTag, setGatewayTag] = useState<string>(DEFAULT_TILL_GATEWAY_TAG);
  const [purchaseItem, setPurchaseItem] = useState<string>('Shop Purchase + Timed Hotspot Wi-Fi');
  const [voucherPriceZar, setVoucherPriceZar] = useState<string>('R8.00');
  const [voucherIssueError, setVoucherIssueError] = useState<string | null>(null);
  const [latestIssuedVoucher, setLatestIssuedVoucher] = useState<IssuedTimedVoucher | null>(
    issuedVouchers[0] || null
  );

  const isTimedTierSelected =
    packageSpeed === CUSTOM_TIMED_VOUCHER_VALUE ||
    TIMED_VOUCHER_TIER_OPTIONS.some((t) => t.value === packageSpeed);

  const handlePackageSpeedChange = (nextValue: string) => {
    setPackageSpeed(nextValue);
    const matchedTimed = TIMED_VOUCHER_TIER_OPTIONS.find((t) => t.value === nextValue);
    if (matchedTimed) {
      setDurationAmount(matchedTimed.durationAmount);
      setDurationUnit(matchedTimed.durationUnit);
      setVoucherPriceZar(matchedTimed.priceZar);
      setPurchaseItem(matchedTimed.label);
    } else if (nextValue === CUSTOM_TIMED_VOUCHER_VALUE) {
      setPurchaseItem('Custom Timed Hotspot Wi-Fi Pass');
      setVoucherPriceZar('Customer Choice');
    } else {
      const monthly = LINE_SPEED_PACKAGES.find((p) => p.value === nextValue);
      if (monthly) {
        setPurchaseItem(`Package Order: ${monthly.label}`);
        setVoucherPriceZar(`R${monthly.priceMonthlyZAR}.00`);
        setDurationAmount(30);
        setDurationUnit('days');
      }
    }
  };

  const issueAndRecordVoucher = () => {
    setVoucherIssueError(null);
    const matchedTimed = TIMED_VOUCHER_TIER_OPTIONS.find((t) => t.value === packageSpeed);
    const portalOrigin =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://vxktech.co.za/prepaid';

    const issued = issuePartnerReceiptVoucher({
      buyerName: fullName.trim() || 'Walk-in Shop Customer',
      buyerPhone: phone.trim() || undefined,
      purchaseItem: purchaseItem.trim() || packageSpeed,
      priceZar: voucherPriceZar.trim() || 'Included with Purchase',
      durationAmount,
      durationUnit,
      gatewayTag,
      gatewayIp: '192.168.1.1',
      portalZone: 'vxk_partner_portal',
      downMbps: matchedTimed?.downMbps || 20,
      upMbps: matchedTimed?.upMbps || 10,
      quotaMb: matchedTimed?.quotaMb,
      portalOrigin,
    });

    if (!issued.ok || !issued.voucher) {
      setVoucherIssueError(issued.error || 'Could not generate timed voucher.');
      return null;
    }

    setLatestIssuedVoucher(issued.voucher);
    onIssueVoucher?.(issued.voucher);
    return issued.voucher;
  };

  const handleIssueTillVoucher = () => {
    issueAndRecordVoucher();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedRef(null);
    const result = validateServiceApplication({
      fullName,
      phone,
      email,
      idNumber,
      addressArea,
      serviceType,
      packageSpeed,
      notes,
    });

    if (!result.valid || !result.application) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    onSubmitApplication(result.application);
    setSubmittedRef(result.application);
    if (isTimedTierSelected || serviceType === 'Captive Hotspot Partner / Reseller') {
      issueAndRecordVoucher();
    }
    setAddressArea('');
    setNotes('');
  };

  const previewDurationMins = calculateDurationMinutes(durationAmount, durationUnit);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="border rounded-2xl p-6 shadow-xl"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className="text-[11px] font-mono uppercase px-2 py-0.5 rounded border border-emerald-500/40"
            style={{ backgroundColor: '#146100', color: '#ffffff' }}
          >
            New Connection, Partner Tiller &amp; Timed Vouchers
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
            Gateway: {DEFAULT_TILL_GATEWAY_TAG} → pfSense+ Tower
          </span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <FilePlus2 className="w-6 h-6 text-emerald-400" />
          <span>APPLY &amp; PARTNER TIMED VOUCHER TILLER</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-3xl">
          Issue timed hotspot Wi-Fi connection vouchers for any customer-chosen period when buying
          from your business, with <strong>{DEFAULT_TILL_GATEWAY_TAG}</strong> printed on every
          tiller receipt as gateway to your tower <strong>pfSense+</strong> until time expires — or
          apply for uncapped Fibre &amp; Wireless installation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Application & Partner Tiller Form */}
        <div
          className="lg:col-span-7 border rounded-2xl p-6 shadow-xl space-y-5"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            Partner Voucher &amp; Online Application Form
          </h3>

          {submittedRef && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Application Submitted — Reference {submittedRef.reference}</span>
              </div>
              <p>
                Coverage &amp; provisioning queued for <strong>{submittedRef.addressArea}</strong> (
                {submittedRef.serviceType}).
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
            {/* div:nth-of-type(1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Full Name / Customer Buyer *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kagiso Molefe"
                    style={{ backgroundColor: '#060606' }}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Phone Number (SA 10-digits) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0824559102"
                    style={{ backgroundColor: '#060606' }}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* div:nth-of-type(2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.co.za"
                    style={{ backgroundColor: '#060606' }}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  RSA ID / Business Reg No. *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 9004125123081"
                    style={{ backgroundColor: '#060606' }}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {errors.idNumber && (
                  <p className="mt-1 text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.idNumber}
                  </p>
                )}
              </div>
            </div>

            {/* div:nth-of-type(3) -> div:nth-of-type(2) > select:nth-of-type(1) is Focus Mode Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Service Category *
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ApplicationServiceType)}
                  aria-label="Service Category"
                  style={{ backgroundColor: '#060606' }}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {SERVICE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Desired Speed / Hotspot Voucher Period *
                </label>
                <select
                  value={packageSpeed}
                  onChange={(e) => handlePackageSpeedChange(e.target.value)}
                  aria-label="Desired Speed Tier"
                  style={{ backgroundColor: '#060606' }}
                  className="w-full px-3 py-2.5 border border-emerald-500/70 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <optgroup label="Hotspot Wi-Fi Timed Connection (Period of Own Choice • vxk-GiyaniShop770)">
                    {TIMED_VOUCHER_TIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    <option value={CUSTOM_TIMED_VOUCHER_VALUE}>
                      Custom Period of Own Choice (Set Minutes / Hours / Days)
                    </option>
                  </optgroup>
                  <optgroup label="Monthly Uncapped Fibre & Wireless Tiers">
                    {LINE_SPEED_PACKAGES.map((pkg) => (
                      <option key={pkg.value} value={pkg.value}>
                        {pkg.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {errors.packageSpeed && (
                  <p className="mt-1 text-red-400">{errors.packageSpeed}</p>
                )}
              </div>
            </div>

            {/* Partner Purchase Timed Connection Voucher & Tiller Gateway Configuration */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-600/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs uppercase tracking-wider">
                  <Receipt className="w-4 h-4" />
                  <span>Partner Till Voucher (Period of Own Choice)</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black border border-emerald-500/50 text-emerald-300">
                  Gateway: {gatewayTag || DEFAULT_TILL_GATEWAY_TAG}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Period Duration *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={durationAmount}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 1);
                      setDurationAmount(val);
                      setPackageSpeed(CUSTOM_TIMED_VOUCHER_VALUE);
                    }}
                    aria-label="Voucher Duration Amount"
                    style={{ backgroundColor: '#060606' }}
                    className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Time Unit *
                  </label>
                  <select
                    value={durationUnit}
                    onChange={(e) => {
                      setDurationUnit(e.target.value as VoucherDurationUnit);
                      setPackageSpeed(CUSTOM_TIMED_VOUCHER_VALUE);
                    }}
                    aria-label="Voucher Duration Unit"
                    style={{ backgroundColor: '#060606' }}
                    className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Tiller Gateway ID
                  </label>
                  <div className="relative">
                    <Router className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-emerald-400" />
                    <input
                      type="text"
                      value={gatewayTag}
                      onChange={(e) => setGatewayTag(e.target.value)}
                      aria-label="Tiller Gateway Identifier"
                      style={{ backgroundColor: '#060606', color: '#18ff00' }}
                      className="w-full pl-8 pr-2.5 py-2 border border-slate-700 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Business Purchase Item / Reason
                  </label>
                  <input
                    type="text"
                    value={purchaseItem}
                    onChange={(e) => setPurchaseItem(e.target.value)}
                    placeholder="e.g. Shop Till Purchase + Wi-Fi Access"
                    style={{ backgroundColor: '#060606' }}
                    className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Receipt Amount (ZAR)
                  </label>
                  <input
                    type="text"
                    value={voucherPriceZar}
                    onChange={(e) => setVoucherPriceZar(e.target.value)}
                    placeholder="e.g. R10.00 or Free with Purchase"
                    style={{ backgroundColor: '#060606' }}
                    className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {voucherIssueError && (
                <p className="text-red-400 font-semibold">{voucherIssueError}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Selected Period:{' '}
                    <strong className="text-emerald-300">
                      {formatDurationLabel(previewDurationMins)}
                    </strong>{' '}
                    ({previewDurationMins} mins until auto-disconnect)
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleIssueTillVoucher}
                style={{ backgroundColor: '#146100', color: '#ffffff' }}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-400/60 font-bold text-xs hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                <Wifi className="w-4 h-4 text-emerald-300" />
                <span>
                  Issue Timed Voucher &amp; Print Tiller Receipt ({gatewayTag || DEFAULT_TILL_GATEWAY_TAG})
                </span>
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Physical Installation Address &amp; Suburb *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-cyan-400" />
                <input
                  type="text"
                  value={addressArea}
                  onChange={(e) => setAddressArea(e.target.value)}
                  placeholder="e.g. Giyani Section A or 870 Stanza Bopape Street, Arcadia"
                  style={{ backgroundColor: '#060606' }}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              {errors.addressArea && (
                <p className="mt-1 text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.addressArea}
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Installation / Router Access Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Building access, tower line-of-sight notes, or POS tiller integration notes..."
                style={{ backgroundColor: '#060606' }}
                className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              style={{ backgroundColor: '#00ff3e', color: '#000000' }}
              className="w-full py-3 px-5 rounded-xl font-black text-sm shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Submit Connection Application</span>
            </button>
          </form>
        </div>

        {/* Right: Printable Tiller Receipt + Issued Vouchers & Submitted Applications */}
        <div className="lg:col-span-5 space-y-6">
          {latestIssuedVoucher ? (
            <div
              className="border rounded-2xl p-5 shadow-xl space-y-3"
              style={{ backgroundColor: '#000000', borderColor: '#13e511' }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Tiller Printed Connection Voucher</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/60">
                  {latestIssuedVoucher.gatewayTag}
                </span>
              </div>
              <TillReceiptCard
                voucher={latestIssuedVoucher}
                onConnectVoucher={onConnectVoucherOnPortal}
              />
            </div>
          ) : (
            <div
              className="border rounded-2xl p-5 shadow-xl space-y-2 text-xs"
              style={{ backgroundColor: '#000000', borderColor: '#232323' }}
            >
              <div className="flex items-center gap-2 font-bold text-white">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Tiller Receipt Preview ({DEFAULT_TILL_GATEWAY_TAG})</span>
              </div>
              <p className="text-slate-400 leading-relaxed m-0">
                Select any period from <strong>Desired Speed / Hotspot Voucher Period</strong> (or
                enter a custom duration) and click <strong>Issue Timed Voucher &amp; Print Tiller Receipt</strong>{' '}
                to generate a printable thermal slip linked to <strong>pfSense+</strong> on your tower.
              </p>
            </div>
          )}

          {issuedVouchers.length > 0 && (
            <div
              className="border rounded-2xl p-5 shadow-xl space-y-3"
              style={{ backgroundColor: '#000000', borderColor: '#232323' }}
            >
              <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
                Recent Tiller Vouchers Issued ({issuedVouchers.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {issuedVouchers.slice(0, 5).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setLatestIssuedVoucher(v)}
                    className="w-full text-left p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 text-xs flex items-center justify-between gap-2 transition"
                  >
                    <div>
                      <div className="font-mono font-bold text-emerald-300">{v.displayCode}</div>
                      <div className="text-[11px] text-slate-400">
                        {v.buyerName} • {v.periodLabel} • {v.gatewayTag}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 shrink-0">
                      View Slip
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="border rounded-2xl p-6 shadow-xl space-y-4"
            style={{ backgroundColor: '#000000', borderColor: '#232323' }}
          >
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Submitted Applications Queue ({applications.length})</span>
            </h3>

            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-cyan-300">{app.reference}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                      {app.status}
                    </span>
                  </div>
                  <div className="font-bold text-white">
                    {app.fullName} •{' '}
                    <span className="text-slate-400 font-normal">{app.serviceType}</span>
                  </div>
                  <div className="text-slate-300">{app.packageSpeed}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{app.addressArea}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Logged: {app.submittedAt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

