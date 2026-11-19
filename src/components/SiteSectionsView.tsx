import React, { useState } from 'react';
import {
  Info,
  Sparkles,
  Server,
  CreditCard,
  FolderKanban,
  Users,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Download,
  Upload,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PortfolioCategory } from '../types/index.ts';
import {
  INITIAL_PORTFOLIO_PROJECTS,
  VXK_SERVICE_OFFERINGS,
  VXK_TEAM_MEMBERS,
} from '../data/seedData.ts';
import { LINE_SPEED_PACKAGES } from '../utils/ticketRules.ts';
import { filterPortfolioProjects } from '../utils/siteMenuRules.ts';

interface SiteSectionsViewProps {
  section: 'about' | 'features' | 'services' | 'pricing' | 'portfolio' | 'team';
  onSelectTab: (tab: string) => void;
  onApplyWithPlan: (planValue: string) => void;
}

const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  'All Installations',
  'Fibre',
  'Wireless',
  'Voucher Hotspots',
  'IT Support',
];

const FEATURE_TABS = [
  {
    id: '01',
    title: 'Monthly Internet Packages',
    subtitle: 'Fibre & Wireless',
    summary:
      'Uncapped residential and business broadband from 6/3Mbps (R350pm) to 20/10Mbps Public Hot Spot links (R1,050pm) with zero throttling and free router inclusion.',
    highlights: [
      '100% uncapped with zero Fair Usage throttling',
      'Once-off R2,500 installation includes free Wi-Fi router & 30 days free (6Mbps)',
      'Fast failover between Fibre GPON and wireless backhaul',
    ],
    ctaLabel: 'View Monthly Pricing',
    ctaTab: 'pricing',
  },
  {
    id: '02',
    title: 'Voucher System',
    subtitle: 'Pay-As-You-Go WiFi',
    summary:
      'Instant prepaid captive portal vouchers across 12 router brands synced via the VXK portal with pfSense+ acting as Master Voucher Authority.',
    highlights: [
      'Supports MikroTik, UniFi, TP-Link Omada, Cisco Meraki, Aruba, Ruckus & more',
      'Real-time MAC authorization and live connected subscriber telemetry',
      'Instant voucher replacement & fault reporting via NOC desk',
    ],
    ctaLabel: 'Open Wi-Fi Partners',
    ctaTab: 'wifi-partners',
  },
  {
    id: '03',
    title: '24/7 Support & NOC',
    subtitle: 'Optimal Uptime',
    summary:
      '24/7 network health checks, proactive optical signal monitoring, and dedicated field dispatch engineers across Pretoria, Midrand, Soweto, and Tembisa.',
    highlights: [
      'Direct Fault Ticket tracking from Pending -> Investigating -> Dispatched -> Resolved',
      'Interactive VXK-CALL technician callback within 15 minutes',
      'Real-time public maintenance bulletins and outage notifications',
    ],
    ctaLabel: 'Open Support Desk',
    ctaTab: 'fault-ticket',
  },
  {
    id: '04',
    title: 'Business Solutions',
    subtitle: 'Dedicated Links',
    summary:
      'Contention-free dedicated optical and point-to-point wireless circuits tailored for offices, schools, clinics, and commercial hotspot hubs.',
    highlights: [
      'Managed pfSense+ firewalls and redundant routing',
      'Multi-site Wi-Fi hotspot revenue & voucher partner dashboard',
      'On-site survey & turnkey hardware provisioning',
    ],
    ctaLabel: 'Apply for Business Link',
    ctaTab: 'apply',
  },
];

export const SiteSectionsView: React.FC<SiteSectionsViewProps> = ({
  section,
  onSelectTab,
  onApplyWithPlan,
}) => {
  const [activeFeatureIdx, setActiveFeatureIdx] = useState(0);
  const [portfolioCategory, setPortfolioCategory] =
    useState<PortfolioCategory>('All Installations');

  if (section === 'about') {
    return (
      <div className="space-y-6">
        <div
          className="border rounded-2xl p-6 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <span className="text-[11px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
            About VXK Tech
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1.5">
            <Info className="w-6 h-6 text-cyan-400" />
            <span>ABOUT VXK TECH PREPAID INTERNET</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Headquartered at 870 Stanza Bopape Street, Lisdogon Park, Arcadia, Gauteng, VXK Tech
            delivers reliable uncapped Fibre, Fixed Wireless, Managed IT Support, and Prepaid Wi-Fi
            Voucher Hotspot infrastructure for South African homes, businesses, and institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'Our Mission',
              body: 'Bridge digital connectivity gaps with transparent month-to-month uncapped broadband and pay-as-you-go community Wi-Fi hotspots without lock-in contracts.',
            },
            {
              title: 'NOC & Infrastructure',
              body: 'Powered by redundant optical backbones in Arcadia and Pretoria, multi-brand captive gateways, and centralized pfSense+ Master authentication.',
            },
            {
              title: 'Proactive Reliability',
              body: '24/7 network health checks, real-time speed optimization, proactive fault detection, and direct field dispatch across Gauteng.',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{ backgroundColor: '#000000', borderColor: '#232323' }}
              className="border rounded-2xl p-6 shadow-xl space-y-2"
            >
              <h3 className="text-base font-bold text-white">{card.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'features') {
    const activeFeature = FEATURE_TABS[activeFeatureIdx];
    return (
      <div className="space-y-6">
        <div
          className="border rounded-2xl p-6 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <span className="text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
            Platform &amp; Network Capabilities
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1.5">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <span>VXK NETWORK FEATURES</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Proactive monitoring, uncapped performance, and integrated captive portal management.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2.5">
            {FEATURE_TABS.map((f, idx) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFeatureIdx(idx)}
                style={{
                  backgroundColor: '#000000',
                  borderColor: activeFeatureIdx === idx ? '#13e511' : '#232323',
                }}
                className="w-full p-4 rounded-2xl border text-left transition flex items-center gap-3"
              >
                <span className="font-mono text-lg font-black text-emerald-400">{f.id}</span>
                <div>
                  <div className="font-bold text-white text-sm">{f.title}</div>
                  <div className="text-[11px] text-slate-400">{f.subtitle}</div>
                </div>
              </button>
            ))}
          </div>

          <div
            className="lg:col-span-8 border rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between"
            style={{ backgroundColor: '#000000', borderColor: '#232323' }}
          >
            <div className="space-y-3">
              <div className="text-xs font-mono text-cyan-400 uppercase">{activeFeature.subtitle}</div>
              <h3 className="text-xl font-black text-white">{activeFeature.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeFeature.summary}
              </p>

              <ul className="space-y-2 pt-2">
                {activeFeature.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onSelectTab(activeFeature.ctaTab)}
                style={{ backgroundColor: '#00ff3e', color: '#000000' }}
                className="px-5 py-2.5 rounded-xl font-black text-xs inline-flex items-center gap-2 hover:brightness-110 transition"
              >
                <span>{activeFeature.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'services') {
    return (
      <div className="space-y-6">
        <div
          className="border rounded-2xl p-6 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <span className="text-[11px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
            Our Expertise
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1.5">
            <Server className="w-6 h-6 text-cyan-400" />
            <span>SERVICES WE OFFER</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Comprehensive IT, optical fibre, wireless broadband, and voucher hotspot solutions
            engineered to keep your home, business, and community connected.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {VXK_SERVICE_OFFERINGS.map((srv) => (
            <div
              key={srv.id}
              style={{ backgroundColor: '#000000', borderColor: '#232323' }}
              className="border rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                  {srv.tagline}
                </span>
                <h3 className="text-base font-bold text-white">{srv.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{srv.description}</p>
              </div>

              <button
                type="button"
                onClick={() => onSelectTab(srv.actionTab)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs inline-flex items-center justify-center gap-2 transition"
              >
                <span>{srv.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'pricing') {
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Public Hot Spot'];
    return (
      <div className="space-y-6">
        <div
          className="border rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <div>
            <span className="text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              Internet Service Plans (VAT Inclusive)
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1.5">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              <span>PRICING DETAILS — UNCAPPED PACKAGES</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Uncapped Internet with zero usage limits, zero throttling, and free Wi-Fi router
              included.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-emerald-600/40 text-xs">
            <div className="text-slate-400">Installation &amp; Equipment Fee:</div>
            <div className="text-base font-black text-emerald-400">R2,500.00 (Once-off)</div>
            <div className="text-[11px] text-slate-300">
              Free Router + Install + 30 Days Free (6Mbps)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LINE_SPEED_PACKAGES.map((pkg, idx) => (
            <div
              key={pkg.value}
              style={{
                backgroundColor: '#000000',
                borderColor: pkg.popular ? '#13e511' : '#232323',
                borderWidth: pkg.popular ? '2px' : '1px',
              }}
              className="rounded-2xl p-6 border shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                    {tierNames[idx] || pkg.type}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    {pkg.type}
                  </span>
                </div>

                <div>
                  <span className="text-3xl font-black text-white">R{pkg.priceMonthlyZAR}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 py-3 border-y border-slate-800">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Download
                    </span>
                    <strong className="text-white">{pkg.downMbps} Mbps</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      Upload
                    </span>
                    <strong className="text-white">{pkg.upMbps} Mbps</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Policy</span>
                    <span className="text-emerald-400 font-semibold">Uncapped • No Throttling</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onApplyWithPlan(pkg.value)}
                  style={
                    pkg.popular
                      ? { backgroundColor: '#00ff3e', color: '#000000' }
                      : { backgroundColor: '#161616', color: '#ffffff' }
                  }
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs border border-slate-700 hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Order Now / Apply</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'portfolio') {
    const projects = filterPortfolioProjects(INITIAL_PORTFOLIO_PROJECTS, portfolioCategory);
    return (
      <div className="space-y-6">
        <div
          className="border rounded-2xl p-6 shadow-xl"
          style={{ backgroundColor: '#000000', borderColor: '#232323' }}
        >
          <span className="text-[11px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
            Our Work • Project Showcase
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1.5">
            <FolderKanban className="w-6 h-6 text-cyan-400" />
            <span>PORTFOLIO &amp; DEPLOYMENTS</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Proven fibre deployments, fixed wireless high-sites, community voucher hotspots, and
            managed enterprise infrastructure across Gauteng.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PORTFOLIO_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setPortfolioCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                portfolioCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-black text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              style={{ backgroundColor: '#000000', borderColor: '#232323' }}
              className="border rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                    {proj.category}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400">{proj.status}</span>
                </div>
                <h3 className="text-base font-bold text-white">{proj.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1 text-[11px]">
                <div className="text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{proj.location}</span>
                </div>
                <div className="font-mono text-emerald-400">{proj.specs}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Team
  return (
    <div className="space-y-6">
      <div
        className="border rounded-2xl p-6 shadow-xl"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <span className="text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
          Leadership &amp; NOC Engineering
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1.5">
          <Users className="w-6 h-6 text-emerald-400" />
          <span>OUR TEAM — VXK TECH</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Dedicated system administrators, optical technicians, and network engineers powering VXK
          Tech across South Africa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {VXK_TEAM_MEMBERS.map((member) => (
          <div
            key={member.id}
            style={{ backgroundColor: '#000000', borderColor: '#232323' }}
            className="border rounded-2xl p-6 shadow-xl space-y-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base"
                style={{ backgroundColor: '#146100', color: '#ffffff' }}
              >
                {member.initials}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{member.name}</h3>
                <div className="text-xs font-semibold text-cyan-400">{member.role}</div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{member.specialty}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
