import { LineSpeedOption } from '../types/index.ts';

export const LINE_SPEED_PACKAGES: LineSpeedOption[] = [
  {
    value: '6/3Mbps @R350pm',
    label: '6/3Mbps @R350pm',
    downMbps: 6,
    upMbps: 3,
    priceMonthlyZAR: 350,
    type: 'Residential',
  },
  {
    value: '8/4Mbps @R600pm',
    label: '8/4Mbps @R600pm',
    downMbps: 8,
    upMbps: 4,
    priceMonthlyZAR: 600,
    popular: true,
    type: 'Residential',
  },
  {
    value: '10/5Mbps @R900pm',
    label: '10/5Mbps @R900pm',
    downMbps: 10,
    upMbps: 5,
    priceMonthlyZAR: 900,
    type: 'Business',
  },
  {
    value: '12/6Mbps @R1050pm',
    label: '12/6Mbps @R1050pm',
    downMbps: 12,
    upMbps: 6,
    priceMonthlyZAR: 1050,
    type: 'Business',
  },
  {
    value: '20/10Mbps PUBLIC HOT SPOT WiFi @R1050pm',
    label: '20/10Mbps PUBLIC HOT SPOT WiFi @R1050pm',
    downMbps: 20,
    upMbps: 10,
    priceMonthlyZAR: 1050,
    type: 'Public Hot Spot',
  },
];

export interface TicketFormInput {
  phoneNumbers: string;
  accountNumber: string;
  faultDetails: string;
  lineSpeed: string;
  idNumber: string;
  voucherError?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateFaultTicket(input: TicketFormInput): ValidationResult {
  const errors: Record<string, string> = {};

  // Phone numbers: required, at least 10 digits (South African standard: 0XX XXX XXXX)
  const cleanPhone = input.phoneNumbers.replace(/[\s\-\(\)]/g, '');
  if (!cleanPhone) {
    errors.phoneNumbers = 'Phone number is required';
  } else if (!/^(0[1-9][0-9]{8}|27[1-9][0-9]{8})$/.test(cleanPhone) && cleanPhone.length < 10) {
    errors.phoneNumbers = 'Please enter a valid 10-digit phone number (e.g. 0821234567)';
  }

  // Account number: required
  if (!input.accountNumber || !input.accountNumber.trim()) {
    errors.accountNumber = 'VXK Tech Account Number is required';
  } else if (input.accountNumber.trim().length < 3) {
    errors.accountNumber = 'Account number must be at least 3 characters';
  }

  // Fault details: required, descriptive
  if (!input.faultDetails || !input.faultDetails.trim()) {
    errors.faultDetails = 'Details of the fault are required';
  } else if (input.faultDetails.trim().length < 8) {
    errors.faultDetails = 'Please provide more details about the fault (min 8 characters)';
  }

  // Line speed: must be one of the known packages and not empty or _none
  if (!input.lineSpeed || input.lineSpeed === '_none') {
    errors.lineSpeed = 'Please select your line speed';
  } else {
    const valid = LINE_SPEED_PACKAGES.some((p) => p.value === input.lineSpeed);
    if (!valid) {
      errors.lineSpeed = 'Invalid line speed package selected';
    }
  }

  // ID Number: required, typically 13 digits for South Africa or alphanumeric passport
  const cleanId = input.idNumber.replace(/\s+/g, '');
  if (!cleanId) {
    errors.idNumber = 'South African ID number or passport number is required';
  } else if (cleanId.length < 6 || cleanId.length > 15) {
    errors.idNumber = 'ID number must be between 6 and 15 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function classifyFaultPriority(details: string): 'Critical' | 'High' | 'Medium' | 'Low' {
  const lower = details.toLowerCase();
  if (
    lower.includes('no internet') ||
    lower.includes('completely down') ||
    /(cut.*cable|cable.*cut|cut.*fiber|fiber.*cut)/i.test(lower) ||
    lower.includes('tamper') ||
    lower.includes('emergency') ||
    lower.includes('all users')
  ) {
    return 'Critical';
  }
  if (
    lower.includes('red light') ||
    lower.includes('los blinking') ||
    lower.includes('router dead') ||
    lower.includes('captive portal down') ||
    lower.includes('frequent disconnect')
  ) {
    return 'High';
  }
  if (
    lower.includes('slow') ||
    lower.includes('buffer') ||
    lower.includes('speed') ||
    lower.includes('voucher') ||
    lower.includes('token')
  ) {
    return 'Medium';
  }
  return 'Low';
}

export function validateVoucherCode(code: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!code) {
    return { isValid: false, normalized: '', error: 'Voucher code is required' };
  }
  const clean = code.replace(/[\s\-]/g, '').toUpperCase();
  if (clean.length < 4) {
    return { isValid: false, normalized: clean, error: 'Voucher code is too short (min 4 characters)' };
  }
  if (!/^[A-Z0-9]+$/.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      error: 'Voucher code contains invalid characters',
    };
  }
  return { isValid: true, normalized: clean };
}

export function formatZARPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return phone;
}

export function maskPublicPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 7) {
    return `${clean.slice(0, 3)} *** ${clean.slice(-4)}`;
  }
  return '***';
}

export function maskPublicId(idNumber: string): string {
  const clean = idNumber.replace(/\s+/g, '');
  if (clean.length >= 6) {
    return `${clean.slice(0, 4)}${'*'.repeat(clean.length - 6)}${clean.slice(-2)}`;
  }
  return '******';
}

export const TICKET_TRANSITION_STEPS: Array<{
  status: 'Open' | 'Investigating' | 'Technician Dispatched' | 'Resolved';
  displayName: string;
  stepNumber: number;
  description: string;
}> = [
  {
    status: 'Open',
    displayName: 'Pending / Logged',
    stepNumber: 1,
    description: 'Ticket received by NOC gateway. Automated reference and SMS dispatched.',
  },
  {
    status: 'Investigating',
    displayName: 'NOC Investigating',
    stepNumber: 2,
    description: 'Core network engineers testing fiber drop, light levels, or voucher switch.',
  },
  {
    status: 'Technician Dispatched',
    displayName: 'Tech Dispatched',
    stepNumber: 3,
    description: 'Field engineer assigned and dispatched to client location or local DP cabinet.',
  },
  {
    status: 'Resolved',
    displayName: 'Service Resolved',
    stepNumber: 4,
    description: 'Connectivity restored, link latency verified, and customer notified.',
  },
];

export function getTicketProgressPercentage(status: string): number {
  switch (status) {
    case 'Open':
      return 25;
    case 'Investigating':
      return 50;
    case 'Technician Dispatched':
      return 75;
    case 'Resolved':
    case 'Closed':
      return 100;
    default:
      return 25;
  }
}

export function getNextTicketStatus(current: string): 'Open' | 'Investigating' | 'Technician Dispatched' | 'Resolved' | null {
  switch (current) {
    case 'Open':
      return 'Investigating';
    case 'Investigating':
      return 'Technician Dispatched';
    case 'Technician Dispatched':
      return 'Resolved';
    case 'Resolved':
      return null;
    default:
      return null;
  }
}
