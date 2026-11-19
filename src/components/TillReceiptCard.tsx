import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Wifi,
  Clock,
  Router,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { IssuedTimedVoucher } from '../types/index.ts';

interface TillReceiptCardProps {
  voucher: IssuedTimedVoucher;
  onConnectVoucher?: (voucher: IssuedTimedVoucher) => void;
}

export const TillReceiptCard: React.FC<TillReceiptCardProps> = ({
  voucher,
  onConnectVoucher,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(voucher.receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3">
      {/* Thermal 80mm Printable Till Receipt */}
      <div
        className="till-receipt-printable rounded-xl border-2 border-dashed border-emerald-500/70 bg-white text-slate-950 p-4 font-mono text-xs shadow-xl"
        data-testid="till-receipt-card"
      >
        <div className="text-center border-b border-dashed border-slate-400 pb-2.5 space-y-0.5">
          <div className="text-sm font-black tracking-tight uppercase">
            VXK TECH HOTSPOT PARTNER
          </div>
          <div className="text-[11px] font-bold bg-slate-900 text-emerald-300 px-2 py-0.5 rounded inline-block">
            GATEWAY: {voucher.gatewayTag}
          </div>
          <div className="text-[10px] text-slate-600">
            Tower Authority: {voucher.towerHost} (pfSense+)
          </div>
        </div>

        <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
          <div className="flex justify-between gap-2">
            <span className="text-slate-600">RECEIPT NO:</span>
            <span className="font-bold">{voucher.receiptNumber}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600">ISSUED:</span>
            <span>{voucher.issuedAtDisplay}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600">CUSTOMER:</span>
            <span className="font-bold text-right">{voucher.buyerName}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600">PURCHASE:</span>
            <span className="text-right">{voucher.purchaseItem}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600">AMOUNT:</span>
            <span className="font-bold">{voucher.priceZar}</span>
          </div>
        </div>

        <div className="py-3 border-b border-dashed border-slate-400 text-center space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Wi-Fi Connection Voucher Code
          </div>
          <div
            className="text-base sm:text-lg font-black tracking-wider bg-slate-100 border border-slate-400 rounded px-2 py-1.5 select-all"
            data-testid="till-voucher-code"
          >
            {voucher.displayCode}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
            <Clock className="w-3.5 h-3.5" />
            <span>
              TIMED PERIOD: {voucher.periodLabel} ({voucher.durationMinutes} mins)
            </span>
          </div>
          <div className="text-[10px] text-slate-700">
            Speed: {voucher.downMbps}/{voucher.upMbps} Mbps • Active until time is up
          </div>
        </div>

        <div className="pt-2.5 space-y-1 text-[10px] text-slate-700">
          <div className="flex items-center justify-between gap-2 font-bold text-slate-900">
            <span className="inline-flex items-center gap-1">
              <Router className="w-3 h-3" />
              GATEWAY TO VOUCHER:
            </span>
            <span>{voucher.gatewayTag}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>pfSense+ Tower Router:</span>
            <span>
              {voucher.gatewayIp} ({voucher.portalZone})
            </span>
          </div>
          <div className="break-all bg-slate-100 p-1.5 rounded border border-slate-300 text-[10px]">
            Portal Link: {voucher.portalLoginUrl}
          </div>
          <p className="text-center text-[10px] pt-1 text-slate-600 leading-snug m-0">
            Connect to VXK Hotspot Wi-Fi, select gateway <strong>{voucher.gatewayTag}</strong>, and
            enter voucher code above. Access disconnects automatically when time expires.
          </p>
        </div>
      </div>

      {/* Receipt Actions (hidden during thermal print) */}
      <div className="no-print flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Tiller Receipt</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Slip'}</span>
        </button>

        {onConnectVoucher && (
          <button
            type="button"
            onClick={() => onConnectVoucher(voucher)}
            className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Connect Voucher on pfSense+ ({voucher.gatewayTag})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="no-print flex items-center gap-1.5 text-[11px] text-slate-400">
        <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          Every printed receipt embeds <strong>{voucher.gatewayTag}</strong> as gateway link to tower{' '}
          <strong>pfSense+</strong>.
        </span>
      </div>
    </div>
  );
};
