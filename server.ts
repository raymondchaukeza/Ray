import 'dotenv/config';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import type { IssuedTimedVoucher } from './src/types/index.ts';
import {
  buildPfsenseFormBody,
  extractCsrfMagicToken,
  interpretPfsenseResponse,
  isBlockedSsrfHost,
  isPrivateOrLanHost,
  maskVoucherPin,
  normalizePfsenseActionUrl,
  type PfsenseDispatchRecord,
} from './src/utils/pfsenseBridgeRules.ts';

interface RuntimeBridgeConfig {
  portalUrl: string;
  portalZone: string;
  redirUrl: string;
  allowInsecureTls: boolean;
}

interface RelaySessionRecord {
  id: string;
  voucherCodeMasked: string;
  gatewayUrl: string;
  zone: string;
  clientMac: string;
  clientIp: string;
  subscriberName: string;
  deliveryMode: 'pfsense-server-relay' | 'browser-direct-lan' | 'local-preview';
  connectedAtIso: string;
  status: 'Online' | 'Disconnected';
}

const PORT = Number(process.env.PORT || 3000);
const ALLOW_LOOPBACK_TEST = process.env.PFSENSE_ALLOW_LOCALHOST === 'true';

const initialPortalZone =
  (process.env.PFSENSE_PORTAL_ZONE || '').trim() || 'vxk_partner_portal';
const initialPortalUrl = normalizePfsenseActionUrl({
  rawUrl: (process.env.PFSENSE_PORTAL_URL || '').trim(),
  zone: initialPortalZone,
});
const initialRedirUrl =
  (process.env.PFSENSE_REDIR_URL || '').trim() || 'https://vxktech.co.za/';
const initialAllowInsecureTls = !['false', '0', 'no'].includes(
  (process.env.PFSENSE_ALLOW_INSECURE_TLS || '').trim().toLowerCase()
);

const runtimeConfig: RuntimeBridgeConfig = {
  portalUrl: initialPortalUrl,
  portalZone: initialPortalZone,
  redirUrl: initialRedirUrl,
  allowInsecureTls: initialAllowInsecureTls,
};

const recentDispatches: PfsenseDispatchRecord[] = [];
const liveRelaySessions: RelaySessionRecord[] = [];
const issuedTimedVouchers: IssuedTimedVoucher[] = [];

function recordDispatch(entry: PfsenseDispatchRecord): void {
  recentDispatches.unshift(entry);
  if (recentDispatches.length > 30) {
    recentDispatches.length = 30;
  }
}

interface UpstreamHttpResult {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  bodyText: string;
  latencyMs: number;
}

function dispatchHttpRequest(options: {
  targetUrl: string;
  method: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  allowInsecureTls?: boolean;
}): Promise<UpstreamHttpResult> {
  const startMs = Date.now();
  const parsed = new URL(options.targetUrl);
  const isHttps = parsed.protocol === 'https:';
  const transport = isHttps ? https : http;
  const timeoutMs = options.timeoutMs ?? 4000;

  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort(
        new Error(
          `ETIMEDOUT connecting to ${parsed.hostname}:${parsed.port || (isHttps ? 443 : 80)}`
        )
      );
    }, timeoutMs);

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : isHttps ? 443 : 80,
        path: `${parsed.pathname}${parsed.search}`,
        method: options.method,
        headers: options.headers || {},
        signal: controller.signal,
        ...(isHttps ? { rejectUnauthorized: !(options.allowInsecureTls ?? true) } : {}),
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          clearTimeout(timer);
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers,
            bodyText: Buffer.concat(chunks).toString('utf8'),
            latencyMs: Date.now() - startMs,
          });
        });
      }
    );

    req.on('error', (err) => {
      clearTimeout(timer);
      const reason = controller.signal.reason;
      reject(reason instanceof Error ? reason : err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'vxk-pfsense-bridge', timestamp: new Date().toISOString() });
  });

  app.get('/api/pfsense/config', (_req: Request, res: Response) => {
    let hostname = '192.168.1.1';
    try {
      hostname = new URL(runtimeConfig.portalUrl).hostname;
    } catch {
      // Keep default hostname
    }
    res.json({
      portalUrl: runtimeConfig.portalUrl,
      portalZone: runtimeConfig.portalZone,
      redirUrl: runtimeConfig.redirUrl,
      allowInsecureTls: runtimeConfig.allowInsecureTls,
      isPrivateLan: isPrivateOrLanHost(hostname),
      hasApiKey: Boolean(process.env.PFSENSE_API_KEY),
      recentDispatchesCount: recentDispatches.length,
      activeRelayCount: liveRelaySessions.filter((s) => s.status === 'Online').length,
    });
  });

  app.post('/api/pfsense/config', (req: Request, res: Response) => {
    const { portalUrl, portalZone, redirUrl } = req.body as {
      portalUrl?: string;
      portalZone?: string;
      redirUrl?: string;
    };

    const nextZone = (portalZone || runtimeConfig.portalZone).trim() || 'vxk_partner_portal';
    const nextUrl = normalizePfsenseActionUrl({
      rawUrl: portalUrl || runtimeConfig.portalUrl,
      zone: nextZone,
    });

    let parsed: URL;
    try {
      parsed = new URL(nextUrl);
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid pfSense+ Captive Portal URL format.' });
      return;
    }

    if (isBlockedSsrfHost(parsed.hostname, ALLOW_LOOPBACK_TEST)) {
      res.status(400).json({
        ok: false,
        error: `Blocked gateway hostname "${parsed.hostname}". Use your pfSense+ WAN/DDNS domain or router LAN IP.`,
      });
      return;
    }

    runtimeConfig.portalUrl = nextUrl;
    runtimeConfig.portalZone = nextZone;
    if (redirUrl && redirUrl.trim()) {
      runtimeConfig.redirUrl = redirUrl.trim();
    }

    res.json({
      ok: true,
      portalUrl: runtimeConfig.portalUrl,
      portalZone: runtimeConfig.portalZone,
      redirUrl: runtimeConfig.redirUrl,
      isPrivateLan: isPrivateOrLanHost(parsed.hostname),
    });
  });

  app.post('/api/pfsense/ping', async (req: Request, res: Response) => {
    const body = req.body as { portalUrl?: string; zone?: string };
    const zone = (body.zone || runtimeConfig.portalZone).trim() || 'vxk_partner_portal';
    const targetUrl = normalizePfsenseActionUrl({
      rawUrl: body.portalUrl || runtimeConfig.portalUrl,
      zone,
    });

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      res.status(400).json({ reachable: false, error: 'Invalid pfSense+ target URL.' });
      return;
    }

    if (isBlockedSsrfHost(parsed.hostname, ALLOW_LOOPBACK_TEST)) {
      res.status(400).json({ reachable: false, error: 'Target host is blocked by security policy.' });
      return;
    }

    const isLan = isPrivateOrLanHost(parsed.hostname);
    const startMs = Date.now();
    try {
      const upstream = await dispatchHttpRequest({
        targetUrl,
        method: 'GET',
        timeoutMs: isLan ? 1200 : 4500,
        allowInsecureTls: runtimeConfig.allowInsecureTls,
      });
      res.json({
        reachable: true,
        targetUrl,
        httpStatus: upstream.statusCode,
        latencyMs: upstream.latencyMs,
        isPrivateLan: isLan,
        detail: `pfSense+ Captive Portal responded (HTTP ${upstream.statusCode}) in ${upstream.latencyMs}ms.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      res.json({
        reachable: false,
        targetUrl,
        httpStatus: null,
        latencyMs: Date.now() - startMs,
        isPrivateLan: isLan,
        detail: isLan
          ? `${parsed.hostname} is a private router LAN address unreachable from the cloud relay (${msg}). On hotspot Wi-Fi clients, use Direct Browser LAN POST or expose pfSense+ over VPN/DDNS.`
          : `Could not reach ${targetUrl}: ${msg}`,
      });
    }
  });

  app.post('/api/pfsense/voucher/authenticate', async (req: Request, res: Response) => {
    const body = req.body as {
      voucherCode?: string;
      portalUrl?: string;
      gatewayIp?: string;
      zone?: string;
      redirurl?: string;
      clientMac?: string;
      clientIp?: string;
      subscriberName?: string;
    };

    const rawVoucher = (body.voucherCode || '').trim();
    if (!rawVoucher || rawVoucher.length < 4) {
      res.status(400).json({
        ok: false,
        upstreamSent: false,
        pfsenseAuthorized: false,
        message: 'Voucher code (auth_voucher) is required.',
      });
      return;
    }

    const zone =
      (body.zone || runtimeConfig.portalZone).replace(/^\$PORTAL_ZONE\$$/i, '').trim() ||
      'vxk_partner_portal';
    const redirurl =
      (body.redirurl || runtimeConfig.redirUrl).replace(/^\$PORTAL_REDIRURL\$$/i, '').trim() ||
      'https://vxktech.co.za/';

    const targetUrl = normalizePfsenseActionUrl({
      rawUrl: body.portalUrl || runtimeConfig.portalUrl,
      gatewayIp: body.gatewayIp || '192.168.1.1',
      zone,
    });

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      res.status(400).json({ ok: false, message: 'Invalid pfSense+ Captive Portal URL.' });
      return;
    }

    if (isBlockedSsrfHost(parsed.hostname, ALLOW_LOOPBACK_TEST)) {
      res.status(400).json({
        ok: false,
        upstreamSent: false,
        pfsenseAuthorized: false,
        message: `Blocked target host "${parsed.hostname}".`,
      });
      return;
    }

    const formBody = buildPfsenseFormBody({
      voucherCode: rawVoucher,
      redirurl,
      zone,
    });

    const isLan = isPrivateOrLanHost(parsed.hostname);
    const clientMac = (body.clientMac || 'D4:5D:64:1B:9A:80').trim();
    const clientIp = (body.clientIp || '192.168.1.156').trim();
    const subscriberName = (body.subscriberName || 'Prepaid Wi-Fi Guest').trim();
    const maskedPin = maskVoucherPin(rawVoucher);
    const startMs = Date.now();

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': String(Buffer.byteLength(formBody)),
      'User-Agent': 'VXK-Captive-Portal-Bridge/1.0',
      Origin: parsed.origin,
      Referer: targetUrl,
    };
    if (process.env.PFSENSE_API_KEY) {
      headers['X-API-Key'] = process.env.PFSENSE_API_KEY;
    }

    try {
      let upstream = await dispatchHttpRequest({
        targetUrl,
        method: 'POST',
        body: formBody,
        headers,
        timeoutMs: isLan ? 1200 : 5000,
        allowInsecureTls: runtimeConfig.allowInsecureTls,
      });

      // Retry once with __csrf_magic + session cookies if pfSense portal returned a CSRF challenge
      const lowerInitial = upstream.bodyText.toLowerCase();
      if (
        (upstream.statusCode === 403 || lowerInitial.includes('__csrf_magic') || lowerInitial.includes('csrf')) &&
        !lowerInitial.includes('invalid credentials')
      ) {
        try {
          const preflight = await dispatchHttpRequest({
            targetUrl,
            method: 'GET',
            headers: { 'User-Agent': 'VXK-Captive-Portal-Bridge/1.0' },
            timeoutMs: isLan ? 1200 : 4000,
            allowInsecureTls: runtimeConfig.allowInsecureTls,
          });
          const csrfToken = extractCsrfMagicToken(preflight.bodyText);
          const rawCookies = preflight.headers['set-cookie'];
          const cookieHeader = Array.isArray(rawCookies)
            ? rawCookies.map((c) => c.split(';')[0]).join('; ')
            : '';

          if (csrfToken || cookieHeader) {
            const csrfBody = buildPfsenseFormBody({
              voucherCode: rawVoucher,
              redirurl,
              zone,
              csrfMagic: csrfToken,
            });
            upstream = await dispatchHttpRequest({
              targetUrl,
              method: 'POST',
              body: csrfBody,
              headers: {
                ...headers,
                'Content-Length': String(Buffer.byteLength(csrfBody)),
                ...(cookieHeader ? { Cookie: cookieHeader } : {}),
              },
              timeoutMs: isLan ? 1200 : 5000,
              allowInsecureTls: runtimeConfig.allowInsecureTls,
            });
          }
        } catch {
          // Keep initial upstream response
        }
      }

      const locationHeader = Array.isArray(upstream.headers.location)
        ? upstream.headers.location[0]
        : upstream.headers.location;

      const interpreted = interpretPfsenseResponse({
        statusCode: upstream.statusCode,
        locationHeader,
        bodyText: upstream.bodyText,
      });

      const outcome =
        interpreted.outcome === 'authorized'
          ? 'authorized'
          : interpreted.outcome === 'rejected'
          ? 'rejected'
          : 'unreachable';

      const dispatchRecord: PfsenseDispatchRecord = {
        id: `pf-${Date.now()}`,
        timestampIso: new Date().toISOString(),
        voucherCodeMasked: maskedPin,
        targetUrl,
        zone,
        clientMac,
        clientIp,
        outcome,
        httpStatus: upstream.statusCode,
        latencyMs: upstream.latencyMs,
        detail: interpreted.reason,
      };
      recordDispatch(dispatchRecord);

      if (interpreted.outcome === 'authorized') {
        liveRelaySessions.unshift({
          id: dispatchRecord.id,
          voucherCodeMasked: maskedPin,
          gatewayUrl: targetUrl,
          zone,
          clientMac,
          clientIp,
          subscriberName,
          deliveryMode: 'pfsense-server-relay',
          connectedAtIso: dispatchRecord.timestampIso,
          status: 'Online',
        });
      }

      res.json({
        ok: interpreted.outcome === 'authorized',
        upstreamSent: true,
        pfsenseAuthorized: interpreted.outcome === 'authorized',
        upstreamRejected: interpreted.outcome === 'rejected',
        isPrivateLanUnreachable: false,
        httpStatus: upstream.statusCode,
        latencyMs: upstream.latencyMs,
        targetUrl,
        zone,
        redirurl,
        message: interpreted.reason,
        dispatchRecord,
      });
    } catch (err) {
      const latencyMs = Date.now() - startMs;
      const errMsg = err instanceof Error ? err.message : 'Network error';

      const dispatchRecord: PfsenseDispatchRecord = {
        id: `pf-${Date.now()}`,
        timestampIso: new Date().toISOString(),
        voucherCodeMasked: maskedPin,
        targetUrl,
        zone,
        clientMac,
        clientIp,
        outcome: isLan ? 'lan-direct-required' : 'unreachable',
        httpStatus: null,
        latencyMs,
        detail: isLan
          ? `Server relay cannot reach private router IP ${parsed.hostname} directly (${errMsg}). Client browser LAN form POST is prepared.`
          : `Failed reaching pfSense+ gateway ${targetUrl}: ${errMsg}`,
      };
      recordDispatch(dispatchRecord);

      res.json({
        ok: false,
        upstreamSent: false,
        pfsenseAuthorized: false,
        upstreamRejected: false,
        isPrivateLanUnreachable: isLan,
        httpStatus: null,
        latencyMs,
        targetUrl,
        zone,
        redirurl,
        directFormAction: targetUrl,
        formFields: {
          auth_voucher: rawVoucher,
          redirurl,
          zone,
          accept: 'Continue',
        },
        message: dispatchRecord.detail,
        dispatchRecord,
      });
    }
  });

  app.post('/api/pfsense/voucher/disconnect', (req: Request, res: Response) => {
    const body = req.body as { voucherCode?: string; clientMac?: string };
    const maskedPin = body.voucherCode ? maskVoucherPin(body.voucherCode) : '';

    for (const s of liveRelaySessions) {
      if (
        (maskedPin && s.voucherCodeMasked === maskedPin) ||
        (body.clientMac && s.clientMac.toUpperCase() === body.clientMac.toUpperCase())
      ) {
        s.status = 'Disconnected';
      }
    }

    res.json({
      ok: true,
      disconnectedCount: liveRelaySessions.filter((s) => s.status === 'Disconnected').length,
    });
  });

  app.get('/api/vouchers', (_req: Request, res: Response) => {
    res.json({ vouchers: issuedTimedVouchers.slice(0, 50) });
  });

  app.get('/api/vouchers/lookup/:code', (req: Request, res: Response) => {
    const normalized = String(req.params.code || '')
      .replace(/[\s\-]/g, '')
      .toUpperCase();
    const match = issuedTimedVouchers.find(
      (v) => v.voucherCode.replace(/[\s\-]/g, '').toUpperCase() === normalized
    );
    if (!match) {
      res.status(404).json({ ok: false, voucher: null });
      return;
    }
    res.json({ ok: true, voucher: match });
  });

  app.post('/api/vouchers/issue', (req: Request, res: Response) => {
    const voucher = req.body as IssuedTimedVoucher;
    if (!voucher || !voucher.voucherCode || !voucher.durationMinutes) {
      res.status(400).json({ ok: false, error: 'Invalid voucher payload.' });
      return;
    }
    const normalizedCode = voucher.voucherCode.replace(/[\s\-]/g, '').toUpperCase();
    const cleanVoucher: IssuedTimedVoucher = {
      ...voucher,
      voucherCode: normalizedCode,
      gatewayTag: (voucher.gatewayTag || 'vxk-GiyaniShop770').trim() || 'vxk-GiyaniShop770',
    };
    const existingIdx = issuedTimedVouchers.findIndex((v) => v.voucherCode === normalizedCode);
    if (existingIdx >= 0) {
      issuedTimedVouchers[existingIdx] = cleanVoucher;
    } else {
      issuedTimedVouchers.unshift(cleanVoucher);
      if (issuedTimedVouchers.length > 200) {
        issuedTimedVouchers.length = 200;
      }
    }

    recordDispatch({
      id: `pf-vch-${Date.now()}`,
      timestampIso: new Date().toISOString(),
      voucherCodeMasked: maskVoucherPin(cleanVoucher.displayCode || normalizedCode),
      targetUrl: normalizePfsenseActionUrl({
        gatewayIp: cleanVoucher.gatewayIp || '192.168.1.1',
        zone: cleanVoucher.portalZone || 'vxk_partner_portal',
      }),
      zone: cleanVoucher.portalZone || 'vxk_partner_portal',
      clientMac: 'TILL-POS-ISSUED',
      clientIp: cleanVoucher.gatewayIp || '192.168.1.1',
      outcome: 'authorized',
      httpStatus: 201,
      latencyMs: 1,
      detail: `Issued ${cleanVoucher.periodLabel} voucher via ${cleanVoucher.gatewayTag} (${cleanVoucher.receiptNumber}) linked to pfSense+ tower.`,
    });

    res.status(201).json({ ok: true, voucher: cleanVoucher });
  });

  app.get('/api/pfsense/ledger', (_req: Request, res: Response) => {
    res.json({
      recentDispatches: recentDispatches.slice(0, 12),
      liveRelaySessions: liveRelaySessions.slice(0, 12),
      issuedTimedVouchersCount: issuedTimedVouchers.length,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VXK Tech Prepaid Portal + pfSense+ Bridge running on http://0.0.0.0:${PORT}`);
  });
}

createApp();
