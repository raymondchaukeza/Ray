import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { FaultReportTicketForm } from './components/FaultReportTicketForm.tsx';
import { FaultReportTicketModal } from './components/FaultReportTicketModal.tsx';
import { TicketList } from './components/TicketList.tsx';
import { LoginForm } from './components/LoginForm.tsx';
import { CaptiveWifiView } from './components/CaptiveWifiView.tsx';
import { WifiPartnerDashboardView } from './components/WifiPartnerDashboardView.tsx';
import { VoucherReportingView } from './components/VoucherReportingView.tsx';
import { BuyPayView } from './components/BuyPayView.tsx';
import { ContactView } from './components/ContactView.tsx';
import { HomeView } from './components/HomeView.tsx';
import { ApplyView } from './components/ApplyView.tsx';
import { PublicNewsView } from './components/PublicNewsView.tsx';
import { SiteSectionsView } from './components/SiteSectionsView.tsx';
import { CaptiveVoucherPortalView } from './components/CaptiveVoucherPortalView.tsx';
import {
  INITIAL_TICKETS,
  INITIAL_CAPTIVE_DEVICES,
  INITIAL_VOUCHER_REPORTS,
  INITIAL_PARTNER_DEVICES,
  INITIAL_NEWS_BULLETINS,
  INITIAL_APPLICATIONS,
  createInitialLiveUsers,
} from './data/seedData.ts';
import {
  FaultTicket,
  TicketStatus,
  UserSession,
  CaptiveDevice,
  VoucherReport,
  PartnerDevice,
  LiveConnectedUser,
  ServiceApplication,
  IssuedTimedVoucher,
} from './types/index.ts';
import {
  connectProfileAsLiveUser,
  toggleLiveUserStatus,
} from './utils/liveUsersRules.ts';
import { SITE_MENUS, resolveTabFromUrl } from './utils/siteMenuRules.ts';
import {
  CaptiveVoucherSession,
  isVoucherSessionExpired,
} from './utils/voucherPortalRules.ts';
import { Wifi } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Core collections state
  const [tickets, setTickets] = useState<FaultTicket[]>(INITIAL_TICKETS);
  const [captiveDevices, setCaptiveDevices] = useState<CaptiveDevice[]>(INITIAL_CAPTIVE_DEVICES);
  const [partnerDevices, setPartnerDevices] = useState<PartnerDevice[]>(INITIAL_PARTNER_DEVICES);
  const [liveUsers, setLiveUsers] = useState<LiveConnectedUser[]>(() => createInitialLiveUsers());
  const [selectedCaptiveBrandId, setSelectedCaptiveBrandId] = useState<string | undefined>(undefined);
  const [voucherReports, setVoucherReports] = useState<VoucherReport[]>(INITIAL_VOUCHER_REPORTS);
  const [applications, setApplications] = useState<ServiceApplication[]>(INITIAL_APPLICATIONS);
  const [defaultApplyPackage, setDefaultApplyPackage] = useState<string>('');
  const [activeVoucherSession, setActiveVoucherSession] =
    useState<CaptiveVoucherSession | null>(null);
  const [voucherSessionHistory, setVoucherSessionHistory] = useState<CaptiveVoucherSession[]>(
    []
  );
  const [issuedVouchers, setIssuedVouchers] = useState<IssuedTimedVoucher[]>(() => {
    try {
      const saved = localStorage.getItem('vxk_issued_timed_vouchers');
      return saved ? (JSON.parse(saved) as IssuedTimedVoucher[]) : [];
    } catch {
      return [];
    }
  });
  const [portalPrefill, setPortalPrefill] = useState<{
    voucherCode?: string;
    gatewayTag?: string;
  }>({});
  const [expiredSessionNotice, setExpiredSessionNotice] = useState<string | null>(null);
  const [selectedPlanForTicket, setSelectedPlanForTicket] = useState<string>('');
  const [selectedVoucherForTicket, setSelectedVoucherForTicket] = useState<string>('');

  // Handle URL hash and query parameters across all 15 site & portal routes
  useEffect(() => {
    const handleUrlState = () => {
      const resolved = resolveTabFromUrl(window.location.search, window.location.hash);
      if (resolved.openFaultModal) {
        setIsOverlayOpen(true);
      }
      if (resolved.tab) {
        setCurrentTab(resolved.tab);
      }
    };

    handleUrlState();
    window.addEventListener('hashchange', handleUrlState);
    return () => window.removeEventListener('hashchange', handleUrlState);
  }, []);

  // Sync live connected users across open browser tabs in real time via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('vxk-live-users');
    channel.onmessage = (event) => {
      const payload = event.data;
      if (payload?.type === 'SYNC_LIVE_USERS' && Array.isArray(payload.users)) {
        setLiveUsers(payload.users);
      }
    };
    return () => channel.close();
  }, []);

  const broadcastLiveUsers = (nextUsers: LiveConnectedUser[]) => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('vxk-live-users');
    channel.postMessage({ type: 'SYNC_LIVE_USERS', users: nextUsers });
    channel.close();
  };

  // Sync issued timed vouchers from server ledger on mount
  useEffect(() => {
    fetch('/api/vouchers')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.vouchers) && data.vouchers.length > 0) {
          setIssuedVouchers((prev) => {
            const seen = new Set(prev.map((v) => v.voucherCode));
            const merged = [...prev];
            for (const remote of data.vouchers as IssuedTimedVoucher[]) {
              if (!seen.has(remote.voucherCode)) {
                merged.push(remote);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Automatically disconnect captive voucher internet session when its timed period is up
  useEffect(() => {
    if (!activeVoucherSession) return;
    const timer = setInterval(() => {
      if (isVoucherSessionExpired(activeVoucherSession, Date.now())) {
        const expired = activeVoucherSession;
        setActiveVoucherSession(null);
        setExpiredSessionNotice(
          `Time Up! Voucher ${expired.voucherCode} (${
            expired.periodLabel || 'Timed Pass'
          }) via gateway ${
            expired.gatewayTag || 'vxk-GiyaniShop770'
          } reached expiry and internet access has been disconnected.`
        );
        setLiveUsers((prev) => {
          const next = prev.map((u) =>
            u.voucherCode === expired.voucherCode && u.status !== 'Disconnected'
              ? { ...u, status: 'Disconnected' as const }
              : u
          );
          broadcastLiveUsers(next);
          return next;
        });
        fetch('/api/pfsense/voucher/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voucherCode: expired.voucherCode,
            clientMac: expired.clientMac,
          }),
        }).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeVoucherSession]);

  const handleIssueVoucher = (voucher: IssuedTimedVoucher) => {
    setIssuedVouchers((prev) => {
      const next = [voucher, ...prev.filter((v) => v.voucherCode !== voucher.voucherCode)].slice(
        0,
        100
      );
      try {
        localStorage.setItem('vxk_issued_timed_vouchers', JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
    fetch('/api/vouchers/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voucher),
    }).catch(() => {});
  };

  const handleConnectVoucherOnPortal = (voucher: IssuedTimedVoucher) => {
    setPortalPrefill({
      voucherCode: voucher.displayCode,
      gatewayTag: voucher.gatewayTag,
    });
    setCurrentTab('voucher-portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLiveUserStatus = (userId: string) => {
    setLiveUsers((prev) => {
      const next = toggleLiveUserStatus(prev, userId, Date.now());
      broadcastLiveUsers(next);
      return next;
    });
  };

  const handleConnectSampleUser = (newUser: LiveConnectedUser) => {
    setLiveUsers((prev) => {
      const filtered = prev.filter((u) => u.accountNumber !== newUser.accountNumber);
      const next = [newUser, ...filtered];
      broadcastLiveUsers(next);
      return next;
    });
  };

  const handleUserAuthenticated = (user: UserSession) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    const defaultHub = partnerDevices[0];
    if (defaultHub) {
      const liveEntry = connectProfileAsLiveUser(user, defaultHub, Date.now());
      handleConnectSampleUser(liveEntry);
    }
  };

  const handleCreateTicket = (newTicket: FaultTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleUpdateTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    noteText?: string
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedNotes = [...t.notes];
          if (noteText) {
            updatedNotes.push({
              id: `n-${Date.now()}`,
              author: currentUser?.name || 'VXK Staff',
              text: noteText,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              isStaff: true,
            });
          }
          return {
            ...t,
            status: newStatus,
            notes: updatedNotes,
          };
        }
        return t;
      })
    );
  };

  const handleAddNote = (ticketId: string, noteText: string, isStaff: boolean) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            notes: [
              ...t.notes,
              {
                id: `n-${Date.now()}`,
                author: currentUser?.name || (isStaff ? 'NOC Tech' : 'Customer'),
                text: noteText,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                isStaff,
              },
            ],
          };
        }
        return t;
      })
    );
  };

  const handleRegisterDevice = (device: CaptiveDevice) => {
    setCaptiveDevices((prev) => [device, ...prev]);
  };

  const handleAddPartnerDevice = (partnerDevice: PartnerDevice) => {
    setPartnerDevices((prev) => [partnerDevice, ...prev]);
  };

  const handleUpdatePartnerDevice = (updated: PartnerDevice) => {
    setPartnerDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleSubmitVoucherReport = (report: VoucherReport) => {
    setVoucherReports((prev) => [report, ...prev]);
  };

  const handleOpenFaultWithVoucher = (code: string) => {
    setSelectedVoucherForTicket(code);
    setSelectedPlanForTicket('');
    setIsOverlayOpen(true);
  };

  const handleOpenEmptyFaultOverlay = () => {
    setSelectedPlanForTicket('');
    setSelectedVoucherForTicket('');
    setIsOverlayOpen(true);
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950"
      style={{ backgroundColor: '#0f0f0f' }}
    >
      {/* Header with full menu and auth status */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenReportOverlay={handleOpenEmptyFaultOverlay}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => setCurrentUser(null)}
        activeTicketCount={tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length}
        partnerDeviceCount={partnerDevices.length}
        liveUsersCount={liveUsers.filter((u) => u.status === 'Online').length}
      />

      {/* Breadcrumb Navigation Bar */}
      <div
        className="border-b border-slate-800/80 px-4 sm:px-8 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-400"
        style={{ backgroundColor: '#232323' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-500">You are here:</span>
          <button
            onClick={() => setCurrentTab('home')}
            className="hover:text-cyan-400 transition"
          >
            Home
          </button>
          <span>›</span>
          <span className="text-cyan-400 font-medium">
            {SITE_MENUS.find((m) => m.id === currentTab)?.label || 'HOME'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <code className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300 font-mono text-[10px]">
            {SITE_MENUS.find((m) => m.id === currentTab)?.queryRoute || '?q=home'}
          </code>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        style={{ backgroundColor: '#2d2d2d' }}
      >
        {/* Dynamic Screen rendering */}
        {currentTab === 'fault-ticket' && (
          <div className="space-y-8">
            {/* Create Ticket Form */}
            <FaultReportTicketForm
              currentUser={currentUser}
              onSubmitTicket={handleCreateTicket}
            />

            {/* Existing Tickets Queue & Tracking Desk */}
            <TicketList
              tickets={tickets}
              currentUser={currentUser}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onAddNote={handleAddNote}
              onOpenNewTicket={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>
        )}

        {currentTab === 'captive-wifi' && (
          <CaptiveWifiView
            currentUser={currentUser}
            onLoginSuccess={handleUserAuthenticated}
            onOpenFaultOverlay={handleOpenEmptyFaultOverlay}
            devices={captiveDevices}
            onRegisterDevice={handleRegisterDevice}
            onAddPartnerDevice={handleAddPartnerDevice}
            onOpenPartnerDashboard={() => setCurrentTab('wifi-partners')}
            partnerDeviceCount={partnerDevices.length}
            liveUsers={liveUsers}
            initialBrandId={selectedCaptiveBrandId}
          />
        )}

        {currentTab === 'wifi-partners' && (
          <WifiPartnerDashboardView
            partnerDevices={partnerDevices}
            liveUsers={liveUsers}
            currentUser={currentUser}
            onUpdatePartnerDevice={handleUpdatePartnerDevice}
            onToggleLiveUserStatus={handleToggleLiveUserStatus}
            onConnectSampleUser={handleConnectSampleUser}
            onGoToRegister={(brandId) => {
              setSelectedCaptiveBrandId(brandId);
              setCurrentTab('captive-wifi');
            }}
          />
        )}

        {currentTab === 'voucher' && (
          <VoucherReportingView
            currentUser={currentUser}
            voucherReports={voucherReports}
            onSubmitVoucherReport={handleSubmitVoucherReport}
            onOpenFaultWithVoucher={handleOpenFaultWithVoucher}
          />
        )}

        {currentTab === 'buy-pay' && (
          <BuyPayView
            currentUser={currentUser}
            onSelectPlanForTicket={(plan) => {
              setSelectedPlanForTicket(plan);
              setSelectedVoucherForTicket('');
            }}
            onOpenReportOverlay={() => setIsOverlayOpen(true)}
            onIssueVoucher={handleIssueVoucher}
            onConnectVoucherOnPortal={handleConnectVoucherOnPortal}
          />
        )}

        {currentTab === 'home' && (
          <HomeView
            onSelectTab={(tab) => setCurrentTab(tab)}
            onOpenReportOverlay={handleOpenEmptyFaultOverlay}
            activeTicketCount={
              tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length
            }
            partnerDeviceCount={partnerDevices.length}
            liveUsersCount={liveUsers.filter((u) => u.status === 'Online').length}
          />
        )}

        {(currentTab === 'about' ||
          currentTab === 'features' ||
          currentTab === 'services' ||
          currentTab === 'pricing' ||
          currentTab === 'portfolio' ||
          currentTab === 'team') && (
          <SiteSectionsView
            section={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            onApplyWithPlan={(plan) => {
              setDefaultApplyPackage(plan);
              setCurrentTab('apply');
            }}
          />
        )}

        {currentTab === 'apply' && (
          <ApplyView
            currentUser={currentUser}
            applications={applications}
            onSubmitApplication={(app) => setApplications((prev) => [app, ...prev])}
            defaultPackage={defaultApplyPackage}
            issuedVouchers={issuedVouchers}
            onIssueVoucher={handleIssueVoucher}
            onConnectVoucherOnPortal={handleConnectVoucherOnPortal}
          />
        )}

        {currentTab === 'public-news' && (
          <PublicNewsView
            bulletins={INITIAL_NEWS_BULLETINS}
            onGoToFaultTicket={() => setCurrentTab('fault-ticket')}
          />
        )}

        {currentTab === 'voucher-portal' && (
          <CaptiveVoucherPortalView
            currentUser={currentUser}
            partnerDevices={partnerDevices}
            activeSession={activeVoucherSession}
            sessionHistory={voucherSessionHistory}
            issuedVouchers={issuedVouchers}
            prefillVoucherCode={portalPrefill.voucherCode}
            prefillGatewayTag={portalPrefill.gatewayTag}
            expiredSessionNotice={expiredSessionNotice}
            onClearExpiredNotice={() => setExpiredSessionNotice(null)}
            onActivateVoucherSession={({ session, liveUser, captiveDevice }) => {
              setExpiredSessionNotice(null);
              setActiveVoucherSession(session);
              setVoucherSessionHistory((prev) => [session, ...prev]);
              handleConnectSampleUser(liveUser);
              handleRegisterDevice(captiveDevice);
            }}
            onDisconnectVoucherSession={(session) => {
              setActiveVoucherSession(null);
              const matchingLive = liveUsers.find(
                (u) => u.voucherCode === session.voucherCode && u.status !== 'Disconnected'
              );
              if (matchingLive) {
                handleToggleLiveUserStatus(matchingLive.id);
              }
              fetch('/api/pfsense/voucher/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  voucherCode: session.voucherCode,
                  clientMac: session.clientMac,
                }),
              }).catch(() => {});
            }}
            onOpenVoucherReporting={() => setCurrentTab('voucher')}
            onOpenPartnerDashboard={() => setCurrentTab('wifi-partners')}
          />
        )}

        {currentTab === 'contact' && (
          <ContactView
            currentUser={currentUser}
            onOpenReportOverlay={handleOpenEmptyFaultOverlay}
          />
        )}
      </main>

      {/* Modal for Fault Report Ticket Overlay */}
      <FaultReportTicketModal
        isOpen={isOverlayOpen}
        onClose={() => {
          setIsOverlayOpen(false);
          setSelectedPlanForTicket('');
          setSelectedVoucherForTicket('');
        }}
        currentUser={currentUser}
        initialLineSpeed={selectedPlanForTicket}
        initialVoucherError={selectedVoucherForTicket}
        onSubmitTicket={(t) => {
          handleCreateTicket(t);
        }}
      />

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsLoginModalOpen(false)}
            aria-hidden="true"
          />
          <LoginForm
            isModal={true}
            onLoginSuccess={handleUserAuthenticated}
            onCancel={() => setIsLoginModalOpen(false)}
          />
        </div>
      )}

      {/* Footer */}
      <footer
        className="border-t py-8 px-4 text-xs text-slate-400"
        style={{ backgroundColor: '#0f0f0f', borderColor: '#232323' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="font-bold text-white">VXK TECH PREPAID INTERNET</span>
              <p className="text-[11px] text-slate-500">
                Broadband, Hotspots, and Vending Switch Management • South Africa
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-slate-400">
            {SITE_MENUS.map((menu) => (
              <button
                key={menu.id}
                onClick={() => {
                  setCurrentTab(menu.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`hover:text-cyan-300 transition ${
                  currentTab === menu.id ? 'text-cyan-400 font-semibold' : ''
                }`}
              >
                {menu.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
