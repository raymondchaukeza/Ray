import React, { useState } from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Send,
  Headphones,
} from 'lucide-react';
import { UserSession } from '../types/index.ts';

interface ContactViewProps {
  currentUser: UserSession | null;
  onOpenReportOverlay: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({
  currentUser,
  onOpenReportOverlay,
}) => {
  const [callRequestPhone, setCallRequestPhone] = useState(currentUser?.phone || '');
  const [callTopic, setCallTopic] = useState('Fiber outage / Red LOS light');
  const [callRequested, setCallRequested] = useState(false);

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callRequestPhone.trim()) return;
    setCallRequested(true);
    setTimeout(() => {
      setCallRequested(false);
    }, 7000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="border rounded-2xl p-6 shadow-xl"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <PhoneCall className="w-6 h-6 text-cyan-400" />
          <span>CONTACT US & VXK NOC DESK</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          VXK Tech Prepaid Internet support engineers are on standby for fiber fault repairs,
          vending machine inquiries, and public hotspot captive Wi-Fi assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contact Info Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div
            className="border rounded-2xl p-6 shadow-xl space-y-4"
            style={{ backgroundColor: '#000000', borderColor: '#232323' }}
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Headphones className="w-4 h-4 text-cyan-400" />
              <span>Direct Support Channels</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-700/60"
                style={{ backgroundColor: '#080808' }}
              >
                <PhoneCall className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">VXK Tech Sales &amp; NOC Desk</div>
                  <div className="font-mono text-cyan-300 mt-0.5">+27 75 444 8267 / +27 75 434 0018</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Mon - Fri: 09:00 - 18:00 • Sat: 10:00 - 16:00 SAST
                  </div>
                </div>
              </div>

              <div
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-700/60"
                style={{ backgroundColor: '#080808' }}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">WhatsApp Fast Support Desk</div>
                  <div className="font-mono text-emerald-300 mt-0.5">+27 75 444 8267</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    For quick voucher swaps, coverage checks &amp; router photos
                  </div>
                </div>
              </div>

              <div
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-700/60"
                style={{ backgroundColor: '#080808' }}
              >
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Support &amp; Billing Email</div>
                  <div className="font-mono text-blue-300 mt-0.5">
                    info@vxktech.co.za / support@vxktech.co.za
                  </div>
                </div>
              </div>

              <div
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-700/60"
                style={{ backgroundColor: '#080808' }}
              >
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Head Office &amp; Regional Operations</div>
                  <div className="text-slate-300 mt-0.5">
                    870 Stanza Bopape Street, Lisdogon Park, Arcadia, Gauteng 0001, South Africa
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VXK-CALL-v0.2.0 Module */}
        <div
          className="lg:col-span-6 border rounded-2xl p-6 shadow-xl space-y-4"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>VXK-CALL-v0.2.0 (Direct Technician Callback)</span>
            </h3>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              Interactive
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Need urgent voice assistance? Request an automated callback from the next available
            field engineer on duty.
          </p>

          {callRequested ? (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Callback Queued Successfully!</span>
              </div>
              <p>
                A VXK NOC technician will ring <strong className="font-mono">{callRequestPhone}</strong> within 15 minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestCallback} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Your Phone Number (SA 10-digits):
                </label>
                <input
                  type="text"
                  value={callRequestPhone}
                  onChange={(e) => setCallRequestPhone(e.target.value)}
                  placeholder="e.g. 0824559102"
                  style={{ backgroundColor: '#060606' }}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Topic of Technical Assistance:
                </label>
                <select
                  value={callTopic}
                  onChange={(e) => setCallTopic(e.target.value)}
                  style={{ backgroundColor: '#060606' }}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="Fiber outage / Red LOS light">Fiber outage / Red LOS light</option>
                  <option value="Voucher not granting internet access">Voucher not granting internet access</option>
                  <option value="Captive hotspot device binding failure">Captive hotspot device binding failure</option>
                  <option value="Account recharge & payment confirmation">Account recharge & payment confirmation</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!callRequestPhone.trim()}
                style={{ backgroundColor: '#00ff3e', color: '#000000' }}
                className="w-full py-3 px-4 rounded-xl disabled:opacity-50 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 hover:brightness-110"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Request VXK-CALL Dispatch</span>
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              onClick={onOpenReportOverlay}
              className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 font-semibold"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Or click here to submit formal Fault Report Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
