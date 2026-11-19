import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Send,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { UserSession, VoucherReport } from '../types/index.ts';
import { validateVoucherCode } from '../utils/ticketRules.ts';

interface VoucherReportingViewProps {
  currentUser: UserSession | null;
  voucherReports: VoucherReport[];
  onSubmitVoucherReport: (report: VoucherReport) => void;
  onOpenFaultWithVoucher: (voucherCode: string) => void;
}

export const VoucherReportingView: React.FC<VoucherReportingViewProps> = ({
  currentUser,
  voucherReports,
  onSubmitVoucherReport,
  onOpenFaultWithVoucher,
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [accountNumber, setAccountNumber] = useState(currentUser?.accountNumber || '');
  const [errorType, setErrorType] = useState('Already Used / Session Stuck');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentUser?.accountNumber) {
      setAccountNumber(currentUser.accountNumber);
    }
  }, [currentUser]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'ok' | 'error' | 'replaced';
    message: string;
  } | null>(null);

  const errorTypes = [
    'Already Used / Session Stuck (ERR-VOUCH-303)',
    'Invalid PIN rejected at captive portal',
    'Voucher expired prior to first use',
    'Incorrect speed / data package delivered',
    'Purchased from vendor but unprinted/faded barcode',
  ];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateVoucherCode(voucherCode);
    if (!check.isValid) {
      setVerificationResult({
        status: 'error',
        message: check.error || 'Invalid voucher code format.',
      });
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      // Simulate verification result
      if (check.normalized.endsWith('999')) {
        setVerificationResult({
          status: 'ok',
          message: 'Voucher valid! 10GB Public Hotspot loaded onto account balance.',
        });
      } else {
        setVerificationResult({
          status: 'error',
          message: `Voucher ${check.normalized} is flagged with error: ${errorType}. A support ticket or auto-replacement can be created.`,
        });
      }
    }, 500);
  };

  const handleCreateReport = () => {
    if (!voucherCode.trim()) return;
    const newReport: VoucherReport = {
      id: `VR-${Date.now().toString().slice(-4)}`,
      code: voucherCode.trim().toUpperCase(),
      reportedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      accountNumber: accountNumber.trim(),
      errorType,
      status: 'Pending',
      notes: notes.trim() || 'Customer reported faulty voucher PIN via online portal.',
    };
    onSubmitVoucherReport(newReport);
    setVerificationResult({
      status: 'replaced',
      message: `Voucher report ${newReport.id} registered! NOC has initiated automated MAC release.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="border rounded-2xl p-6 shadow-xl"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
            Vending & Recharge NOC
          </span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-amber-400" />
          <span>VOUCHER CODE REPORTING & DIAGNOSTICS</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Bought a prepaid voucher or hotspot scratch card that doesn't work? Test the code against our
          vending switch or report stuck sessions for immediate replacement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification and Report Tool */}
        <div
          className="lg:col-span-7 border rounded-2xl p-6 shadow-xl space-y-5"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Verify or Report Voucher Code</span>
          </h3>

          <form onSubmit={handleVerify} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                PREPAID VOUCHER CODE / PIN:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="e.g. VXK-7712-9901-4421 or 16-digit PIN"
                  style={{ backgroundColor: '#060606', color: '#18ff00' }}
                  className="w-full pl-3 pr-24 py-2.5 border border-slate-700 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={isVerifying || !voucherCode.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Test Code</span>
                  )}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Printed on your POS receipt, SMS top-up, or physical scratch voucher.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  ACCOUNT NUMBER:
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. VXK-8421"
                  style={{ backgroundColor: '#060606' }}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl font-mono text-cyan-300 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  REPORTED ERROR TYPE:
                </label>
                <select
                  value={errorType}
                  onChange={(e) => setErrorType(e.target.value)}
                  style={{ backgroundColor: '#060606' }}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                >
                  {errorTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                ADDITIONAL DETAILS / VENDOR LOCATION:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Where was the voucher purchased and what exact error appeared on your screen?"
                style={{ backgroundColor: '#060606' }}
                className="w-full p-3 border border-slate-700 rounded-xl text-white text-xs focus:outline-none resize-none"
              />
            </div>

            {verificationResult && (
              <div
                className={`p-4 rounded-xl border text-xs ${
                  verificationResult.status === 'ok'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                    : verificationResult.status === 'replaced'
                    ? 'bg-blue-950/60 border-blue-800 text-blue-200'
                    : 'bg-amber-950/60 border-amber-800 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {verificationResult.status === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{verificationResult.message}</p>
                    {verificationResult.status === 'error' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleCreateReport}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition"
                        >
                          Log Voucher Replacement Request
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenFaultWithVoucher(voucherCode)}
                          className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 font-semibold text-xs transition"
                        >
                          Open Fault Report Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Recent Voucher Reports */}
        <div
          className="lg:col-span-5 border rounded-2xl p-6 shadow-xl space-y-4"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Recent Voucher Inquiries</span>
          </h3>

          <div className="space-y-3">
            {voucherReports.map((vr) => (
              <div
                key={vr.id}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-300 font-semibold">{vr.code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {vr.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">{vr.errorType}</div>
                <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-700/50">
                  <span>Acc: {vr.accountNumber}</span>
                  <span>{vr.reportedAt}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40 text-[11px] text-slate-400">
            <strong>Voucher Policy:</strong> Stuck MAC sessions are cleared within 15 minutes
            automatically. If a store voucher is defective, our vending audit will verify the barcode
            and issue replacement airtime to your phone.
          </div>
        </div>
      </div>
    </div>
  );
};
