import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_MENUS,
  filterNewsBulletins,
  filterPortfolioProjects,
  resolveTabFromUrl,
  validateServiceApplication,
} from './siteMenuRules.ts';

test('registers all 16 site and portal menus with unique IDs', () => {
  const ids = new Set(SITE_MENUS.map((m) => m.id));
  assert.equal(ids.size, SITE_MENUS.length);
  for (const required of [
    'home',
    'about',
    'features',
    'services',
    'pricing',
    'portfolio',
    'team',
    'apply',
    'public-news',
    'voucher-portal',
    'buy-pay',
    'voucher',
    'fault-ticket',
    'captive-wifi',
    'wifi-partners',
    'contact',
  ]) {
    assert.ok(ids.has(required), `Missing menu: ${required}`);
  }
});

test('validates service applications and catches missing required fields', () => {
  const bad = validateServiceApplication({
    fullName: 'Jo',
    phone: '082',
    email: 'invalid-email',
    idNumber: '12',
    addressArea: 'Arc',
    serviceType: 'Residential Fibre / Wireless',
    packageSpeed: '',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.fullName);
  assert.ok(bad.errors.phone);
  assert.ok(bad.errors.email);
  assert.ok(bad.errors.addressArea);
  assert.ok(bad.errors.packageSpeed);

  const ok = validateServiceApplication({
    fullName: 'Kagiso Molefe',
    phone: '0824559102',
    email: 'kagiso@example.co.za',
    idNumber: '9004125123081',
    addressArea: '870 Stanza Bopape Street, Arcadia, Pretoria',
    serviceType: 'Captive Hotspot Partner / Reseller',
    packageSpeed: '20/10Mbps PUBLIC HOT SPOT WiFi @R1050pm',
    notes: 'Rooftop bracket ready',
  });
  assert.equal(ok.valid, true);
  assert.ok(ok.application?.reference.startsWith('VXK-APP-'));
  assert.equal(ok.application?.status, 'Received');
});

test('filters news bulletins by category and search query', () => {
  const bulletins = [
    {
      id: 'b1',
      title: 'Pretoria Arcadia Fibre Upgrade',
      category: 'Maintenance' as const,
      publishedAt: '2026-11-18',
      author: 'NOC',
      severity: 'info' as const,
      summary: 'Scheduled splice window',
      details: 'Zero downtime expected',
      affectedAreas: ['Arcadia', 'Pretoria'],
    },
    {
      id: 'b2',
      title: 'Soweto Hotspot Launch',
      category: 'Hotspot Rollout' as const,
      publishedAt: '2026-11-17',
      author: 'Partners',
      severity: 'success' as const,
      summary: 'New MikroTik + pfSense+ node active',
      details: 'Live now',
      affectedAreas: ['Soweto'],
    },
  ];
  assert.equal(filterNewsBulletins(bulletins, 'All', '').length, 2);
  assert.equal(filterNewsBulletins(bulletins, 'Maintenance', '').length, 1);
  assert.equal(filterNewsBulletins(bulletins, 'All', 'soweto').length, 1);
});

test('filters portfolio projects and resolves query routes cleanly', () => {
  const projects = [
    {
      id: 'p1',
      title: 'Residential Fibre',
      category: 'Fibre' as const,
      location: 'Pretoria',
      description: 'FTTH estate link',
      specs: '10Gbps',
      status: 'Live & Operational' as const,
    },
    {
      id: 'p2',
      title: 'Community Hotspot',
      category: 'Voucher Hotspots' as const,
      location: 'Soweto',
      description: 'pfSense+ voucher portal',
      specs: '50+ concurrent',
      status: 'Live & Operational' as const,
    },
  ];
  assert.equal(filterPortfolioProjects(projects, 'All Installations').length, 2);
  assert.equal(filterPortfolioProjects(projects, 'Voucher Hotspots').length, 1);

  assert.equal(resolveTabFromUrl('', '').tab, null);
  assert.equal(resolveTabFromUrl('?q=apply', '').tab, 'apply');
  assert.equal(resolveTabFromUrl('?q=public-news', '').tab, 'public-news');
  assert.equal(resolveTabFromUrl('?q=portfolio', '').tab, 'portfolio');
  assert.equal(resolveTabFromUrl('?q=wifi-business-partners', '').tab, 'wifi-partners');
  assert.equal(
    resolveTabFromUrl('?portalaction=http://192.168.1.1:8002/index.php', '').tab,
    'voucher-portal'
  );
});
