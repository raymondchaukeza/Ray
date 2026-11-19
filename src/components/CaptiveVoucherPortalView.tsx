import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
  Router,
  Globe,
  Power,
  Building2,
  ArrowRight,
  Download,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Radio,
  RefreshCw,
  Send,
  Activity,
  Copy,
  Check,
} from 'lucide-react';
import { IssuedTimedVoucher, PartnerDevice, UserSession } from '../types/index.ts';
import {
  CaptiveVoucherSession,
  DEFAULT_TILL_GATEWAY_TAG,
  PRESET_CAPTIVE_VOUCHERS,
  formatRemainingCountdown,
  redeemCaptiveVoucher,
} from '../utils/voucherPortalRules.ts';
import {
  PfsenseDispatchRecord,
  buildPfsenseRedirectorHtml,
  isPrivateOrLanHost,
  normalizePfsenseActionUrl,
  parsePortalRedirectQuery,
} from '../utils/pfsenseBridgeRules.ts';

interface CaptiveVoucherPortalViewProps {
  currentUser: UserSession | null;
  partnerDevices: PartnerDevice[];
  activeSession: CaptiveVoucherSession | null;
  sessionHistory: CaptiveVoucherSession[];
  issuedVouchers?: IssuedTimedVoucher[];
  prefillVoucherCode?: string;
  prefillGatewayTag?: string;
  expiredSessionNotice?: string | null;
  onClearExpiredNotice?: () => void;
  onActivateVoucherSession: (payload: {
    session: CaptiveVoucherSession;
    liveUser: NonNullable<ReturnType<typeof redeemCaptiveVoucher>['liveUserEntry']>;
    captiveDevice: NonNullable<ReturnType<typeof redeemCaptiveVoucher>['captiveDeviceEntry']>;
  }) => void;
  onDisconnectVoucherSession: (session: CaptiveVoucherSession) => void;
  onOpenVoucherReporting: () => void;
  onOpenPartnerDashboard: () => void;
}

interface BridgePingState {
  status: 'idle' | 'probing' | 'reachable' | 'unreachable';
  httpStatus: number | null;
  latencyMs: number | null;
  isPrivateLan: boolean;
  detail: string;
}

interface DirectLanPayload {
  actionUrl: string;
  authVoucher: string;
  redirurl: string;
  zone: string;
}

const VXK_LOGO_DATA_URI =
  'data:image/svg+xml;base64,' +
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjQ4OCIgdmlld0JveD0iMCAwIDEyNSA2MSIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InRpdGxlIGRlc2MiPgogIDx0aXRsZSBpZD0idGl0bGUiPlZYSyBsb2dvPC90aXRsZT4KICA8ZGVzYyBpZD0iZGVzYyI+VmVjdG9yIHJlY3JlYXRpb24gb2YgdGhlIHN1cHBsaWVkIFZYSyBtYXJrIGluIG5hdnksIHNpbHZlciwgd2hpdGUgYW5kIHJlZC48L2Rlc2M+CiAgPHJlY3Qgd2lkdGg9IjEyNSIgaGVpZ2h0PSI2MSIgZmlsbD0iIzA2M2E1MCIvPgogIDxnIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIHN0cm9rZS1taXRlcmxpbWl0PSI1Ij4KICAgIDwhLS0gU2lsdmVyIG91dHNpZGUgZWRnZXMgb2YgdGhlIGludGVybG9ja2luZyBsZXR0ZXJmb3Jtcy4gLS0+CiAgICA8cGF0aCBkPSJNNCAyNyAyMiAxMiA0NiAxMiA2MSAzNyA3MyAxNiA4NSAxMyA5NyAxMyA4MCAzNiA5MSA1NiA3OCA1NiA3MyA0NyA2NyA1NiA1NiA1NiAzOSAyOFoiIGZpbGw9IiNmMWYxZTkiIHN0cm9rZT0iIzhjOTk5ZCIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgICA8cGF0aCBkPSJNMTMgMjQgMjUgMTUgNDMgMTUgNjAgNDQgNzcgMTcgODkgMTYgNzAgNDMgNjQgNTMgNTggNTMgNDEgMjVaIiBmaWxsPSIjMDYzYTUwIiBzdHJva2U9IiNiZWM4YzgiIHN0cm9rZS13aWR0aD0iMSIvPgogICAgPCEtLSBVcHBlciBjb25uZWN0aW5nIHN0cm9rZS4gLS0+CiAgICA8cGF0aCBkPSJNNDkgMTMgNjUgMTMgNzIgMjAgNjcgMjggNjMgMjAgNTQgMjBaIiBmaWxsPSIjZjJmMmViIiBzdHJva2U9IiM4Yzk5OWQiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPHBhdGggZD0iTTU0IDE1IDY0IDE1IDY5IDIwIDY3IDIzIDY0IDE4IDU2IDE4WiIgZmlsbD0iIzhmYWFiNCIvPgogICAgPCEtLSBSZWQgcmlnaHQtaGFuZCBzdHJva2UgYW5kIHNpbHZlciByaW0uIC0tPgogICAgPHBhdGggZD0iTTg4IDE0IDExNSAxMyAxMDEgMzUgMTEzIDU2IDkxIDU2IDgwIDM2IDk0IDE3WiIgZmlsbD0iI2Y0ZjNlZCIgc3Ryb2tlPSIjOGM5OTlkIiBzdHJva2Utd2lkdGg9IjMiLz4KICAgIDxwYXRoIGQ9Ik05OSAxNyAxMDkgMTYgOTYgMzUgMTA3IDUyIDk0IDUyIDg1IDM2WiIgZmlsbD0iIzllMTkzNCIvPgogICAgPHBhdGggZD0iTTk0IDE4IDk4IDE3IDg1IDM2IDk0IDUzIDkxIDUzIDgxIDM2WiIgZmlsbD0iIzA2M2E1MCIvPgogICAgPCEtLSBGb3JlZ3JvdW5kIGRpYWdvbmFsIG1haW50YWlucyB0aGUgaW50ZXJsb2Nra2luZyBsZXR0ZXJmb3Jtcy4gLS0+CiAgICA8cGF0aCBkPSJNNzcgMTcgODggMTYgNjQgNTMgNTggNTMgNDIgMjUgMTUgMjUgMjUgMTcgNDIgMTcgNjAgNDdaIiBmaWxsPSIjMDYzYTUwIiBzdHJva2U9IiNlZWYwZTkiIHN0cm9rZS13aWR0aD0iMS40Ii8+CiAgPC9nPgo8L3N2Zz4K';

const SINGLE_DEVICE_BUNDLES = [
  { duration: '12 hours', price: 'R5.00', sampleCode: 'VXK-12HR-0005-PASS' },
  { duration: '24 hours', price: 'R10.00', sampleCode: 'VXK-7712-9901-4421' },
  { duration: '7 days', price: 'R30.00', sampleCode: 'VXK-9042-1188-3210' },
  { duration: '14 days', price: 'R60.00', sampleCode: 'VXK-14DY-0060-PASS' },
];

export const CaptiveVoucherPortalView: React.FC<CaptiveVoucherPortalViewProps> = ({
  currentUser,
  partnerDevices,
  activeSession,
  sessionHistory,
  issuedVouchers = [],
  prefillVoucherCode,
  prefillGatewayTag,
  expiredSessionNotice,
  onClearExpiredNotice,
  onActivateVoucherSession,
  onDisconnectVoucherSession,
  onOpenVoucherReporting,
  onOpenPartnerDashboard,
}) => {
  const defaultGateway =
    partnerDevices.find((d) => d.gatewayTag === DEFAULT_TILL_GATEWAY_TAG) ||
    partnerDevices.find((d) => d.gatewayIp === '192.168.1.1') ||
    partnerDevices[0];

  const [voucherCode, setVoucherCode] = useState(prefillVoucherCode || '');
  const [selectedGatewayId, setSelectedGatewayId] = useState(
    defaultGateway?.id || 'pd-giyani-770'
  );
  const [subscriberName, setSubscriberName] = useState(currentUser?.name || '');
  const [clientMac, setClientMac] = useState('D4:5D:64:1B:9A:80');
  const [clientIp, setClientIp] = useState('192.168.1.156');
  const [portalEndpointUrl, setPortalEndpointUrl] = useState(
    'https://192.168.1.1:8003/index.php?zone=vxk_partner_portal'
  );
  const [redirectUrl, setRedirectUrl] = useState('https://vxktech.co.za/');
  const [portalZone, setPortalZone] = useState('vxk_partner_portal');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showGatewayOptions, setShowGatewayOptions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [portalNotice, setPortalNotice] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastDeliveryBadge, setLastDeliveryBadge] = useState<string>('');
  const [directLanPayload, setDirectLanPayload] = useState<DirectLanPayload | null>(null);
  const [autoDirectLanSubmit, setAutoDirectLanSubmit] = useState<boolean>(false);
  const [showPfsenseSetup, setShowPfsenseSetup] = useState<boolean>(false);
  const [copiedSetupItem, setCopiedSetupItem] = useState<string>('');
  const [dispatchLog, setDispatchLog] = useState<PfsenseDispatchRecord[]>([]);
  const [configSavedNotice, setConfigSavedNotice] = useState('');
  const [pingState, setPingState] = useState<BridgePingState>({
    status: 'idle',
    httpStatus: null,
    latencyMs: null,
    isPrivateLan: true,
    detail: 'Ready to dispatch vouchers back-to-back to pfSense+ Captive Portal.',
  });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const directSubmitFormRef = useRef<HTMLFormElement | null>(null);

  const fetchBridgeLedger = useCallback(async () => {
    try {
      const res = await fetch('/api/pfsense/ledger');
      if (!res.ok) return;
      const data = (await res.json()) as { recentDispatches?: PfsenseDispatchRecord[] };
      if (Array.isArray(data.recentDispatches)) {
        setDispatchLog(data.recentDispatches);
      }
    } catch {
      // Ignore transient polling failures
    }
  }, []);

  // Load initial URL params forwarded by pfSense Captive Portal, till receipts & server bridge config
  useEffect(() => {
    const queryParams = parsePortalRedirectQuery(window.location.search);
    if (queryParams.zone) setPortalZone(queryParams.zone);
    if (queryParams.redirurl) setRedirectUrl(queryParams.redirurl);
    if (queryParams.portalActionUrl) {
      setPortalEndpointUrl(queryParams.portalActionUrl);
      setAutoDirectLanSubmit(true);
    }
    if (queryParams.clientMac) setClientMac(queryParams.clientMac);
    if (queryParams.clientIp) setClientIp(queryParams.clientIp);
    if (queryParams.voucher) setVoucherCode(queryParams.voucher);
    if (queryParams.gateway) {
      const gwLower = queryParams.gateway.toLowerCase();
      const matchedGw = partnerDevices.find(
        (d) =>
          d.gatewayTag?.toLowerCase() === gwLower ||
          d.partnerBusinessName.toLowerCase().includes(gwLower)
      );
      if (matchedGw) {
        setSelectedGatewayId(matchedGw.id);
      }
    }

    fetch('/api/pfsense/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (!cfg) return;
        if (!queryParams.portalActionUrl && cfg.portalUrl) setPortalEndpointUrl(cfg.portalUrl);
        if (!queryParams.zone && cfg.portalZone) setPortalZone(cfg.portalZone);
        if (!queryParams.redirurl && cfg.redirUrl) setRedirectUrl(cfg.redirUrl);
      })
      .catch(() => {});

    fetchBridgeLedger();
    const pollId = setInterval(fetchBridgeLedger, 5000);
    return () => clearInterval(pollId);
  }, [fetchBridgeLedger, partnerDevices]);

  useEffect(() => {
    if (prefillVoucherCode) {
      setVoucherCode(prefillVoucherCode);
      setErrors({});
    }
    if (prefillGatewayTag) {
      const gwLower = prefillGatewayTag.toLowerCase();
      const matchedGw = partnerDevices.find(
        (d) =>
          d.gatewayTag?.toLowerCase() === gwLower ||
          d.partnerBusinessName.toLowerCase().includes(gwLower)
      );
      if (matchedGw) setSelectedGatewayId(matchedGw.id);
    }
  }, [prefillVoucherCode, prefillGatewayTag, partnerDevices]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser?.name && !subscriberName) {
      setSubscriberName(currentUser.name);
    }
  }, [currentUser, subscriberName]);

  const selectedGateway =
    partnerDevices.find((d) => d.id === selectedGatewayId) || defaultGateway;

  const handleGatewayChange = (deviceId: string) => {
    setSelectedGatewayId(deviceId);
    const dev = partnerDevices.find((d) => d.id === deviceId);
    if (dev) {
      const octets = dev.gatewayIp.split('.');
      setClientIp(`${octets[0]}.${octets[1]}.${octets[2]}.156`);
      setPortalEndpointUrl(
        normalizePfsenseActionUrl({
          gatewayIp: dev.gatewayIp,
          port: 8003,
          zone: portalZone,
        })
      );
    }
  };

  const handleSaveBridgeConfig = async () => {
    setConfigSavedNotice('');
    try {
      const res = await fetch('/api/pfsense/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalUrl: portalEndpointUrl,
          portalZone,
          redirUrl: redirectUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setConfigSavedNotice(data.error || 'Could not update bridge config.');
        return;
      }
      setPortalEndpointUrl(data.portalUrl);
      setPortalZone(data.portalZone);
      setConfigSavedNotice(`Saved live pfSense+ endpoint: ${data.portalUrl}`);
    } catch {
      setConfigSavedNotice('Failed to reach bridge API.');
    }
  };

  const handlePingPfsense = async () => {
    setPingState((prev) => ({ ...prev, status: 'probing', detail: 'Probing pfSense+ Captive Portal...' }));
    try {
      const res = await fetch('/api/pfsense/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalUrl: portalEndpointUrl,
          zone: portalZone,
        }),
      });
      const data = await res.json();
      setPingState({
        status: data.reachable ? 'reachable' : 'unreachable',
        httpStatus: data.httpStatus ?? null,
        latencyMs: data.latencyMs ?? null,
        isPrivateLan: Boolean(data.isPrivateLan),
        detail: data.detail || 'Probe finished.',
      });
    } catch {
      setPingState({
        status: 'unreachable',
        httpStatus: null,
        latencyMs: null,
        isPrivateLan: true,
        detail: 'Unable to reach /api/pfsense/ping backend.',
      });
    }
  };

  const handleFillSampleCode = (code: string) => {
    setVoucherCode(code);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.voucherCode;
      return next;
    });
    const el = document.getElementById('voucher');
    if (el) el.focus();
  };

  const handleSubmitVoucher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGateway || isDispatching) return;
    onClearExpiredNotice?.();

    const formEl = e.currentTarget.elements.namedItem('auth_voucher') as HTMLInputElement | null;
    const effectiveVoucher = (formEl?.value ?? voucherCode).trim();
    const normalizedInput = effectiveVoucher.replace(/[\s\-]/g, '').toUpperCase();

    let mergedIssuedVouchers = issuedVouchers;
    const alreadyLocal = mergedIssuedVouchers.some(
      (iv) => iv.voucherCode.replace(/[\s\-]/g, '').toUpperCase() === normalizedInput
    );
    if (!alreadyLocal && normalizedInput.length >= 4) {
      try {
        const lookupRes = await fetch(
          `/api/vouchers/lookup/${encodeURIComponent(normalizedInput)}`
        );
        if (lookupRes.ok) {
          const lookupData = (await lookupRes.json()) as { voucher?: IssuedTimedVoucher };
          if (lookupData.voucher) {
            mergedIssuedVouchers = [lookupData.voucher, ...mergedIssuedVouchers];
          }
        }
      } catch {
        // Proceed with local validation
      }
    }

    const validation = redeemCaptiveVoucher({
      voucherCode: effectiveVoucher,
      subscriberName,
      accountNumber: currentUser?.accountNumber,
      clientMac,
      clientIp,
      gatewayDevice: selectedGateway,
      acceptedTerms,
      redirectUrl,
      issuedVouchers: mergedIssuedVouchers,
      gatewayTag: selectedGateway.gatewayTag || prefillGatewayTag || DEFAULT_TILL_GATEWAY_TAG,
    });

    if (
      !validation.ok ||
      !validation.session ||
      !validation.liveUserEntry ||
      !validation.captiveDeviceEntry
    ) {
      setErrors(validation.errors);
      setPortalNotice('');
      return;
    }

    setErrors({});
    setIsDispatching(true);
    setDirectLanPayload(null);

    const isKnownSample = PRESET_CAPTIVE_VOUCHERS.some(
      (pv) => pv.code.replace(/[\s\-]/g, '').toUpperCase() === validation.session?.voucherCode
    );
    const isIssuedTillVoucher = Boolean(validation.matchedIssuedVoucher);
    const cleanZone =
      portalZone.replace(/^\$PORTAL_ZONE\$$/i, '').trim() || 'vxk_partner_portal';
    const cleanRedir =
      redirectUrl.replace(/^\$PORTAL_REDIRURL\$$/i, '').trim() || 'https://vxktech.co.za/';
    const resolvedDirectAction = normalizePfsenseActionUrl({
      rawUrl: portalEndpointUrl,
      gatewayIp: selectedGateway.gatewayIp,
      port: 8003,
      zone: cleanZone,
      overrideZone: true,
    });
    let targetIsPrivateLan = true;
    try {
      targetIsPrivateLan = isPrivateOrLanHost(new URL(resolvedDirectAction).hostname);
    } catch {
      targetIsPrivateLan = true;
    }

    // Direct 1-click browser LAN form submission when triggered from a live Wi-Fi hotspot client
    if (
      autoDirectLanSubmit &&
      !isKnownSample &&
      targetIsPrivateLan &&
      selectedGatewayId !== '__ALL__' &&
      directSubmitFormRef.current
    ) {
      fetch('/api/pfsense/voucher/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          voucherCode: effectiveVoucher,
          portalUrl: resolvedDirectAction,
          gatewayIp: selectedGateway.gatewayIp,
          zone: cleanZone,
          redirurl: cleanRedir,
          clientMac,
          clientIp,
          subscriberName: subscriberName || 'Prepaid Wi-Fi Guest',
        }),
      }).catch(() => {});

      const hiddenForm = directSubmitFormRef.current;
      hiddenForm.action = resolvedDirectAction;
      hiddenForm.target = window.top === window.self ? '_self' : '_blank';
      (hiddenForm.elements.namedItem('auth_voucher') as HTMLInputElement).value = effectiveVoucher;
      (hiddenForm.elements.namedItem('redirurl') as HTMLInputElement).value = cleanRedir;
      (hiddenForm.elements.namedItem('zone') as HTMLInputElement).value = cleanZone;
      setPortalNotice(
        `Handing voucher ${effectiveVoucher} directly to pfSense+ at ${resolvedDirectAction}...`
      );
      setIsDispatching(false);
      hiddenForm.submit();
      return;
    }

    try {
      const gatewaysToDispatch =
        selectedGatewayId === '__ALL__' ? partnerDevices : [selectedGateway];

      const results = await Promise.all(
        gatewaysToDispatch.map(async (gw) => {
          const gwUrl =
            gw.gatewayIp === '192.168.1.1' && selectedGatewayId !== '__ALL__'
              ? resolvedDirectAction
              : normalizePfsenseActionUrl({
                  gatewayIp: gw.gatewayIp,
                  port: 8003,
                  zone: cleanZone,
                });

          const bridgeRes = await fetch('/api/pfsense/voucher/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              voucherCode: effectiveVoucher,
              portalUrl: gwUrl,
              gatewayIp: gw.gatewayIp,
              zone: portalZone,
              redirurl: redirectUrl,
              clientMac,
              clientIp,
              subscriberName: subscriberName || 'Prepaid Wi-Fi Guest',
            }),
          });
          return bridgeRes.json();
        })
      );
      const relay = results.find((r) => r?.pfsenseAuthorized) || results[0] || {};
      await fetchBridgeLedger();

      // Case 1: Real pfSense+ Server accepted and authorized the voucher live
      if (relay.pfsenseAuthorized) {
        setLastDeliveryBadge(
          gatewaysToDispatch.length > 1
            ? `pfSense+ Master Broadcast Verified (${gatewaysToDispatch.length} Hubs)`
            : `pfSense+ Live Verified (HTTP ${relay.httpStatus} • ${relay.latencyMs}ms)`
        );
        setPortalNotice(
          `Connected! Voucher ${effectiveVoucher} was verified directly by pfSense+ at ${relay.targetUrl} (${relay.latencyMs}ms).`
        );
        onActivateVoucherSession({
          session: { ...validation.session, gatewayUrl: relay.targetUrl || portalEndpointUrl },
          liveUser: validation.liveUserEntry,
          captiveDevice: validation.captiveDeviceEntry,
        });
        setVoucherCode('');
        return;
      }

      // Case 2: Live pfSense+ responded and actively rejected the voucher
      if (relay.upstreamRejected) {
        setLastDeliveryBadge(`pfSense+ Rejected (HTTP ${relay.httpStatus})`);
        setErrors({ voucherCode: relay.message || 'pfSense+ rejected this voucher code.' });
        setPortalNotice(relay.message || 'pfSense+ rejected the submitted voucher code.');
        return;
      }

      // Case 3: Target is a private LAN IP (192.168.1.1) unreachable from cloud relay, or offline WAN
      setDirectLanPayload({
        actionUrl: resolvedDirectAction,
        authVoucher: effectiveVoucher,
        redirurl: cleanRedir,
        zone: cleanZone,
      });

      if (isKnownSample || isIssuedTillVoucher) {
        const gwDisplay =
          validation.session.gatewayTag ||
          selectedGateway.gatewayTag ||
          DEFAULT_TILL_GATEWAY_TAG;
        const periodInfo = validation.session.periodLabel
          ? ` (${validation.session.periodLabel} until time up)`
          : '';
        setLastDeliveryBadge(
          isIssuedTillVoucher
            ? `Till Receipt Activated (${gwDisplay}${periodInfo})`
            : 'Direct LAN Form Prepared + Preview Synced'
        );
        setPortalNotice(
          `Connected via gateway ${gwDisplay}${periodInfo}! Dispatched toward pfSense+ at ${resolvedDirectAction}.`
        );
        onActivateVoucherSession({
          session: { ...validation.session, gatewayUrl: resolvedDirectAction },
          liveUser: validation.liveUserEntry,
          captiveDevice: validation.captiveDeviceEntry,
        });
        setVoucherCode('');
      } else {
        setLastDeliveryBadge(
          relay.isPrivateLanUnreachable
            ? 'Direct LAN Action Ready (192.168.1.1)'
            : 'Gateway Unreachable'
        );
        setPortalNotice(
          relay.isPrivateLanUnreachable
            ? `Dispatched through relay: ${resolvedDirectAction} is on your local hotspot Wi-Fi subnet. Click "Send Direct via Wi-Fi Browser to pfSense+" below to submit auth_voucher straight from this device to 192.168.1.1.`
            : relay.message || `Unable to reach pfSense+ at ${resolvedDirectAction}.`
        );
      }
    } catch {
      setErrors({
        voucherCode: 'Could not contact back-to-back pfSense+ bridge (/api/pfsense/voucher/authenticate).',
      });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Gateway & pfSense Back-to-Back Bridge Bar */}
      <div
        className="border rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        style={{
          backgroundColor: '#002238',
          borderColor: '#bfcbd4',
        }}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded border"
              style={{ backgroundColor: '#b20d28', borderColor: '#bfcbd4', color: '#f5f6f7' }}
            >
              VXK TECH | Internet access
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded border"
              style={{ backgroundColor: '#103449', borderColor: '#839aa8', color: '#bfcbd4' }}
            >
              <Radio
                className={`w-3 h-3 ${
                  pingState.status === 'reachable' ? 'text-emerald-400' : 'text-cyan-300'
                }`}
              />
              Back-to-Back Bridge: /api/pfsense/voucher/authenticate
            </span>
          </div>
          <p className="text-xs font-mono" style={{ color: '#bfcbd4' }}>
            Vouchers entered here dispatch live via <code>POST /api/pfsense/voucher/authenticate</code>{' '}
            to pfSense+ (<code>{portalEndpointUrl}</code>) with <code>auth_voucher</code>,{' '}
            <code>zone</code>, and <code>redirurl</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 font-mono text-xs">
          <button
            type="button"
            onClick={handlePingPfsense}
            disabled={pingState.status === 'probing'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded border transition hover:bg-[#20475b]"
            style={{ backgroundColor: '#103449', borderColor: '#bfcbd4', color: '#f5f6f7' }}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${pingState.status === 'probing' ? 'animate-spin' : ''}`}
            />
            <span>{pingState.status === 'probing' ? 'Pinging...' : 'Test pfSense+ Link'}</span>
          </button>
          <a
            href="./assets/aistudio/html__3__64f24cc5.html"
            download="vxk-captive-portal.html"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded border transition hover:bg-[#20475b]"
            style={{ backgroundColor: '#092c41', borderColor: '#bfcbd4', color: '#f5f6f7' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML</span>
          </a>
          <button
            type="button"
            onClick={onOpenPartnerDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded border transition hover:bg-[#cc1735]"
            style={{ backgroundColor: '#b20d28', borderColor: '#bfcbd4', color: '#f5f6f7' }}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Live Monitor</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Authentic VXK TECH | Internet access Portal Page */}
        <section
          aria-label="VXK TECH Internet Access Captive Portal"
          className="lg:col-span-7 border rounded-md overflow-hidden shadow-2xl"
          style={{
            backgroundColor: '#002238',
            borderColor: '#bfcbd4',
            color: '#f5f6f7',
            fontFamily: "Consolas, 'Courier New', monospace",
          }}
        >
          <div className="max-w-[720px] mx-auto px-5 sm:px-8">
            {/* Portal Header */}
            <div
              className="flex items-center gap-3.5 py-6 sm:py-7 border-b"
              style={{ borderColor: '#bfcbd4' }}
            >
              <img
                src={VXK_LOGO_DATA_URI}
                alt="VXK logo"
                width={165}
                height={80}
                className="w-[115px] sm:w-[155px] h-auto shrink-0 border border-[#839aa8]/40"
              />
              <div>
                <div
                  className="font-bold leading-[1.1] tracking-tight text-3xl sm:text-[40px]"
                  style={{ fontFamily: "'Arial Narrow', Arial, sans-serif", color: '#f5f6f7' }}
                >
                  VXK TECH
                </div>
                <div
                  className="text-sm sm:text-[17px] leading-[1.7] tracking-[5px] sm:tracking-[6px]"
                  style={{ fontFamily: "Consolas, monospace", color: '#f5f6f7' }}
                >
                  INTERNET
                </div>
              </div>
            </div>

            {/* Step 1: Turn off mobile data */}
            <div
              className="grid grid-cols-[36px_1fr] gap-4 py-5 border-b"
              style={{ borderColor: '#bfcbd4' }}
            >
              <span
                aria-hidden="true"
                className="h-[38px] leading-[36px] text-[25px] font-bold text-center border"
                style={{ borderColor: '#839aa8' }}
              >
                1
              </span>
              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold uppercase m-0"
                  style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}
                >
                  Turn off mobile data
                </h2>
                <p className="text-sm mt-1.5" style={{ color: '#f5f6f7' }}>
                  Stay connected to this Wi-Fi network.
                </p>
              </div>
            </div>

            {/* Step 2: Enter your voucher */}
            <div
              className="grid grid-cols-[36px_1fr] gap-4 py-5 border-b"
              style={{ borderColor: '#bfcbd4' }}
            >
              <span
                aria-hidden="true"
                className="h-[38px] leading-[36px] text-[25px] font-bold text-center border"
                style={{ borderColor: '#839aa8' }}
              >
                2
              </span>
              <div className="min-w-0">
                <form id="voucher-form" onSubmit={handleSubmitVoucher} noValidate>
                <h2
                  className="text-xl sm:text-2xl font-bold uppercase m-0"
                  style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}
                >
                  Enter your voucher
                </h2>
                <label htmlFor="voucher" className="block font-bold mt-3 mb-2 text-base">
                  Voucher code
                </label>

                <input
                  id="voucher"
                  name="auth_voucher"
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Enter your voucher code"
                  required
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full px-3 py-3 text-base rounded-[3px] border focus:outline focus:outline-[3px] focus:outline-white focus:outline-offset-[3px]"
                  style={{
                    backgroundColor: '#092c41',
                    borderColor: '#bfcbd4',
                    color: '#f5f6f7',
                  }}
                />

                {errors.voucherCode && (
                  <p
                    className="mt-2 p-2.5 text-[13px] border flex items-center gap-1.5"
                    style={{ backgroundColor: '#4c1122', borderColor: '#b20d28', color: '#f5f6f7' }}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errors.voucherCode}</span>
                  </p>
                )}

                {/* Quick sample pins */}
                <div className="mt-3">
                  <div
                    className="text-[11px] uppercase tracking-wider mb-1.5"
                    style={{ color: '#bfcbd4' }}
                  >
                    Quick-fill voucher PIN:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CAPTIVE_VOUCHERS.map((pv) => (
                      <button
                        key={pv.code}
                        type="button"
                        onClick={() => handleFillSampleCode(pv.code)}
                        className="px-2 py-1 text-[11px] rounded-[3px] border transition hover:bg-[#20475b]"
                        style={{
                          backgroundColor: '#103449',
                          borderColor: '#839aa8',
                          color: '#f5f6f7',
                        }}
                      >
                        <span className="font-bold">{pv.code}</span>{' '}
                        <span style={{ color: '#bfcbd4' }}>({pv.priceZar})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Connect Button */}
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="block w-full mt-3.5 py-3 px-2.5 text-center font-bold text-[22px] rounded-[3px] border transition cursor-pointer hover:bg-[#cc1735] disabled:opacity-70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-white"
                  style={{
                    backgroundColor: '#b20d28',
                    borderColor: '#bfcbd4',
                    color: '#f5f6f7',
                  }}
                >
                  {isDispatching ? 'Sending to pfSense+...' : 'Connect'}
                </button>

                <label
                  className="mt-2.5 flex items-center gap-2 text-[11px] cursor-pointer select-none"
                  style={{ color: '#bfcbd4' }}
                >
                  <input
                    type="checkbox"
                    checked={autoDirectLanSubmit}
                    onChange={(e) => setAutoDirectLanSubmit(e.target.checked)}
                    className="rounded border-[#839aa8]"
                  />
                  <span>
                    Direct Wi-Fi router handoff on Connect (submits straight to pfSense+ LAN IP)
                  </span>
                </label>

                {/* Buy a voucher */}
                <a
                  href="https://secure.vxktech.co.za/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full mt-3.5 py-3 px-2.5 text-center font-bold text-[18px] rounded-[3px] border transition no-underline hover:bg-[#f5f6f7]"
                  style={{
                    backgroundColor: '#dce3e6',
                    borderColor: '#bfcbd4',
                    color: '#002238',
                  }}
                >
                  Buy a voucher →
                </a>
                <p className="text-center text-xs mt-2.5" style={{ color: '#bfcbd4' }}>
                  Choose your bundle and pay online
                </p>

                {/* Collapsible Gateway / Client MAC options */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowGatewayOptions((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-[11px] underline underline-offset-4 hover:text-white"
                    style={{ color: '#bfcbd4' }}
                  >
                    <Router className="w-3.5 h-3.5" />
                    <span>pfSense+ Target Gateway &amp; Client Options</span>
                    {showGatewayOptions ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showGatewayOptions && (
                    <div
                      className="mt-2.5 p-3 border rounded-[3px] space-y-2.5 text-xs"
                      style={{ backgroundColor: '#103449', borderColor: '#839aa8' }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold mb-1">
                            Captive Gateway Router:
                          </label>
                          <select
                            value={selectedGatewayId}
                            onChange={(e) => handleGatewayChange(e.target.value)}
                            aria-label="Captive Gateway Router"
                            className="w-full px-2.5 py-2 border rounded-[3px] text-xs"
                            style={{
                              backgroundColor: '#092c41',
                              borderColor: '#bfcbd4',
                              color: '#f5f6f7',
                            }}
                          >
                            {partnerDevices.map((dev) => (
                              <option key={dev.id} value={dev.id}>
                                {dev.gatewayIp} — {dev.partnerBusinessName} ({dev.brandName})
                              </option>
                            ))}
                            <option value="__ALL__">
                              ALL HUBS ({partnerDevices.length} Routers) — Broadcast via pfSense+
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold mb-1">
                            Subscriber Name (Optional):
                          </label>
                          <input
                            type="text"
                            value={subscriberName}
                            onChange={(e) => setSubscriberName(e.target.value)}
                            placeholder="e.g. Sipho Guest"
                            className="w-full px-2.5 py-2 border rounded-[3px] text-xs"
                            style={{
                              backgroundColor: '#092c41',
                              borderColor: '#bfcbd4',
                              color: '#f5f6f7',
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold mb-1">
                            Client Hardware MAC:
                          </label>
                          <input
                            type="text"
                            value={clientMac}
                            onChange={(e) => setClientMac(e.target.value)}
                            className="w-full px-2.5 py-2 border rounded-[3px] text-xs"
                            style={{
                              backgroundColor: '#092c41',
                              borderColor: '#bfcbd4',
                              color: '#f5f6f7',
                            }}
                          />
                          {errors.clientMac && (
                            <p className="text-[11px] text-red-300 mt-1">{errors.clientMac}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold mb-1">
                            Portal Zone (zone):
                          </label>
                          <input
                            type="text"
                            value={portalZone}
                            onChange={(e) => setPortalZone(e.target.value)}
                            className="w-full px-2.5 py-2 border rounded-[3px] text-xs"
                            style={{
                              backgroundColor: '#092c41',
                              borderColor: '#bfcbd4',
                              color: '#f5f6f7',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1">
                          Redirect Destination (redirurl):
                        </label>
                        <input
                          type="text"
                          value={redirectUrl}
                          onChange={(e) => setRedirectUrl(e.target.value)}
                          className="w-full px-2.5 py-2 border rounded-[3px] text-xs"
                          style={{
                            backgroundColor: '#092c41',
                            borderColor: '#bfcbd4',
                            color: '#f5f6f7',
                          }}
                        />
                      </div>

                      <label className="flex items-start gap-2 text-[11px] cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          Accept VXK TECH Acceptable Use Policy &amp; transmit voucher directly to pfSense+.
                        </span>
                      </label>
                      {errors.acceptedTerms && (
                        <p className="text-[11px] text-red-300">{errors.acceptedTerms}</p>
                      )}
                    </div>
                  )}
                </div>
                </form>

                {/* Hidden native browser form for instant 1-click LAN POST to pfSense+ */}
                <form
                  ref={directSubmitFormRef}
                  method="post"
                  action={portalEndpointUrl}
                  className="hidden"
                  aria-hidden="true"
                >
                  <input type="hidden" name="auth_voucher" defaultValue="" />
                  <input type="hidden" name="redirurl" defaultValue={redirectUrl} />
                  <input type="hidden" name="zone" defaultValue={portalZone} />
                  <input type="hidden" name="accept" value="Continue" />
                </form>

                {/* Live pfSense Relay Notice */}
                {portalNotice && (
                  <div
                    id="preview-message"
                    role="status"
                    className="mt-3 p-3 text-[13px] border space-y-2.5"
                    style={{
                      backgroundColor: '#244258',
                      borderColor: '#bfcbd4',
                      color: '#f5f6f7',
                    }}
                  >
                    {lastDeliveryBadge && (
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                        {lastDeliveryBadge}
                      </div>
                    )}
                    <p className="m-0 leading-relaxed">{portalNotice}</p>

                    {/* Direct Browser Form POST fallback/action for Wi-Fi hotspot LAN clients */}
                    {directLanPayload && (
                      <form
                        method="post"
                        action={directLanPayload.actionUrl}
                        target={
                          typeof window !== 'undefined' && window.top === window.self
                            ? '_self'
                            : '_blank'
                        }
                        className="pt-1"
                      >
                        <input
                          type="hidden"
                          name="auth_voucher"
                          value={directLanPayload.authVoucher}
                        />
                        <input type="hidden" name="redirurl" value={directLanPayload.redirurl} />
                        <input type="hidden" name="zone" value={directLanPayload.zone} />
                        <button
                          type="submit"
                          name="accept"
                          value="Continue"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border rounded-[3px] cursor-pointer transition hover:bg-[#cc1735]"
                          style={{
                            backgroundColor: '#b20d28',
                            borderColor: '#bfcbd4',
                            color: '#f5f6f7',
                          }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Direct via Wi-Fi Browser to {directLanPayload.actionUrl}</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Need a voucher? / Pricing section */}
            <section aria-labelledby="pricing">
              <div className="pt-5 pb-4">
                <h1
                  id="pricing"
                  className="text-3xl sm:text-[38px] font-bold leading-[1.15] uppercase m-0"
                  style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}
                >
                  Need a voucher?
                </h1>
                <p
                  className="text-[17px] font-bold uppercase tracking-[1px] mt-1.5"
                  style={{ fontFamily: "'Arial Narrow', Arial, sans-serif", color: '#bfcbd4' }}
                >
                  Unlimited data bundles
                </p>
              </div>

              <div className="border-y border-l-2" style={{ borderColor: '#bfcbd4' }}>
                <h3
                  className="px-3.5 py-2.5 text-[19px] font-bold uppercase m-0"
                  style={{ backgroundColor: '#103449', fontFamily: "'Arial Narrow', Arial, sans-serif" }}
                >
                  Single-device bundles
                </h3>
                <table
                  aria-label="Single-device bundle prices"
                  className="border-collapse w-[calc(100%-28px)] mx-3.5"
                >
                  <tbody>
                    {SINGLE_DEVICE_BUNDLES.map((row) => (
                      <tr key={row.duration}>
                        <td className="py-2.5 border-t" style={{ borderColor: '#839aa8' }}>
                          <button
                            type="button"
                            onClick={() => handleFillSampleCode(row.sampleCode)}
                            className="text-left hover:underline"
                            title={`Fill sample voucher ${row.sampleCode}`}
                          >
                            {row.duration}
                          </button>
                        </td>
                        <td
                          className="py-2.5 border-t text-right whitespace-nowrap font-bold"
                          style={{ borderColor: '#839aa8' }}
                        >
                          {row.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Family Wi-Fi */}
              <section
                aria-labelledby="family-title"
                className="p-4 mt-4 border-y border-l-[6px]"
                style={{
                  borderTopColor: '#bfcbd4',
                  borderBottomColor: '#bfcbd4',
                  borderLeftColor: '#b20d28',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2
                    id="family-title"
                    className="text-2xl font-bold uppercase m-0"
                    style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}
                  >
                    Family Wi-Fi
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleFillSampleCode('VXK-FAM3-0350-WIFI')}
                    className="text-[11px] px-2 py-0.5 border rounded-[3px] hover:bg-[#20475b]"
                    style={{ borderColor: '#839aa8', color: '#bfcbd4' }}
                  >
                    Sample PIN
                  </button>
                </div>
                <p
                  className="flex justify-between gap-3 text-xl font-bold border-t mt-3 pt-3"
                  style={{ borderColor: '#839aa8' }}
                >
                  <span>30 days</span>
                  <span>R350.00</span>
                </p>
                <p className="text-sm m-0" style={{ color: '#f5f6f7' }}>
                  For family use
                </p>

                <div className="border-t mt-3.5 pt-3.5" style={{ borderColor: '#839aa8' }}>
                  <h3
                    className="text-[19px] font-bold uppercase m-0"
                    style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}
                  >
                    Account activation required
                  </h3>
                  <p className="text-sm leading-[1.6] mt-1.5 mb-3.5">
                    After payment, send your voucher code and bank payment reference to WhatsApp{' '}
                    <strong>075 444 8267</strong> so we can activate your account.
                  </p>
                  <a
                    href="https://wa.me/27754448267"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 px-2.5 text-center font-bold text-[18px] rounded-[3px] border no-underline transition hover:bg-[#20475b]"
                    style={{ borderColor: '#bfcbd4', color: '#f5f6f7' }}
                  >
                    WhatsApp to activate
                  </a>
                  <a
                    href="https://wa.me/27754448267"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-[25px] font-bold whitespace-nowrap mt-2 no-underline hover:underline"
                    style={{ color: '#f5f6f7' }}
                  >
                    075 444 8267
                  </a>
                </div>
              </section>

              <div className="py-5 border-b text-center" style={{ borderColor: '#bfcbd4' }}>
                <p className="text-xs leading-[1.6] m-0">
                  Continue to{' '}
                  <a
                    href="https://secure.vxktech.co.za/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold"
                    style={{ color: '#f5f6f7' }}
                  >
                    secure.vxktech.co.za
                  </a>{' '}
                  to pay.
                  <br />
                  Your voucher appears after payment and is emailed to you.
                </p>
              </div>
            </section>

            <section className="text-center py-4 border-b" style={{ borderColor: '#bfcbd4' }}>
              <h3
                className="text-[17px] font-bold uppercase m-0"
                style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}
              >
                Family Wi-Fi activation
              </h3>
              <a
                href="https://wa.me/27754448267"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[25px] font-bold whitespace-nowrap mt-1.5 no-underline hover:underline"
                style={{ color: '#f5f6f7' }}
              >
                075 444 8267
              </a>
            </section>

            <section className="text-center py-4 border-b" style={{ borderColor: '#bfcbd4' }}>
              <h3
                className="text-[17px] font-bold uppercase m-0"
                style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}
              >
                Payments &amp; technical support
              </h3>
              <p className="text-[13px] mt-1.5" style={{ color: '#f5f6f7' }}>
                Chat directly with the network programmer
              </p>
              <a
                href="https://wa.me/27817010952"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[25px] font-bold whitespace-nowrap mt-1.5 no-underline hover:underline"
                style={{ color: '#f5f6f7' }}
              >
                081 701 0952
              </a>
              <a
                href="https://wa.me/27817010952"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full max-w-[310px] mx-auto mt-2.5 py-3 px-2.5 text-center font-bold text-[18px] rounded-[3px] border no-underline transition hover:bg-[#20475b]"
                style={{ borderColor: '#bfcbd4', color: '#f5f6f7' }}
              >
                WhatsApp support
              </a>
            </section>

            <div className="text-center text-[11px] py-5" style={{ color: '#bfcbd4' }}>
              © 2026{' '}
              <a
                href="https://chauke.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
                style={{ color: 'inherit' }}
              >
                chauke.org
              </a>
              . All rights reserved.
            </div>
          </div>
        </section>

        {/* Right Column: Live Session Receipt + Back-to-Back pfSense+ Relay Controller + Live Dispatch Log */}
        <div className="lg:col-span-5 space-y-6">
          {expiredSessionNotice && !activeSession && (
            <div
              className="border rounded-xl p-4 shadow-xl space-y-1.5 text-xs font-mono"
              style={{ backgroundColor: '#4c1122', borderColor: '#b20d28', color: '#f5f6f7' }}
              role="alert"
            >
              <div className="flex items-center justify-between gap-2 font-bold text-sm">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <span>Voucher Period Expired (Time Up)</span>
                </span>
                {onClearExpiredNotice && (
                  <button
                    type="button"
                    onClick={onClearExpiredNotice}
                    className="text-xs px-2 py-0.5 border border-white/40 rounded hover:bg-white/10"
                  >
                    Dismiss
                  </button>
                )}
              </div>
              <p className="m-0 leading-relaxed">{expiredSessionNotice}</p>
            </div>
          )}

          {activeSession && (
            <div
              className="border rounded-xl p-5 shadow-xl space-y-4"
              style={{
                backgroundColor: '#002238',
                borderColor: '#13e511',
                borderWidth: '2px',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#839aa8]/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-black text-white">
                    Internet Access Authorized!
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60">
                  <span
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: '#00f302' }}
                  />
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-[#103449] border border-[#839aa8]/50">
                  <span className="text-[10px] uppercase text-[#bfcbd4] block">
                    Time Remaining
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-300 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4" />
                    {formatRemainingCountdown(activeSession.expiresAtMs, nowMs)}
                  </span>
                </div>
                <div className="p-3 rounded bg-[#103449] border border-[#839aa8]/50">
                  <span className="text-[10px] uppercase text-[#bfcbd4] block">
                    Approved Speed / Period
                  </span>
                  <span className="text-sm font-black text-white block mt-0.5">
                    {activeSession.downMbps}/{activeSession.upMbps} Mbps •{' '}
                    {activeSession.periodLabel || `${activeSession.quotaMb} MB`}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#092c41] border border-[#839aa8]/50 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between gap-2">
                  <span className="text-[#bfcbd4]">Active Voucher PIN:</span>
                  <span className="font-bold text-emerald-300">{activeSession.voucherCode}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#bfcbd4]">Till Gateway ID:</span>
                  <span className="font-bold text-cyan-200">
                    {activeSession.gatewayTag || DEFAULT_TILL_GATEWAY_TAG}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#bfcbd4]">Gateway Endpoint:</span>
                  <span className="text-cyan-200 truncate">{activeSession.gatewayUrl}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#bfcbd4]">Subscriber / MAC:</span>
                  <span className="text-white text-right">
                    {activeSession.subscriberName} ({activeSession.clientMac})
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onOpenPartnerDashboard}
                  className="flex-1 py-2.5 px-4 rounded bg-[#103449] hover:bg-[#20475b] text-white font-bold text-xs border border-[#bfcbd4] flex items-center justify-center gap-1.5 transition"
                >
                  <Globe className="w-4 h-4" />
                  <span>See Session in Live Monitor</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDisconnectVoucherSession(activeSession)}
                  className="py-2.5 px-4 rounded bg-[#b20d28] hover:bg-[#cc1735] border border-[#bfcbd4] text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Power className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Back-to-Back pfSense+ Gateway Configuration */}
          <div
            className="border rounded-xl p-5 shadow-xl space-y-4"
            style={{ backgroundColor: '#002238', borderColor: '#bfcbd4' }}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#839aa8]/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>pfSense+ Live Endpoint Bridge</span>
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  pingState.status === 'reachable'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                    : pingState.status === 'unreachable'
                    ? 'bg-amber-950 text-amber-200 border-amber-500/60'
                    : 'bg-[#103449] text-[#bfcbd4] border-[#839aa8]'
                }`}
              >
                {pingState.status === 'reachable'
                  ? `ONLINE HTTP ${pingState.httpStatus} (${pingState.latencyMs}ms)`
                  : pingState.status === 'unreachable'
                  ? 'LAN / UNREACHABLE'
                  : 'READY'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-[#bfcbd4] mb-1">
                    pfSense+ Portal URL (WAN / DDNS / LAN):
                  </label>
                  <input
                    type="url"
                    value={portalEndpointUrl}
                    onChange={(e) => setPortalEndpointUrl(e.target.value)}
                    placeholder="https://192.168.1.1:8003/index.php?zone=vxk_partner_portal"
                    className="w-full px-3 py-2 rounded border text-xs"
                    style={{
                      backgroundColor: '#092c41',
                      borderColor: '#839aa8',
                      color: '#f5f6f7',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#bfcbd4] mb-1">
                    Portal Zone ID:
                  </label>
                  <input
                    type="text"
                    value={portalZone}
                    onChange={(e) => {
                      const nextZone = e.target.value;
                      setPortalZone(nextZone);
                      setPortalEndpointUrl((prev) =>
                        normalizePfsenseActionUrl({
                          rawUrl: prev,
                          zone: nextZone,
                          overrideZone: true,
                        })
                      );
                    }}
                    placeholder="vxk_partner_portal"
                    className="w-full px-3 py-2 rounded border text-xs"
                    style={{
                      backgroundColor: '#092c41',
                      borderColor: '#839aa8',
                      color: '#f5f6f7',
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setPortalEndpointUrl(
                      normalizePfsenseActionUrl({
                        gatewayIp: selectedGateway?.gatewayIp || '192.168.1.1',
                        port: 8002,
                        zone: portalZone,
                      })
                    )
                  }
                  className="px-2.5 py-1 rounded border text-[11px] hover:bg-[#20475b]"
                  style={{ backgroundColor: '#092c41', borderColor: '#839aa8', color: '#bfcbd4' }}
                >
                  HTTP :8002 (Stock LAN)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPortalEndpointUrl(
                      normalizePfsenseActionUrl({
                        gatewayIp: selectedGateway?.gatewayIp || '192.168.1.1',
                        port: 8003,
                        zone: portalZone,
                      })
                    )
                  }
                  className="px-2.5 py-1 rounded border text-[11px] hover:bg-[#20475b]"
                  style={{ backgroundColor: '#092c41', borderColor: '#839aa8', color: '#bfcbd4' }}
                >
                  HTTPS :8003 (SSL Portal)
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveBridgeConfig}
                  className="flex-1 py-2 px-3 rounded border font-bold text-xs transition hover:bg-[#20475b]"
                  style={{ backgroundColor: '#103449', borderColor: '#bfcbd4', color: '#f5f6f7' }}
                >
                  Save Gateway Target
                </button>
                <button
                  type="button"
                  onClick={handlePingPfsense}
                  className="flex-1 py-2 px-3 rounded border font-bold text-xs transition hover:bg-[#cc1735]"
                  style={{ backgroundColor: '#b20d28', borderColor: '#bfcbd4', color: '#f5f6f7' }}
                >
                  Probe Live pfSense+
                </button>
              </div>

              <p className="text-[11px] leading-relaxed m-0" style={{ color: '#bfcbd4' }}>
                {configSavedNotice || pingState.detail}
              </p>
            </div>

            <div className="pt-2 border-t border-[#839aa8]/40 space-y-2 text-xs font-mono">
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://192.168.1.1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded border text-center inline-flex items-center justify-center gap-1.5 hover:bg-[#20475b]"
                  style={{ backgroundColor: '#092c41', borderColor: '#839aa8', color: '#f5f6f7' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open 192.168.1.1</span>
                </a>
                <a
                  href="./assets/aistudio/html__3__64f24cc5.html"
                  download="vxk-captive-portal.html"
                  className="flex-1 py-2 px-3 rounded border text-center inline-flex items-center justify-center gap-1.5 hover:bg-[#20475b]"
                  style={{ backgroundColor: '#103449', borderColor: '#bfcbd4', color: '#f5f6f7' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Direct HTML</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowPfsenseSetup((v) => !v)}
                className="w-full py-2 px-3 rounded border text-left flex items-center justify-between hover:bg-[#20475b]"
                style={{ backgroundColor: '#092c41', borderColor: '#839aa8', color: '#bfcbd4' }}
              >
                <span>pfSense+ Router Setup (Link Website Live to Router)</span>
                {showPfsenseSetup ? (
                  <ChevronUp className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                )}
              </button>

              {showPfsenseSetup && (
                <div
                  className="p-3 rounded border space-y-2.5 text-[11px] leading-relaxed"
                  style={{ backgroundColor: '#092c41', borderColor: '#839aa8', color: '#f5f6f7' }}
                >
                  <p className="m-0 text-emerald-300 font-bold">
                    2-step setup so pfSense+ accepts vouchers straight from this site:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 m-0 text-[#bfcbd4]">
                    <li>
                      In pfSense+ (<strong>Services → Captive Portal → Allowed Hostnames</strong>),
                      add:{' '}
                      <code className="text-white">
                        {typeof window !== 'undefined' ? window.location.hostname : 'vxktech.co.za'}
                      </code>{' '}
                      and <code className="text-white">secure.vxktech.co.za</code>.
                    </li>
                    <li>
                      Upload the redirector HTML below under{' '}
                      <strong>Services → Captive Portal → Portal page contents</strong> so pfSense+
                      passes your live <code>$PORTAL_ACTION$</code> &amp; <code>$PORTAL_ZONE$</code>{' '}
                      straight here, or upload <strong>Direct HTML</strong> for offline local router
                      login.
                    </li>
                  </ol>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const origin =
                          typeof window !== 'undefined'
                            ? window.location.origin
                            : 'https://vxktech.co.za';
                        const html = buildPfsenseRedirectorHtml(origin);
                        navigator.clipboard?.writeText(html);
                        setCopiedSetupItem('redirect-html');
                        setTimeout(() => setCopiedSetupItem(''), 2500);
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded border inline-flex items-center justify-center gap-1.5 hover:bg-[#20475b]"
                      style={{ backgroundColor: '#103449', borderColor: '#bfcbd4' }}
                    >
                      {copiedSetupItem === 'redirect-html' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedSetupItem === 'redirect-html'
                          ? 'Copied Redirect HTML'
                          : 'Copy Redirect HTML'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const origin =
                          typeof window !== 'undefined'
                            ? window.location.origin
                            : 'https://vxktech.co.za';
                        const blob = new Blob([buildPfsenseRedirectorHtml(origin)], {
                          type: 'text/html;charset=utf-8',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'pfsense-redirect-portal.html';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded border inline-flex items-center justify-center gap-1.5 hover:bg-[#20475b]"
                      style={{ backgroundColor: '#b20d28', borderColor: '#bfcbd4' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Redirect HTML</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Back-to-Back pfSense Dispatch Log */}
          <div
            className="border rounded-xl p-5 shadow-xl space-y-3"
            style={{ backgroundColor: '#002238', borderColor: '#839aa8' }}
          >
            <h3 className="text-sm font-bold text-white flex items-center justify-between gap-2 pb-2 border-b border-[#839aa8]/50">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Back-to-Back pfSense+ Dispatch Log ({dispatchLog.length})</span>
              </span>
            </h3>
            {dispatchLog.length === 0 ? (
              <p className="text-xs font-mono" style={{ color: '#bfcbd4' }}>
                No voucher dispatches sent to pfSense+ yet. Submit a voucher code on the left to
                transmit <code>auth_voucher</code> live to pfSense+.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {dispatchLog.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded border text-[11px] font-mono space-y-1"
                    style={{ backgroundColor: '#092c41', borderColor: '#839aa8' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{rec.voucherCodeMasked}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rec.outcome === 'authorized'
                            ? 'bg-emerald-950 text-emerald-300'
                            : rec.outcome === 'rejected'
                            ? 'bg-red-950 text-red-300'
                            : 'bg-amber-950 text-amber-200'
                        }`}
                      >
                        {rec.outcome}
                        {rec.httpStatus ? ` • ${rec.httpStatus}` : ''}
                      </span>
                    </div>
                    <div className="text-[#bfcbd4] truncate">{rec.targetUrl}</div>
                    <div className="text-[10px] text-slate-300 leading-snug">{rec.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Support & Payment Quick Links Summary + Recent Activations */}
          <div
            className="border rounded-xl p-5 shadow-xl space-y-3"
            style={{ backgroundColor: '#002238', borderColor: '#839aa8' }}
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-[#839aa8]/50">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Portal Links &amp; Activations ({sessionHistory.length})</span>
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#bfcbd4]">Online Voucher Payment:</span>
                <a
                  href="https://secure.vxktech.co.za/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline"
                >
                  secure.vxktech.co.za
                </a>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#bfcbd4]">Family Wi-Fi Activation:</span>
                <a
                  href="https://wa.me/27754448267"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-bold hover:underline"
                >
                  075 444 8267
                </a>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#bfcbd4]">Payments &amp; Tech Support:</span>
                <a
                  href="https://wa.me/27817010952"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-bold hover:underline"
                >
                  081 701 0952
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-[#839aa8]/40 flex items-center justify-between text-xs">
              <span className="text-[#bfcbd4]">Voucher rejected or already used?</span>
              <button
                type="button"
                onClick={onOpenVoucherReporting}
                className="text-amber-300 hover:text-amber-200 font-bold inline-flex items-center gap-1"
              >
                <span>Report Voucher Error</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
