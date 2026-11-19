import React, { useState } from 'react';
import {
  Wifi,
  Zap,
  ShieldCheck,
  Building2,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Ticket,
  KeyRound,
  Newspaper,
  FilePlus2,
  PhoneCall,
  Users,
} from 'lucide-react';
import { VXK_FAQS, VXK_TESTIMONIALS } from '../data/seedData.ts';

interface HomeViewProps {
  onSelectTab: (tab: string) => void;
  onOpenReportOverlay: () => void;
  activeTicketCount: number;
  partnerDeviceCount: number;
  liveUsersCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTab,
  onOpenReportOverlay,
  activeTicketCount,
  partnerDeviceCount,
  liveUsersCount,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div
        className="border rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
        style={{
          backgroundColor: '#000000',
          borderColor: '#13e511',
          borderWidth: '2px',
        }}
      >
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded border border-emerald-500/40"
              style={{ backgroundColor: '#146100', color: '#ffffff' }}
            >
              VXK TECH • South Africa
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-black/70 px-2.5 py-0.5 rounded border border-emerald-500/40">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: '#00f302' }}
              />
              {liveUsersCount} Live Hotspot Users Online
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Stay Connected, Anytime, Anywhere with <span className="text-cyan-400">VXK Tech</span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Uncapped prepaid fibre, fixed wireless broadband, multi-brand captive Wi-Fi hotspots
            governed by <strong>pfSense+ Master Authority</strong>, and real-time NOC fault support
            across Pretoria, Soweto, Midrand, Tembisa, and surrounding hubs.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => onSelectTab('buy-pay')}
              style={{ backgroundColor: '#00ff3e', color: '#000000' }}
              className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm inline-flex items-center gap-2 hover:brightness-110 transition shadow-lg"
            >
              <Zap className="w-4 h-4" />
              <span>Explore Packages (From R350pm)</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('apply')}
              style={{ backgroundColor: '#329f00', color: '#ffffff' }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 hover:brightness-110 transition"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Apply for Installation</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('voucher-portal')}
              style={{ backgroundColor: '#146100', color: '#ffffff' }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 border border-emerald-500/60 hover:brightness-110 transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Enter Voucher Code (192.168.1.1)</span>
            </button>

            <button
              type="button"
              onClick={onOpenReportOverlay}
              style={{ backgroundColor: '#ff0000', color: '#ffffff' }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 hover:brightness-110 transition"
            >
              <Ticket className="w-4 h-4" />
              <span>Report Fault Ticket</span>
            </button>
          </div>
        </div>

        {/* Live Portal Summary Grid */}
        <div className="grid grid-cols-2 gap-3 w-full lg:w-80 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('wifi-partners')}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-left transition"
          >
            <div className="text-[11px] uppercase text-slate-400 font-bold">Partner Gateways</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{partnerDeviceCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">12 Brands Supported</div>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('wifi-partners')}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-left transition"
          >
            <div className="text-[11px] uppercase text-slate-400 font-bold">Live Sessions</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{liveUsersCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">pfSense+ Real-Time</div>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('fault-ticket')}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-left transition"
          >
            <div className="text-[11px] uppercase text-slate-400 font-bold">Open Faults</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{activeTicketCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">NOC Dispatch Desk</div>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('pricing')}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-left transition"
          >
            <div className="text-[11px] uppercase text-slate-400 font-bold">Uncapped Plans</div>
            <div className="text-2xl font-black text-white mt-1">R350+</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Zero Throttling</div>
          </button>
        </div>
      </div>

      {/* Quick Portal Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'captive-wifi',
            title: 'Register Captive WiFi',
            desc: 'Scan directly connected routers & sync with pfSense+ Master.',
            icon: Wifi,
            accent: 'text-cyan-400',
          },
          {
            id: 'voucher',
            title: 'Voucher Reporting',
            desc: 'Validate PINs & resolve captive voucher redemption errors.',
            icon: KeyRound,
            accent: 'text-amber-400',
          },
          {
            id: 'public-news',
            title: 'Public News & NOC',
            desc: 'Read maintenance windows, tower upgrades & outage alerts.',
            icon: Newspaper,
            accent: 'text-emerald-400',
          },
          {
            id: 'contact',
            title: 'Contact & VXK-CALL',
            desc: 'Arcadia HQ (+27 75 444 8267) & 15-min tech callbacks.',
            icon: PhoneCall,
            accent: 'text-rose-400',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectTab(card.id)}
              style={{ backgroundColor: '#000000', borderColor: '#232323' }}
              className="border rounded-2xl p-5 text-left hover:border-cyan-500/50 transition group space-y-2 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${card.accent}`} />
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
              </div>
              <div className="font-bold text-white text-sm">{card.title}</div>
              <p className="text-xs text-slate-400">{card.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Testimonials */}
      <div
        className="border rounded-2xl p-6 shadow-xl space-y-4"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>What Our Community Says</span>
          </h2>
          <button
            type="button"
            onClick={() => onSelectTab('portfolio')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            View Project Showcase →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {VXK_TESTIMONIALS.map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3"
            >
              <p className="text-xs text-slate-300 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              <div>
                <div className="text-xs font-bold text-white">{item.name}</div>
                <div className="text-[11px] text-cyan-400">{item.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div
        className="border rounded-2xl p-6 shadow-xl space-y-4"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Frequently Asked Questions</span>
          </h2>
          <span className="text-[11px] text-slate-400">Fibre • Wireless • Prepaid Vouchers</span>
        </div>

        <div className="space-y-2.5">
          {VXK_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:bg-slate-800/60 transition"
                >
                  <span>
                    0{idx + 1}. {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 text-xs text-slate-300 border-t border-slate-800/70 pt-2.5 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
