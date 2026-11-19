export type UserRole = 'customer' | 'technician' | 'admin';

export interface UserSession {
  username: string;
  name: string;
  accountNumber: string;
  phone: string;
  idNumber: string;
  email: string;
  role: UserRole;
  lineSpeed: string;
  balanceDays: number;
}

export type TicketStatus = 'Open' | 'Investigating' | 'Technician Dispatched' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TicketNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isStaff: boolean;
}

export interface FaultTicket {
  id: string;
  createdAt: string;
  phoneNumbers: string;
  accountNumber: string;
  faultDetails: string;
  lineSpeed: string;
  idNumber: string;
  voucherError?: string;
  imageFileName?: string;
  imageDataUrl?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  notes: TicketNote[];
  estimatedResolution?: string;
}

export interface LineSpeedOption {
  value: string;
  label: string;
  downMbps: number;
  upMbps: number;
  priceMonthlyZAR: number;
  popular?: boolean;
  type: 'Residential' | 'Business' | 'Public Hot Spot';
}

export interface VoucherReport {
  id: string;
  code: string;
  reportedAt: string;
  accountNumber: string;
  errorType: string;
  status: 'Pending' | 'Verified' | 'Replaced' | 'Invalid';
  notes: string;
}

export interface CaptiveDevice {
  id: string;
  macAddress: string;
  ipAddress: string;
  deviceName: string;
  registeredAt: string;
  status: 'Connected' | 'Pending Auth' | 'Expired';
  quotaRemainingMb: number;
}

export interface CaptiveBrandInfo {
  id: string;
  name: string;
  vendor: string;
  models: string[];
  syncProtocol: string;
  pfsenseRole: string;
  portalRedirectPath: string;
  defaultSubnet: string;
}

export interface RouterScanResult {
  brandId: string;
  brandName: string;
  model: string;
  firmware: string;
  gatewayIp: string;
  subnet: string;
  macAddress: string;
  deviceIp: string;
  ssidDetected: string;
  pfsenseEndpoint: string;
  pfsenseReachable: boolean;
  latencyMs: number;
  scannedAt: string;
}

export interface PartnerDevice {
  id: string;
  partnerBusinessName: string;
  gatewayTag?: string;
  location: string;
  deviceName: string;
  brandId: string;
  brandName: string;
  model: string;
  macAddress: string;
  gatewayIp: string;
  localIp: string;
  syncProtocol: string;
  pfsenseAuthStatus: 'Authorized' | 'Pending Auth' | 'Suspended';
  voucherAuthority: 'pfSense+ Master';
  approvedVoucherCode?: string;
  activeSessions: number;
  lastSyncedAt: string;
  connectionType: 'Direct Scan' | 'Remote Manual';
}

export type VoucherDurationUnit = 'minutes' | 'hours' | 'days';

export interface IssuedTimedVoucher {
  id: string;
  voucherCode: string;
  displayCode: string;
  gatewayTag: string;
  towerHost: string;
  gatewayIp: string;
  portalZone: string;
  durationAmount: number;
  durationUnit: VoucherDurationUnit;
  durationMinutes: number;
  periodLabel: string;
  priceZar: string;
  downMbps: number;
  upMbps: number;
  quotaMb: number;
  buyerName: string;
  buyerPhone?: string;
  purchaseItem: string;
  receiptNumber: string;
  issuedAtIso: string;
  issuedAtDisplay: string;
  portalLoginUrl: string;
  receiptText: string;
}

export interface LiveConnectedUser {
  id: string;
  profileName: string;
  username: string;
  accountNumber: string;
  phone: string;
  email: string;
  role: 'customer' | 'hotspot' | 'technician' | 'partner';
  lineSpeed: string;
  deviceName: string;
  macAddress: string;
  ipAddress: string;
  partnerDeviceId: string;
  partnerVenue: string;
  routerBrand: string;
  voucherCode: string;
  connectedAtMs: number;
  baseUsedMb: number;
  downloadMbps: number;
  uploadMbps: number;
  quotaLimitMb: number;
  status: 'Online' | 'Idle' | 'Disconnected';
  isCurrentBrowser?: boolean;
}

export type ApplicationServiceType =
  | 'Residential Fibre / Wireless'
  | 'Business Dedicated Internet'
  | 'Captive Hotspot Partner / Reseller'
  | 'Institutional Connectivity';

export interface ServiceApplication {
  id: string;
  reference: string;
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  addressArea: string;
  serviceType: ApplicationServiceType;
  packageSpeed: string;
  notes: string;
  submittedAt: string;
  status: 'Received' | 'Coverage Check' | 'Approved for Install';
}

export type NewsCategory = 'All' | 'Network Status' | 'Maintenance' | 'Hotspot Rollout' | 'Promotions';

export interface NewsBulletin {
  id: string;
  title: string;
  category: Exclude<NewsCategory, 'All'>;
  publishedAt: string;
  author: string;
  severity: 'info' | 'warning' | 'success';
  summary: string;
  details: string;
  affectedAreas: string[];
}

export type PortfolioCategory = 'All Installations' | 'Fibre' | 'Wireless' | 'Voucher Hotspots' | 'IT Support';

export interface PortfolioProject {
  id: string;
  title: string;
  category: Exclude<PortfolioCategory, 'All Installations'>;
  location: string;
  description: string;
  specs: string;
  status: 'Live & Operational' | 'Completed 2026';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  initials: string;
}

export interface ServiceOffering {
  id: string;
  title: string;
  tagline: string;
  description: string;
  actionTab: string;
  actionLabel: string;
}
