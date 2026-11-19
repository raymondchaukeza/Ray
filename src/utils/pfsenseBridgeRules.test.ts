import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPfsenseFormBody,
  buildPfsenseRedirectorHtml,
  extractCsrfMagicToken,
  interpretPfsenseResponse,
  isBlockedSsrfHost,
  isPrivateOrLanHost,
  maskVoucherPin,
  normalizePfsenseActionUrl,
  parsePortalRedirectQuery,
} from './pfsenseBridgeRules.ts';

test('parses pfSense captive portal redirect query parameters accurately', () => {
  const parsed = parsePortalRedirectQuery(
    '?q=captive-portal-login&zone=vxk_hotspot&redirurl=https%3A%2F%2Fvxktech.co.za%2F&portalaction=https%3A%2F%2F192.168.1.1%3A8003%2Findex.php%3Fzone%3Dvxk_hotspot&mac=AA%3ABB%3ACC%3A11%3A22%3A33&ip=192.168.1.44&gateway=vxk-GiyaniShop770&voucher=VXK-770-1234-ABCD'
  );
  assert.equal(parsed.zone, 'vxk_hotspot');
  assert.equal(parsed.redirurl, 'https://vxktech.co.za/');
  assert.equal(
    parsed.portalActionUrl,
    'https://192.168.1.1:8003/index.php?zone=vxk_hotspot'
  );
  assert.equal(parsed.clientMac, 'AA:BB:CC:11:22:33');
  assert.equal(parsed.clientIp, '192.168.1.44');
  assert.equal(parsed.gateway, 'vxk-GiyaniShop770');
  assert.equal(parsed.voucher, 'VXK-770-1234-ABCD');
});

test('identifies LAN IPs vs blocked metadata/SSRF hosts properly', () => {
  assert.equal(isPrivateOrLanHost('192.168.1.1'), true);
  assert.equal(isPrivateOrLanHost('10.0.0.1'), true);
  assert.equal(isPrivateOrLanHost('portal.vxktech.co.za'), false);

  assert.equal(isBlockedSsrfHost('169.254.169.254'), true);
  assert.equal(isBlockedSsrfHost('127.0.0.1', false), true);
  assert.equal(isBlockedSsrfHost('127.0.0.1', true), false);
  assert.equal(isBlockedSsrfHost('portal.vxktech.co.za'), false);
});

test('builds exact application/x-www-form-urlencoded payload for pfSense auth_voucher', () => {
  const body = buildPfsenseFormBody({
    voucherCode: '  VXK-7712-9901-4421  ',
    redirurl: '$PORTAL_REDIRURL$',
    zone: '$PORTAL_ZONE$',
    csrfMagic: 'sid:abc123',
  });
  const params = new URLSearchParams(body);
  assert.equal(params.get('auth_voucher'), 'VXK-7712-9901-4421');
  assert.equal(params.get('redirurl'), 'https://vxktech.co.za/');
  assert.equal(params.get('zone'), 'vxk_partner_portal');
  assert.equal(params.get('accept'), 'Continue');
  assert.equal(params.get('__csrf_magic'), 'sid:abc123');
});

test('normalizes $PORTAL_ACTION$, HTTP 8002, and HTTPS 8003 URLs accurately', () => {
  assert.equal(
    normalizePfsenseActionUrl({ rawUrl: '$PORTAL_ACTION$', gatewayIp: '192.168.1.1' }),
    'https://192.168.1.1:8003/index.php?zone=vxk_partner_portal'
  );
  assert.equal(
    normalizePfsenseActionUrl({ rawUrl: '192.168.1.1:8002', zone: 'lan_guest' }),
    'http://192.168.1.1:8002/index.php?zone=lan_guest'
  );
  assert.equal(
    normalizePfsenseActionUrl({
      rawUrl: 'https://portal.vxktech.co.za:8003/index.php?zone=old',
      zone: 'main_zone',
      overrideZone: true,
    }),
    'https://portal.vxktech.co.za:8003/index.php?zone=main_zone'
  );
});

test('extracts __csrf_magic token and builds external pfSense redirector HTML', () => {
  const html = '<form><input type="hidden" name="__csrf_magic" value="sid:xyz987,17000" /></form>';
  assert.equal(extractCsrfMagicToken(html), 'sid:xyz987,17000');

  const redirectHtml = buildPfsenseRedirectorHtml('https://portal.example.com/');
  assert.equal(
    redirectHtml.includes(
      'https://portal.example.com/?q=captive-portal-login&portalaction=$PORTAL_ACTION$&zone=$PORTAL_ZONE$&redirurl=$PORTAL_REDIRURL$'
    ),
    true
  );
});

test('interprets pfSense redirect acceptance, rejection HTML, and JSON API responses', () => {
  const accepted = interpretPfsenseResponse({
    statusCode: 302,
    locationHeader: 'https://vxktech.co.za/',
    bodyText: '',
  });
  assert.equal(accepted.outcome, 'authorized');

  const rejected = interpretPfsenseResponse({
    statusCode: 200,
    bodyText: '<html><body><p>Invalid credentials specified.</p></body></html>',
  });
  assert.equal(rejected.outcome, 'rejected');

  const apiOk = interpretPfsenseResponse({
    statusCode: 200,
    bodyText: JSON.stringify({ status: 'ok', code: 200, authorized: true }),
  });
  assert.equal(apiOk.outcome, 'authorized');

  assert.equal(maskVoucherPin('VXK-7712-9901-4421'), 'VXK-••••4421');
});
