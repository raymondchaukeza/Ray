import {
  CaptiveDevice,
  IssuedTimedVoucher,
  LiveConnectedUser,
  PartnerDevice,
  VoucherDurationUnit,
} from '../types/index.ts';
import { validateVoucherCode } from './ticketRules.ts';
import { PFSENSE_AUTHORITY_CONFIG, validateMacAddress } from './partnerRules.ts';

export const DEFAULT_TILL_GATEWAY_TAG = 'vxk-GiyaniShop770';
export const CUSTOM_TIMED_VOUCHER_VALUE = 'Hotspot Voucher: Custom Period (Own Choice)';

export interface TimedVoucherTierOption {
  value: string;
  label: string;
  durationAmount: number;
  durationUnit: VoucherDurationUnit;
  durationMinutes: number;
  priceZar: string;
  downMbps: number;
  upMbps: number;
  quotaMb: number;
}

export const TIMED_VOUCHER_TIER_OPTIONS: TimedVoucherTierOption[] = [
  {
    value: 'Hotspot Voucher: 1 Hour @R5',
    label: '1 Hour Timed Hotspot Voucher (@R5)',
    durationAmount: 1,
    durationUnit: 'hours',
    durationMinutes: 60,
    priceZar: 'R5.00',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 2000,
  },
  {
    value: 'Hotspot Voucher: 3 Hours @R8',
    label: '3 Hours Timed Hotspot Voucher (@R8)',
    durationAmount: 3,
    durationUnit: 'hours',
    durationMinutes: 180,
    priceZar: 'R8.00',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 3500,
  },
  {
    value: 'Hotspot Voucher: 12 Hours @R10',
    label: '12 Hours Timed Hotspot Voucher (@R10)',
    durationAmount: 12,
    durationUnit: 'hours',
    durationMinutes: 720,
    priceZar: 'R10.00',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 5000,
  },
  {
    value: 'Hotspot Voucher: 24 Hours @R15',
    label: '24 Hours Timed Hotspot Voucher (@R15)',
    durationAmount: 24,
    durationUnit: 'hours',
    durationMinutes: 1440,
    priceZar: 'R15.00',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 8000,
  },
  {
    value: 'Hotspot Voucher: 3 Days @R25',
    label: '3 Days Timed Hotspot Voucher (@R25)',
    durationAmount: 3,
    durationUnit: 'days',
    durationMinutes: 4320,
    priceZar: 'R25.00',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 15000,
  },
  {
    value: 'Hotspot Voucher: 7 Days @R35',
    label: '7 Days Timed Hotspot Voucher (@R35)',
    durationAmount: 7,
    durationUnit: 'days',
    durationMinutes: 10080,
    priceZar: 'R35.00',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 25000,
  },
  {
    value: 'Hotspot Voucher: 30 Days @R150',
    label: '30 Days Timed Hotspot Voucher (@R150)',
    durationAmount: 30,
    durationUnit: 'days',
    durationMinutes: 43200,
    priceZar: 'R150.00',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 100000,
  },
];

export interface PresetCaptiveVoucher {
  code: string;
  tierLabel: string;
  downMbps: number;
  upMbps: number;
  quotaMb: number;
  durationMinutes: number;
  priceZar: string;
}

export const PRESET_CAPTIVE_VOUCHERS: PresetCaptiveVoucher[] = [
  {
    code: 'VXK-7712-9901-4421',
    tierLabel: '24 hours Unlimited (Single-device)',
    downMbps: 10,
    upMbps: 5,
    quotaMb: 5000,
    durationMinutes: 1440,
    priceZar: 'R10.00',
  },
  {
    code: 'VXK-12HR-0005-PASS',
    tierLabel: '12 hours Unlimited (Single-device)',
    downMbps: 10,
    upMbps: 5,
    quotaMb: 2500,
    durationMinutes: 720,
    priceZar: 'R5.00',
  },
  {
    code: 'VXK-9042-1188-3210',
    tierLabel: '7 days Unlimited (Single-device)',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 10000,
    durationMinutes: 10080,
    priceZar: 'R30.00',
  },
  {
    code: 'VXK-14DY-0060-PASS',
    tierLabel: '14 days Unlimited (Single-device)',
    downMbps: 20,
    upMbps: 10,
    quotaMb: 20000,
    durationMinutes: 20160,
    priceZar: 'R60.00',
  },
  {
    code: 'VXK-FAM3-0350-WIFI',
    tierLabel: 'Family Wi-Fi 30 days (Multi-device)',
    downMbps: 50,
    upMbps: 25,
    quotaMb: 100000,
    durationMinutes: 43200,
    priceZar: 'R350.00',
  },
];

export interface CaptiveVoucherSession {
  id: string;
  voucherCode: string;
  tierLabel: string;
  gatewayUrl: string;
  gatewayIp: string;
  gatewayTag?: string;
  portalZone: string;
  routerBrand: string;
  partnerVenue: string;
  clientMac: string;
  clientIp: string;
  subscriberName: string;
  accountNumber: string;
  connectedAtMs: number;
  expiresAtMs: number;
  durationMinutes?: number;
  periodLabel?: string;
  quotaMb: number;
  downMbps: number;
  upMbps: number;
  redirectUrl: string;
}

export interface VoucherRedeemInput {
  voucherCode: string;
  subscriberName: string;
  accountNumber?: string;
  clientMac: string;
  clientIp: string;
  gatewayDevice: PartnerDevice;
  acceptedTerms: boolean;
  redirectUrl?: string;
  nowMs?: number;
  issuedVouchers?: IssuedTimedVoucher[];
  gatewayTag?: string;
}

export interface VoucherRedeemResult {
  ok: boolean;
  errors: Record<string, string>;
  session?: CaptiveVoucherSession;
  liveUserEntry?: LiveConnectedUser;
  captiveDeviceEntry?: CaptiveDevice;
  matchedIssuedVoucher?: IssuedTimedVoucher;
}

export function calculateDurationMinutes(amount: number, unit: VoucherDurationUnit): number {
  const safeAmount = Number.isFinite(amount) ? Math.floor(amount) : 0;
  if (safeAmount <= 0) return 0;
  if (unit === 'minutes') return safeAmount;
  if (unit === 'hours') return safeAmount * 60;
  return safeAmount * 1440;
}

export function formatDurationLabel(durationMinutes: number): string {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return '0 minutes';
  if (durationMinutes % 1440 === 0) {
    const days = durationMinutes / 1440;
    return `${days} ${days === 1 ? 'Day' : 'Days'}`;
  }
  if (durationMinutes % 60 === 0) {
    const hours = durationMinutes / 60;
    return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
  }
  if (durationMinutes >= 60) {
    const hrs = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return `${hrs}h ${mins}m`;
  }
  return `${durationMinutes} ${durationMinutes === 1 ? 'Minute' : 'Minutes'}`;
}

export interface IssuePartnerReceiptVoucherInput {
  buyerName: string;
  buyerPhone?: string;
  purchaseItem: string;
  priceZar?: string;
  durationAmount: number;
  durationUnit: VoucherDurationUnit;
  gatewayTag?: string;
  gatewayIp?: string;
  portalZone?: string;
  downMbps?: number;
  upMbps?: number;
  quotaMb?: number;
  portalOrigin?: string;
  nowMs?: number;
  customSeed?: string;
}

export function issuePartnerReceiptVoucher(input: IssuePartnerReceiptVoucherInput): {
  ok: boolean;
  error?: string;
  voucher?: IssuedTimedVoucher;
} {
  const amount = Math.floor(Number(input.durationAmount));
  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, error: 'Choose a valid voucher period (minimum 1 minute).' };
  }
  const durationMinutes = calculateDurationMinutes(amount, input.durationUnit);
  if (durationMinutes < 1 || durationMinutes > 525600) {
    return {
      ok: false,
      error: 'Voucher period must be between 1 minute and 365 days.',
    };
  }

  const nowMs = input.nowMs ?? Date.now();
  const gatewayTag = (input.gatewayTag || DEFAULT_TILL_GATEWAY_TAG).trim() || DEFAULT_TILL_GATEWAY_TAG;
  const gatewayIp = (input.gatewayIp || '192.168.1.1').trim() || '192.168.1.1';
  const portalZone = (input.portalZone || 'vxk_partner_portal').trim() || 'vxk_partner_portal';
  const buyerName = input.buyerName.trim() || 'Walk-in Shop Customer';
  const purchaseItem = input.purchaseItem.trim() || 'Partner Purchase Wi-Fi Access';
  const periodLabel = formatDurationLabel(durationMinutes);
  const priceZar = (input.priceZar || 'Included with Purchase').trim();
  const downMbps = input.downMbps ?? 20;
  const upMbps = input.upMbps ?? 10;
  const quotaMb = input.quotaMb ?? Math.max(500, Math.min(100000, durationMinutes * 10));

  const timeBlock = String(nowMs).slice(-4);
  const randHex = (
    input.customSeed || Math.floor(1000 + Math.random() * 9000).toString()
  )
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .padEnd(4, '7')
    .slice(0, 4);
  const displayCode = `VXK-770-${timeBlock}-${randHex}`;
  const voucherCode = displayCode.replace(/[\s\-]/g, '').toUpperCase();
  const receiptNumber = `TILL-770-${timeBlock}${randHex.slice(0, 2)}`;
  const issuedAtIso = new Date(nowMs).toISOString();
  const issuedAtDisplay = `${issuedAtIso.replace('T', ' ').slice(0, 16)} UTC`;

  const cleanOrigin = (input.portalOrigin || 'https://vxktech.co.za/prepaid').replace(/\/+$/, '');
  const portalLoginUrl = `${cleanOrigin}/?q=captive-portal-login&gateway=${encodeURIComponent(
    gatewayTag
  )}&voucher=${encodeURIComponent(displayCode)}&zone=${encodeURIComponent(portalZone)}`;

  const receiptText = [
    '========================================',
    '        VXK TECH HOTSPOT PARTNER        ',
    `       GATEWAY: ${gatewayTag}`,
    '========================================',
    `RECEIPT NO : ${receiptNumber}`,
    `DATE       : ${issuedAtDisplay}`,
    `CUSTOMER   : ${buyerName}`,
    ...(input.buyerPhone?.trim() ? [`PHONE      : ${input.buyerPhone.trim()}`] : []),
    `ITEM       : ${purchaseItem}`,
    `AMOUNT     : ${priceZar}`,
    '----------------------------------------',
    'WI-FI CONNECTION VOUCHER (TIMED ACCESS)',
    `VOUCHER CODE : ${displayCode}`,
    `TIMED PERIOD : ${periodLabel} (${durationMinutes} mins)`,
    `SPEED / DATA : ${downMbps}/${upMbps} Mbps Uncapped`,
    '----------------------------------------',
    `GATEWAY LINK : ${gatewayTag}`,
    `TOWER SERVER : ${PFSENSE_AUTHORITY_CONFIG.masterHost}`,
    `ROUTER ZONE  : ${gatewayIp} (${portalZone})`,
    `PORTAL URL   : ${portalLoginUrl}`,
    '----------------------------------------',
    'Connect to Wi-Fi, open voucher portal,',
    `select gateway ${gatewayTag}, and enter`,
    'voucher code above. Internet remains ON',
    'for the timed period until time is up.',
    '========================================',
  ].join('\n');

  return {
    ok: true,
    voucher: {
      id: `vch-${nowMs}-${randHex}`,
      voucherCode,
      displayCode,
      gatewayTag,
      towerHost: PFSENSE_AUTHORITY_CONFIG.masterHost,
      gatewayIp,
      portalZone,
      durationAmount: amount,
      durationUnit: input.durationUnit,
      durationMinutes,
      periodLabel,
      priceZar,
      downMbps,
      upMbps,
      quotaMb,
      buyerName,
      buyerPhone: input.buyerPhone?.trim() || undefined,
      purchaseItem,
      receiptNumber,
      issuedAtIso,
      issuedAtDisplay,
      portalLoginUrl,
      receiptText,
    },
  };
}

export function redeemCaptiveVoucher(input: VoucherRedeemInput): VoucherRedeemResult {
  const errors: Record<string, string> = {};
  const voucherCheck = validateVoucherCode(input.voucherCode);
  if (!voucherCheck.isValid) {
    errors.voucherCode = voucherCheck.error || 'Please enter a valid prepaid voucher code.';
  }

  const macCheck = validateMacAddress(input.clientMac);
  if (!macCheck.isValid) {
    errors.clientMac = macCheck.error || 'Enter a valid device MAC address.';
  }

  if (!input.acceptedTerms) {
    errors.acceptedTerms = 'Accept the VXK Captive Portal terms & acceptable use policy to connect.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const nowMs = input.nowMs ?? Date.now();
  const matchedIssuedVoucher = (input.issuedVouchers || []).find(
    (iv) => iv.voucherCode.replace(/[\s\-]/g, '').toUpperCase() === voucherCheck.normalized
  );
  const matchedPreset = PRESET_CAPTIVE_VOUCHERS.find(
    (v) => v.code.replace(/[\s\-]/g, '').toUpperCase() === voucherCheck.normalized
  );

  const gatewayTag =
    matchedIssuedVoucher?.gatewayTag ||
    input.gatewayTag?.trim() ||
    input.gatewayDevice?.gatewayTag ||
    DEFAULT_TILL_GATEWAY_TAG;

  const durationMinutes =
    matchedIssuedVoucher?.durationMinutes || matchedPreset?.durationMinutes || 1440;
  const periodLabel = matchedIssuedVoucher?.periodLabel || formatDurationLabel(durationMinutes);
  const tierLabel = matchedIssuedVoucher
    ? `${matchedIssuedVoucher.periodLabel} Timed Pass (${gatewayTag})`
    : matchedPreset?.tierLabel || 'Prepaid Hot Spot Pass (12/6Mbps)';
  const downMbps = matchedIssuedVoucher?.downMbps || matchedPreset?.downMbps || 12;
  const upMbps = matchedIssuedVoucher?.upMbps || matchedPreset?.upMbps || 6;
  const quotaMb = matchedIssuedVoucher?.quotaMb || matchedPreset?.quotaMb || 5000;

  const gatewayIp = matchedIssuedVoucher?.gatewayIp || input.gatewayDevice?.gatewayIp || '192.168.1.1';
  const partnerVenue = input.gatewayDevice?.partnerBusinessName || `Giyani Shop 770 (${gatewayTag})`;
  const routerBrand = input.gatewayDevice?.brandName || 'pfSense+ (Netgate)';
  const subscriberName =
    input.subscriberName.trim() || matchedIssuedVoucher?.buyerName || 'Prepaid Wi-Fi Guest';
  const accountNumber = input.accountNumber?.trim() || `VOUCH-${voucherCheck.normalized.slice(-4)}`;
  const clientIp = input.clientIp.trim() || '192.168.1.156';
  const redirectUrl = input.redirectUrl?.trim() || 'https://vxktech.co.za/';

  const session: CaptiveVoucherSession = {
    id: `cap-${nowMs}`,
    voucherCode: voucherCheck.normalized,
    tierLabel,
    gatewayUrl: `https://${gatewayIp}/index.php?zone=vxk_partner_portal`,
    gatewayIp,
    gatewayTag,
    portalZone: matchedIssuedVoucher?.portalZone || 'vxk_partner_portal',
    routerBrand,
    partnerVenue,
    clientMac: macCheck.normalized,
    clientIp,
    subscriberName,
    accountNumber,
    connectedAtMs: nowMs,
    expiresAtMs: nowMs + durationMinutes * 60_000,
    durationMinutes,
    periodLabel,
    quotaMb,
    downMbps,
    upMbps,
    redirectUrl,
  };

  const liveUserEntry: LiveConnectedUser = {
    id: `live-voucher-${accountNumber.toLowerCase()}`,
    profileName: subscriberName,
    username: subscriberName.toLowerCase().replace(/\s+/g, '.'),
    accountNumber,
    phone: matchedIssuedVoucher?.buyerPhone || '0824559102',
    email: 'voucher-guest@vxktech.co.za',
    role: 'hotspot',
    lineSpeed: tierLabel,
    deviceName: `Captive Client (${gatewayTag} • ${gatewayIp})`,
    macAddress: macCheck.normalized,
    ipAddress: clientIp,
    partnerDeviceId: input.gatewayDevice?.id || 'pd-giyani-770',
    partnerVenue,
    routerBrand,
    voucherCode: voucherCheck.normalized,
    connectedAtMs: nowMs,
    baseUsedMb: 1.2,
    downloadMbps: downMbps,
    uploadMbps: upMbps,
    quotaLimitMb: quotaMb,
    status: 'Online',
    isCurrentBrowser: true,
  };

  const captiveDeviceEntry: CaptiveDevice = {
    id: `dev-cap-${nowMs}`,
    macAddress: macCheck.normalized,
    ipAddress: clientIp,
    deviceName: `${subscriberName} (${voucherCheck.normalized})`,
    registeredAt: new Date(nowMs).toISOString().replace('T', ' ').slice(0, 16),
    status: 'Connected',
    quotaRemainingMb: quotaMb,
  };

  return {
    ok: true,
    errors: {},
    session,
    liveUserEntry,
    captiveDeviceEntry,
    matchedIssuedVoucher,
  };
}

export function isVoucherSessionExpired(
  session: CaptiveVoucherSession | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!session) return false;
  return nowMs >= session.expiresAtMs;
}

export function formatRemainingCountdown(expiresAtMs: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}
