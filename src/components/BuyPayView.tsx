import React, { useState } from 'react';
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Wifi,
  Download,
  Upload,
  Receipt,
  Clock,
  Router,
} from 'lucide-react';
import { LINE_SPEED_PACKAGES } from '../utils/ticketRules.ts';
import {
  IssuedTimedVoucher,
  UserSession,
  VoucherDurationUnit,
} from '../types/index.ts';
import {
  DEFAULT_TILL_GATEWAY_TAG,
  TIMED_VOUCHER_TIER_OPTIONS,
  calculateDurationMinutes,
  formatDurationLabel,
  issuePartnerReceiptVoucher,
} from '../utils/voucherPortalRules.ts';
import { TillReceiptCard } from './TillReceiptCard.tsx';

interface BuyPayViewProps {
  currentUser: UserSession | null;
  onSelectPlanForTicket: (planValue: string) => void;
  onOpenReportOverlay: () => void;
  onIssueVoucher?: (voucher: IssuedTimedVoucher) => void;
  onConnectVoucherOnPortal?: (voucher: IssuedTimedVoucher) => void;
}

export const BuyPayView: React.FC<BuyPayViewProps> = ({
  currentUser,
  onSelectPlanForTicket,
  onOpenReportOverlay,
  onIssueVoucher,
  onConnectVoucherOnPortal,
}) => {
  const [selectedPlan] = useState<string>(currentUser?.lineSpeed || '10/5Mbps @R900pm');
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState<string>(currentUser?.name || '');
  const [purchaseItem, setPurchaseItem] = useState<string>('Store Purchase + Timed Wi-Fi Voucher');
  const [durationAmount, setDurationAmount] = useState<number>(3);
  const [durationUnit, setDurationUnit] = useState<VoucherDurationUnit>('hours');
  const [gatewayTag, setGatewayTag] = useState<string>(DEFAULT_TILL_GATEWAY_TAG);
  const [customAmountZar, setCustomAmountZar] = useState<string>('R8.00');
  const [issuedReceipt, setIssuedReceipt] = useState<IssuedTimedVoucher | null>(null);

  const generateReceipt = (opts: {
    item: string;
    priceZar: string;
    amount: number;
    unit: VoucherDurationUnit;
    downMbps?: number;
    upMbps?: number;
  }) => {
    const portalOrigin =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://vxktech.co.za/prepaid';
    const res = issuePartnerReceiptVoucher({
      buyerName: buyerName.trim() || 'Shop Customer',
      buyerPhone: currentUser?.phone,
      purchaseItem: opts.item,
      priceZar: opts.priceZar,
      durationAmount: opts.amount,
      durationUnit: opts.unit,
      gatewayTag,
      gatewayIp: '192.168.1.1',
      portalZone: 'vxk_partner_portal',
      downMbps: opts.downMbps ?? 20,
      upMbps: opts.upMbps ?? 10,
      portalOrigin,
    });
    if (res.ok && res.voucher) {
      setIssuedReceipt(res.voucher);
      onIssueVoucher?.(res.voucher);
      setPaymentSuccess(
        `Till Receipt ${res.voucher.receiptNumber} issued with voucher ${res.voucher.displayCode} (${res.voucher.periodLabel}) via gateway ${res.voucher.gatewayTag}!`
      );
    }
  };

  const handleSimulatePayment = (
    planValue: string,
    price: number,
    downMbps: number,
    upMbps: number
  ) => {
    generateReceipt({
      item: planValue,
      priceZar: `R${price}.00`,
      amount: 30,
      unit: 'days',
      downMbps,
      upMbps,
    });
  };

  const handleIssueCustomTimed = (e: React.FormEvent) => {
    e.preventDefault();
    generateReceipt({
      item: purchaseItem.trim() || 'Partner Purchase Wi-Fi Access',
      priceZar: customAmountZar.trim() || 'Included with Purchase',
      amount: durationAmount,
      unit: durationUnit,
    });
  };

  const previewMins = calculateDurationMinutes(durationAmount, durationUnit);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="border rounded-2xl p-6 shadow-xl"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-[11px] font-mono uppercase bg-blue-500/20 text-cyan-300 px-2 py-0.5 rounded border border-blue-500/30">
            Drupal Node / 8
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
            Till Gateway: {DEFAULT_TILL_GATEWAY_TAG} → Tower pfSense+
          </span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <span>BUY / PAY &amp; PARTNER TILL VOUCHERS</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-3xl">
          Every business purchase or package recharge issues a timed Wi-Fi connection voucher for
          any period of own choice, printing <strong>{DEFAULT_TILL_GATEWAY_TAG}</strong> on the
          tiller receipt to link straight to <strong>pfSense+</strong> on your tower until time expires.
        </p>
      </div>

      {paymentSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{paymentSuccess}</span>
        </div>
      )}

      {/* Partner POS / Tiller Timed Voucher Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleIssueCustomTimed}
          className="lg:col-span-7 border rounded-2xl p-6 shadow-xl space-y-4 text-xs"
          style={{ backgroundColor: '#000000', borderColor: '#13e511' }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Partner Shop Tiller — Issue Timed Connection Voucher</span>
            </h3>
            <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/50">
              {gatewayTag}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TIMED_VOUCHER_TIER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setDurationAmount(opt.durationAmount);
                  setDurationUnit(opt.durationUnit);
                  setCustomAmountZar(opt.priceZar);
                  setPurchaseItem(opt.label);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition"
              >
                {formatDurationLabel(opt.durationMinutes)} ({opt.priceZar})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Customer / Buyer Name
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Walk-in Customer"
                style={{ backgroundColor: '#060606' }}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Purchase Item / Note
              </label>
              <input
                type="text"
                value={purchaseItem}
                onChange={(e) => setPurchaseItem(e.target.value)}
                style={{ backgroundColor: '#060606' }}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Period
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={durationAmount}
                onChange={(e) => setDurationAmount(Math.max(1, Number(e.target.value) || 1))}
                style={{ backgroundColor: '#060606' }}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Unit
              </label>
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as VoucherDurationUnit)}
                style={{ backgroundColor: '#060606' }}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white focus:outline-none"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Amount (ZAR)
              </label>
              <input
                type="text"
                value={customAmountZar}
                onChange={(e) => setCustomAmountZar(e.target.value)}
                style={{ backgroundColor: '#060606' }}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Till Gateway
              </label>
              <div className="relative">
                <Router className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-emerald-400" />
                <input
                  type="text"
                  value={gatewayTag}
                  onChange={(e) => setGatewayTag(e.target.value)}
                  style={{ backgroundColor: '#060606', color: '#18ff00' }}
                  className="w-full pl-8 pr-2 py-2 border border-slate-700 rounded-xl font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Voucher stays active for{' '}
              <strong className="text-emerald-300">{formatDurationLabel(previewMins)}</strong> (
              {previewMins} mins) then disconnects when time is up.
            </span>
          </div>

          <button
            type="submit"
            style={{ backgroundColor: '#00ff3e', color: '#000000' }}
            className="w-full py-3 px-4 rounded-xl font-black text-sm hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Generate Connection Voucher &amp; Till Receipt ({gatewayTag})</span>
          </button>
        </form>

        <div
          className="lg:col-span-5 border rounded-2xl p-5 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          {issuedReceipt ? (
            <TillReceiptCard
              voucher={issuedReceipt}
              onConnectVoucher={onConnectVoucherOnPortal}
            />
          ) : (
            <div className="text-xs text-slate-400 space-y-2 py-4 text-center">
              <Receipt className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-white m-0">
                Tiller Receipt Preview ({DEFAULT_TILL_GATEWAY_TAG})
              </p>
              <p className="m-0">
                Click <strong>Recharge Package</strong> below or generate any custom period above to
                print the customer&apos;s tiller receipt with gateway{' '}
                <strong className="text-emerald-300">{DEFAULT_TILL_GATEWAY_TAG}</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LINE_SPEED_PACKAGES.map((pkg) => {
          const isSelected = selectedPlan === pkg.value;
          return (
            <div
              key={pkg.value}
              style={{
                backgroundColor: '#000000',
                borderColor: pkg.popular ? '#13e511' : isSelected ? '#38bdf8' : '#232323',
                borderWidth: pkg.popular ? '2px' : '1px',
              }}
              className={`rounded-2xl p-6 border transition-all flex flex-col justify-between relative shadow-xl ${
                pkg.popular ? 'shadow-emerald-500/10' : ''
              }`}
            >
              {pkg.popular && (
                <span
                  style={{ backgroundColor: '#00ff3e', color: '#000000' }}
                  className="absolute -top-3 right-6 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider"
                >
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {pkg.type}
                  </span>
                  <Wifi className="w-4 h-4 text-cyan-400" />
                </div>

                <h3 className="text-lg font-black text-white mb-1">{pkg.value.split('@')[0].trim()}</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-black text-white">R{pkg.priceMonthlyZAR}</span>
                  <span className="text-xs text-slate-400 font-medium">/ month (ZAR)</span>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Download Speed:
                    </span>
                    <span className="font-bold text-white">{pkg.downMbps} Mbps</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      Upload Speed:
                    </span>
                    <span className="font-bold text-white">{pkg.upMbps} Mbps</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Data Allowance:</span>
                    <span className="text-emerald-400 font-semibold">Uncapped & Unshaped</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Till Gateway:</span>
                    <span className="font-mono text-emerald-300">{DEFAULT_TILL_GATEWAY_TAG}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSimulatePayment(
                      pkg.value,
                      pkg.priceMonthlyZAR,
                      pkg.downMbps,
                      pkg.upMbps
                    )
                  }
                  style={
                    pkg.popular
                      ? { backgroundColor: '#00ff3e', color: '#000000' }
                      : { backgroundColor: '#161616', borderColor: '#333333' }
                  }
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border ${
                    pkg.popular
                      ? 'hover:brightness-110 shadow-lg'
                      : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${pkg.popular ? 'text-black' : 'text-amber-400'}`} />
                  <span>Recharge Package &amp; Print Till Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectPlanForTicket(pkg.value);
                    onOpenReportOverlay();
                  }}
                  className="w-full text-center text-[11px] text-slate-400 hover:text-red-400 transition py-1"
                >
                  Report issue with this line speed →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

