import {
  ApplicationServiceType,
  NewsBulletin,
  NewsCategory,
  PortfolioCategory,
  PortfolioProject,
  ServiceApplication,
} from '../types/index.ts';
import { formatZARPhone } from './ticketRules.ts';

export interface SiteMenuDescriptor {
  id: string;
  label: string;
  queryRoute: string;
  section: 'portal' | 'company';
}

export const SITE_MENUS: SiteMenuDescriptor[] = [
  { id: 'home', label: 'HOME', queryRoute: '?q=home', section: 'company' },
  { id: 'about', label: 'ABOUT', queryRoute: '?q=about', section: 'company' },
  { id: 'features', label: 'FEATURES', queryRoute: '?q=features', section: 'company' },
  { id: 'services', label: 'SERVICES', queryRoute: '?q=services', section: 'company' },
  { id: 'pricing', label: 'PRICING', queryRoute: '?q=pricing', section: 'company' },
  { id: 'portfolio', label: 'PORTFOLIO', queryRoute: '?q=portfolio', section: 'company' },
  { id: 'team', label: 'TEAM', queryRoute: '?q=team', section: 'company' },
  { id: 'apply', label: 'APPLY', queryRoute: '?q=apply', section: 'portal' },
  { id: 'public-news', label: 'PUBLIC NEWS', queryRoute: '?q=public-news', section: 'portal' },
  { id: 'voucher-portal', label: 'ENTER VOUCHER CODE', queryRoute: '?q=captive-portal-login', section: 'portal' },
  { id: 'buy-pay', label: 'BUY / PAY', queryRoute: '?q=node/8', section: 'portal' },
  { id: 'voucher', label: 'VOUCHER REPORTING', queryRoute: '?q=voucher-code-reporting', section: 'portal' },
  { id: 'fault-ticket', label: 'FAULT TICKET', queryRoute: '?q=node/add/fault-report-ticket', section: 'portal' },
  { id: 'captive-wifi', label: 'REGISTER CAPTIVE WIFI', queryRoute: '?q=node/16', section: 'portal' },
  { id: 'wifi-partners', label: 'WI-FI PARTNERS', queryRoute: '?q=wifi-business-partners', section: 'portal' },
  { id: 'contact', label: 'CONTACT US', queryRoute: '?q=contact', section: 'portal' },
];

export interface ApplicationValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  application?: ServiceApplication;
}

export function validateServiceApplication(input: {
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  addressArea: string;
  serviceType: ApplicationServiceType;
  packageSpeed: string;
  notes?: string;
}): ApplicationValidationResult {
  const errors: Record<string, string> = {};

  if (!input.fullName.trim() || input.fullName.trim().length < 3) {
    errors.fullName = 'Please enter your full name or business contact name.';
  }

  const digits = input.phone.replace(/\D/g, '');
  if (digits.length < 10) {
    errors.phone = 'Please enter a valid 10-digit South African phone number.';
  }

  const email = input.email.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address for installation updates.';
  }

  if (!input.idNumber.trim() || input.idNumber.trim().length < 6) {
    errors.idNumber = 'Please enter a valid RSA ID, passport, or business registration number.';
  }

  if (!input.addressArea.trim() || input.addressArea.trim().length < 5) {
    errors.addressArea = 'Please enter your street address, estate, or suburb for coverage verification.';
  }

  if (!input.packageSpeed.trim()) {
    errors.packageSpeed = 'Please select a desired speed or hotspot package.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  const now = new Date();
  const refNum = `VXK-APP-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    valid: true,
    errors: {},
    application: {
      id: `app-${now.getTime()}`,
      reference: refNum,
      fullName: input.fullName.trim(),
      phone: formatZARPhone(input.phone),
      email,
      idNumber: input.idNumber.trim(),
      addressArea: input.addressArea.trim(),
      serviceType: input.serviceType,
      packageSpeed: input.packageSpeed,
      notes: (input.notes || '').trim(),
      submittedAt: now.toISOString().replace('T', ' ').slice(0, 16) + ' SAST',
      status: 'Received',
    },
  };
}

export function filterNewsBulletins(
  bulletins: NewsBulletin[],
  category: NewsCategory,
  searchQuery: string
): NewsBulletin[] {
  const q = searchQuery.trim().toLowerCase();
  return bulletins.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.affectedAreas.some((a) => a.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });
}

export function filterPortfolioProjects(
  projects: PortfolioProject[],
  category: PortfolioCategory
): PortfolioProject[] {
  if (category === 'All Installations') return projects;
  return projects.filter((p) => p.category === category);
}

export function resolveTabFromUrl(search: string, hash: string): {
  tab: string | null;
  openFaultModal: boolean;
} {
  const combined = `${search} ${hash}`.toLowerCase();
  const openFaultModal = combined.includes('fault-report-ticket') && combined.includes('overlay');

  if (combined.includes('wifi-business-partners') || combined.includes('wifi-partners')) {
    return { tab: 'wifi-partners', openFaultModal };
  }
  if (combined.includes('node/16') || combined.includes('captive-wifi')) {
    return { tab: 'captive-wifi', openFaultModal };
  }
  if (combined.includes('node/8') || combined.includes('buy-pay')) {
    return { tab: 'buy-pay', openFaultModal };
  }
  if (
    combined.includes('captive-portal-login') ||
    combined.includes('enter-voucher') ||
    combined.includes('voucher-portal') ||
    combined.includes('192.168.1.1') ||
    combined.includes('portalaction=') ||
    combined.includes('redirurl=')
  ) {
    return { tab: 'voucher-portal', openFaultModal };
  }
  if (combined.includes('voucher-code-reporting') || combined.includes('voucher')) {
    return { tab: 'voucher', openFaultModal };
  }
  if (combined.includes('public-news')) {
    return { tab: 'public-news', openFaultModal };
  }
  if (combined.includes('apply')) {
    return { tab: 'apply', openFaultModal };
  }
  if (combined.includes('about')) {
    return { tab: 'about', openFaultModal };
  }
  if (combined.includes('features')) {
    return { tab: 'features', openFaultModal };
  }
  if (combined.includes('services')) {
    return { tab: 'services', openFaultModal };
  }
  if (combined.includes('pricing')) {
    return { tab: 'pricing', openFaultModal };
  }
  if (combined.includes('portfolio')) {
    return { tab: 'portfolio', openFaultModal };
  }
  if (combined.includes('team')) {
    return { tab: 'team', openFaultModal };
  }
  if (combined.includes('contact')) {
    return { tab: 'contact', openFaultModal };
  }
  if (combined.includes('q=home') || combined.includes('#home')) {
    return { tab: 'home', openFaultModal };
  }
  if (combined.includes('fault-report-ticket')) {
    return { tab: 'fault-ticket', openFaultModal: true };
  }
  return { tab: null, openFaultModal };
}
