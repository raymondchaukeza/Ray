import React, { useState } from 'react';
import {
  Wifi,
  Ticket,
  KeyRound,
  PhoneCall,
  User,
  LogOut,
  AlertTriangle,
  Menu,
  X,
  CreditCard,
  ShieldCheck,
  Building2,
  Home,
  Info,
  Sparkles,
  Server,
  FolderKanban,
  Users,
  FilePlus2,
  Newspaper,
} from 'lucide-react';
import { UserSession } from '../types/index.ts';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenReportOverlay: () => void;
  currentUser: UserSession | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  activeTicketCount: number;
  partnerDeviceCount?: number;
  liveUsersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenReportOverlay,
  currentUser,
  onOpenLogin,
  onLogout,
  activeTicketCount,
  partnerDeviceCount,
  liveUsersCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'buy-pay', label: 'BUY / PAY', icon: CreditCard },
    { id: 'voucher', label: 'VOUCHER REPORTING', icon: KeyRound },
    { id: 'fault-ticket', label: 'FAULT TICKET', icon: Ticket, badge: activeTicketCount },
    { id: 'captive-wifi', label: 'REGISTER CAPTIVE WIFI', icon: Wifi },
    { id: 'wifi-partners', label: 'WI-FI PARTNERS', icon: Building2, badge: partnerDeviceCount },
    { id: 'contact', label: 'CONTACT US', icon: PhoneCall },
  ];

  const siteMenuItems = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'about', label: 'ABOUT', icon: Info },
    { id: 'features', label: 'FEATURES', icon: Sparkles },
    { id: 'services', label: 'SERVICES', icon: Server },
    { id: 'pricing', label: 'PRICING', icon: CreditCard },
    { id: 'portfolio', label: 'PORTFOLIO', icon: FolderKanban },
    { id: 'team', label: 'TEAM', icon: Users },
    { id: 'apply', label: 'APPLY', icon: FilePlus2 },
    { id: 'public-news', label: 'PUBLIC NEWS', icon: Newspaper },
    { id: 'voucher-portal', label: 'ENTER VOUCHER CODE', icon: KeyRound },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      {/* Top Utility Bar */}
      <div
        className="border-b text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-slate-300"
        style={{ backgroundColor: '#110000', borderColor: '#00f504' }}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>VXK Tech Prepaid Broadband &amp; Hotspot Portal</span>
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline text-slate-300">
            Emergency Fiber &amp; Voucher Support Desk: 08:00 - 20:00 SAST
          </span>
          {liveUsersCount > 0 && (
            <button
              type="button"
              onClick={() => handleNavClick('wifi-partners')}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-emerald-500/50 text-emerald-300 font-mono text-[11px] hover:border-emerald-400 transition whitespace-nowrap shrink-0"
              title="View live connected users monitor"
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: '#00f302' }}
              />
              <span>{liveUsersCount} Users Live</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Account:</span>
              <span className="font-mono text-cyan-300 font-semibold px-2 py-0.5 bg-cyan-950/70 border border-cyan-800/60 rounded text-[11px]">
                {currentUser.accountNumber}
              </span>
              <span className="text-slate-400 hidden sm:inline">({currentUser.name})</span>
              <button
                onClick={onLogout}
                className="ml-2 inline-flex items-center gap-1 text-slate-300 hover:text-red-300 text-xs transition"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer / Tech Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6">
        <div
          className="flex items-center justify-between gap-3 h-20"
          style={{ backgroundColor: '#0f0f0f' }}
        >
          {/* Logo & Brand */}
          <button
            type="button"
            className="flex items-center gap-2.5 cursor-pointer text-left shrink-0"
            onClick={() => onSelectTab('home')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-cyan-500/20 shadow-md shrink-0">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <Wifi className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg xl:text-xl tracking-tight text-white font-sans">
                  VXK <span className="text-cyan-400">TECH</span>
                </span>
                <span
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30"
                  style={{ color: '#ffffff' }}
                >
                  Prepaid
                </span>
              </div>
              <p className="text-[10px] xl:text-xs text-slate-400 font-medium">
                PREPAID INTERNET &amp; BROADBAND
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              let buttonStyle: React.CSSProperties | undefined = undefined;
              let spanStyle: React.CSSProperties | undefined = undefined;

              if (idx === 0) {
                buttonStyle = { backgroundColor: '#00ff3e' };
                spanStyle = { color: '#000000', fontWeight: 'bold', fontSize: '12px' };
              } else if (idx === 1) {
                buttonStyle = { backgroundColor: '#a20000' };
              } else if (idx === 5) {
                buttonStyle = { backgroundColor: '#000000', borderColor: '#848484' };
              } else {
                buttonStyle = { backgroundColor: '#000000' };
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={buttonStyle}
                  className={`relative flex items-center gap-1.5 px-2 xl:px-2.5 py-2 text-[11px] font-semibold rounded-lg border transition-all hover:brightness-110 whitespace-nowrap ${
                    isActive
                      ? 'border-cyan-400 text-cyan-300 shadow-sm ring-1 ring-cyan-500/40'
                      : 'border-slate-800 text-slate-200 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      idx === 0 ? 'text-black' : isActive ? 'text-cyan-400' : 'text-slate-300'
                    }`}
                  />
                  <span style={spanStyle}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Quick Action Button & Login */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenReportOverlay}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/25 transition-all transform active:scale-95 whitespace-nowrap"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Report Fault Ticket</span>
            </button>

            {!currentUser && (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition whitespace-nowrap"
              >
                <User className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Log In</span>
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onOpenReportOverlay}
              className="p-2 text-xs font-bold rounded-lg bg-red-600 text-white sm:hidden"
              aria-label="Report Fault Ticket"
              title="Report Fault Ticket"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* VXK Site Menus Bar (Desktop) */}
      <div
        className="hidden lg:block border-t border-slate-800/90"
        style={{ backgroundColor: '#070707' }}
      >
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 py-1.5 flex items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-1" aria-label="Site Menu Navigation">
            {siteMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md border transition whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-black/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <Icon
                    className={`w-3 h-3 shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-cyan-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => handleNavClick('contact')}
            className="text-[11px] font-medium text-slate-400 hover:text-cyan-300 transition whitespace-nowrap"
          >
            870 Stanza Bopape St, Arcadia • +27 75 444 8267
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0f0f0f] border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 max-h-[75vh] overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Prepaid &amp; Captive Portal Menus
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 pt-2 border-t border-slate-800">
            VXK Tech Site &amp; Service Menus
          </div>
          {siteMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenReportOverlay();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Fault Ticket</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out ({currentUser.name})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold text-sm"
              >
                <User className="w-4 h-4" />
                <span>Log In to VXK Account</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
