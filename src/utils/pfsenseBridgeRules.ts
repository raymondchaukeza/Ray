export interface PortalRedirectParams {
  zone: string | null;
  redirurl: string | null;
  portalActionUrl: string | null;
  clientMac: string | null;
  clientIp: string | null;
  gateway: string | null;
  voucher: string | null;
}

export interface PfsenseDispatchRecord {
  id: string;
  timestampIso: string;
  voucherCodeMasked: string;
  targetUrl: string;
  zone: string;
  clientMac: string;
  clientIp: string;
  outcome: 'authorized' | 'rejected' | 'lan-direct-required' | 'unreachable';
  httpStatus: number | null;
  latencyMs: number;
  detail: string;
}

export function maskVoucherPin(pin: string): string {
  const clean = pin.trim().toUpperCase();
  if (clean.length <= 6) return `${clean.slice(0, 2)}****`;
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}

export function parsePortalRedirectQuery(search: string): PortalRedirectParams {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const rawZone = params.get('zone')?.trim() || null;
  const rawRedir = params.get('redirurl')?.trim() || null;
  const rawAction =
    params.get('portalaction')?.trim() ||
    params.get('portal_action')?.trim() ||
    params.get('action')?.trim() ||
    null;
  const rawMac = params.get('mac')?.trim() || null;
  const rawIp = params.get('ip')?.trim() || params.get('clientip')?.trim() || null;
  const rawGateway = params.get('gateway')?.trim() || params.get('gw')?.trim() || null;
  const rawVoucher = params.get('voucher')?.trim() || params.get('code')?.trim() || null;

  return {
    zone: rawZone,
    redirurl: rawRedir,
    portalActionUrl: rawAction,
    clientMac: rawMac,
    clientIp: rawIp,
    gateway: rawGateway,
    voucher: rawVoucher,
  };
}

export function isPrivateOrLanHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return false;
  if (h.endsWith('.local') || h.endsWith('.lan') || h.endsWith('.home.arpa')) {
    return true;
  }
  const parts = h.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const a = Number(parts[0]);
    const b = Number(parts[1]);
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

export function isBlockedSsrfHost(hostname: string, allowLoopbackForTest = false): boolean {
  const h = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return true;
  if (h === '0.0.0.0' || h === '::' || h === 'metadata.google.internal') {
    return true;
  }
  if (h.startsWith('169.254.')) {
    return true;
  }
  if (!allowLoopbackForTest) {
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.startsWith('127.')) {
      return true;
    }
  }
  return false;
}

export function normalizePfsenseActionUrl(input: {
  rawUrl?: string;
  gatewayIp?: string;
  port?: number;
  zone?: string;
  overrideZone?: boolean;
}): string {
  const cleanZone =
    (input.zone || 'vxk_partner_portal').replace(/^\$PORTAL_ZONE\$$/i, '').trim() ||
    'vxk_partner_portal';
  const raw = (input.rawUrl || '').trim();

  if (raw && !raw.includes('$PORTAL_ACTION$')) {
    try {
      const hasScheme = /^https?:\/\//i.test(raw);
      const inferredScheme =
        /:(8002|80)(?:\/|\?|$)/.test(raw) || input.port === 8002 || input.port === 80
          ? 'http://'
          : 'https://';
      const parsed = new URL(hasScheme ? raw : `${inferredScheme}${raw}`);
      if (input.overrideZone || !parsed.searchParams.get('zone')) {
        parsed.searchParams.set('zone', cleanZone);
      }
      if (parsed.pathname === '/' || parsed.pathname === '') {
        parsed.pathname = '/index.php';
      }
      return parsed.toString();
    } catch {
      // Fallback below
    }
  }

  const host = (input.gatewayIp || '192.168.1.1').trim() || '192.168.1.1';
  const port = input.port ?? 8003;
  const scheme = port === 8002 || port === 80 ? 'http' : 'https';
  return `${scheme}://${host}:${port}/index.php?zone=${encodeURIComponent(cleanZone)}`;
}

export function buildPfsenseFormBody(input: {
  voucherCode: string;
  redirurl?: string;
  zone?: string;
  csrfMagic?: string | null;
}): string {
  const zone =
    (input.zone || '').replace(/^\$PORTAL_ZONE\$$/i, '').trim() || 'vxk_partner_portal';
  const redirurl =
    (input.redirurl || '').replace(/^\$PORTAL_REDIRURL\$$/i, '').trim() ||
    'https://vxktech.co.za/';

  const params = new URLSearchParams();
  if (input.csrfMagic && input.csrfMagic.trim()) {
    params.set('__csrf_magic', input.csrfMagic.trim());
  }
  params.set('auth_voucher', input.voucherCode.trim());
  params.set('redirurl', redirurl);
  params.set('zone', zone);
  params.set('accept', 'Continue');
  return params.toString();
}

export function extractCsrfMagicToken(html: string): string | null {
  const m =
    html.match(/name=["']__csrf_magic["'][^>]*value=["']([^"']+)["']/i) ||
    html.match(/value=["']([^"']+)["'][^>]*name=["']__csrf_magic["']/i);
  return m?.[1]?.trim() || null;
}

export function buildPfsenseRedirectorHtml(portalSiteOrigin: string): string {
  const cleanOrigin = portalSiteOrigin.replace(/\/+$/, '');
  const target = `${cleanOrigin}/?q=captive-portal-login&portalaction=$PORTAL_ACTION$&zone=$PORTAL_ZONE$&redirurl=$PORTAL_REDIRURL$`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${target}">
  <title>VXK TECH | Redirecting to Wi-Fi Portal</title>
</head>
<body style="background:#002238;color:#f5f6f7;font-family:Consolas,monospace;padding:24px;text-align:center">
  <p>Connecting to VXK TECH Wi-Fi Voucher Portal...</p>
  <p><a href="${target}" style="color:#bfcbd4">Continue to Voucher Login</a></p>
  <script>window.location.replace("${target}");</script>
</body>
</html>`;
}

export function interpretPfsenseResponse(input: {
  statusCode: number;
  locationHeader?: string;
  bodyText: string;
}): {
  outcome: 'authorized' | 'rejected' | 'ambiguous';
  reason: string;
} {
  const lowerBody = input.bodyText.toLowerCase();
  const lowerLoc = (input.locationHeader || '').toLowerCase();

  // Check JSON API responses (e.g., pfSense REST API)
  if (lowerBody.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(input.bodyText) as {
        status?: string;
        code?: number;
        message?: string;
        authorized?: boolean;
      };
      if (
        parsed.authorized === true ||
        parsed.status === 'ok' ||
        parsed.code === 200
      ) {
        return {
          outcome: 'authorized',
          reason: parsed.message || 'pfSense+ REST API accepted the voucher.',
        };
      }
      if (parsed.status === 'error' || (typeof parsed.code === 'number' && parsed.code >= 400)) {
        return {
          outcome: 'rejected',
          reason: parsed.message || 'pfSense+ rejected the submitted voucher code.',
        };
      }
    } catch {
      // Fall through to HTML/status parsing
    }
  }

  const rejectionMarkers = [
    'invalid credentials specified',
    'voucher code is invalid',
    'invalid voucher',
    'voucher has expired',
    'voucher already in use',
    'already used',
    'authentication failed',
    'access denied',
    'not valid',
  ];

  for (const marker of rejectionMarkers) {
    if (lowerBody.includes(marker) || lowerLoc.includes('error')) {
      return {
        outcome: 'rejected',
        reason: `pfSense+ rejected voucher (${marker}).`,
      };
    }
  }

  if (input.statusCode >= 300 && input.statusCode < 400 && input.locationHeader) {
    return {
      outcome: 'authorized',
      reason: `pfSense+ issued captive portal redirect (${input.statusCode} -> ${input.locationHeader}).`,
    };
  }

  if (
    input.statusCode >= 200 &&
    input.statusCode < 300 &&
    (lowerBody.includes('you are connected') ||
      lowerBody.includes('successfully logged in') ||
      lowerBody.includes('success') ||
      !lowerBody.includes('name="auth_voucher"'))
  ) {
    return {
      outcome: 'authorized',
      reason: `pfSense+ returned HTTP ${input.statusCode} authorization confirmation.`,
    };
  }

  return {
    outcome: 'ambiguous',
    reason: `pfSense+ returned HTTP ${input.statusCode} without clear redirect or voucher acceptance marker.`,
  };
}
