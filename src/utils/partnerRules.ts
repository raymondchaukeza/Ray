import { CaptiveBrandInfo, PartnerDevice, RouterScanResult } from '../types/index.ts';
import { validateVoucherCode } from './ticketRules.ts';

export const PFSENSE_AUTHORITY_CONFIG = {
  masterHost: 'pfsense-master.vxktech.co.za',
  portalZone: 'VXK_PARTNER_PORTAL',
  authPort: 8002,
  radiusAuthPort: 1812,
  radiusAcctPort: 1813,
  voucherRollSyncUrl: 'https://vxktech.co.za/prepaid/?q=node/16',
  authorityLabel: 'pfSense+ Master Voucher & Access Authority',
};

export const CAPTIVE_DEVICE_BRANDS: CaptiveBrandInfo[] = [
  {
    id: 'pfsense-plus',
    name: 'pfSense+ (Netgate)',
    vendor: 'Netgate',
    models: ['Netgate 2100 pfSense+ 24.11', 'Netgate 4200 pfSense+ 24.11', 'Netgate 6100 MAX'],
    syncProtocol: 'Native Captive Portal + XML-RPC Voucher Sync',
    pfsenseRole: 'Master Voucher Approval & Internet Access Authority',
    portalRedirectPath: '/index.php?zone=vxk_partner_portal',
    defaultSubnet: '192.168.1.1',
  },
  {
    id: 'mikrotik',
    name: 'MikroTik RouterOS',
    vendor: 'MikroTik',
    models: ['hAP ax³ (RouterOS 7.15)', 'RB5009UG+S+IN', 'cAP ax'],
    syncProtocol: 'Hotspot Walled Garden + RADIUS CoA -> pfSense+',
    pfsenseRole: 'Delegates Voucher Validation & Internet Release to pfSense+',
    portalRedirectPath: '/login.html -> pfsense-master',
    defaultSubnet: '192.168.88.1',
  },
  {
    id: 'unifi',
    name: 'Ubiquiti UniFi',
    vendor: 'Ubiquiti',
    models: ['UniFi U6-Pro', 'UniFi Dream Machine SE', 'U6-Long-Range'],
    syncProtocol: 'External Captive Portal Server + RADIUS -> pfSense+',
    pfsenseRole: 'External Voucher Check & Session Auth via pfSense+',
    portalRedirectPath: '/guest/s/default/ -> pfsense-master',
    defaultSubnet: '192.168.10.1',
  },
  {
    id: 'tplink-omada',
    name: 'TP-Link Omada',
    vendor: 'TP-Link',
    models: ['Omada ER605 v2', 'EAP650 Wi-Fi 6', 'EAP610-Outdoor'],
    syncProtocol: 'Omada External Web Portal + RADIUS -> pfSense+',
    pfsenseRole: 'External Web Portal Sync & Quota Enforcement via pfSense+',
    portalRedirectPath: '/portal/vxk -> pfsense-master',
    defaultSubnet: '192.168.0.1',
  },
  {
    id: 'cisco-meraki',
    name: 'Cisco Meraki / Catalyst',
    vendor: 'Cisco',
    models: ['Meraki MR46', 'Meraki MX68', 'Catalyst 9120AX'],
    syncProtocol: 'Meraki EXCAP Splash Page + RADIUS -> pfSense+',
    pfsenseRole: 'Sign-on Splash Handshake & Voucher Approval via pfSense+',
    portalRedirectPath: '/splash/vxk -> pfsense-master',
    defaultSubnet: '192.168.128.1',
  },
  {
    id: 'aruba',
    name: 'Aruba Instant / Central',
    vendor: 'HPE Aruba',
    models: ['Aruba AP-515 Instant', 'Aruba Instant On AP22', 'Aruba 7005'],
    syncProtocol: 'External Captive Portal Profile + RADIUS -> pfSense+',
    pfsenseRole: 'MAC Caching & Voucher Authorization via pfSense+',
    portalRedirectPath: '/swarm.cgi -> pfsense-master',
    defaultSubnet: '192.168.20.1',
  },
  {
    id: 'ruckus',
    name: 'Ruckus SmartZone / Unleashed',
    vendor: 'CommScope Ruckus',
    models: ['Ruckus R550', 'Ruckus R650', 'SmartZone 100'],
    syncProtocol: 'WISPr Northbound Portal + RADIUS -> pfSense+',
    pfsenseRole: 'Northbound Session Release via pfSense+',
    portalRedirectPath: '/portalintf -> pfsense-master',
    defaultSubnet: '192.168.30.1',
  },
  {
    id: 'cambium',
    name: 'Cambium cnPilot / cnMaestro',
    vendor: 'Cambium Networks',
    models: ['cnPilot e410', 'XV2-2 Wi-Fi 6', 'cnPilot e501S'],
    syncProtocol: 'cnMaestro External Captive Sync + RADIUS -> pfSense+',
    pfsenseRole: 'Voucher Roll Verification & CoA via pfSense+',
    portalRedirectPath: '/cgi-bin/hotspot -> pfsense-master',
    defaultSubnet: '192.168.40.1',
  },
  {
    id: 'ruijie',
    name: 'Ruijie Reyee Cloud',
    vendor: 'Ruijie Networks',
    models: ['Reyee RG-EG105GW', 'RG-RAP2260(G)', 'RG-RAP6262'],
    syncProtocol: 'Ruijie External Auth URL + RADIUS -> pfSense+',
    pfsenseRole: 'Cloud Portal Redirect & Voucher Auth via pfSense+',
    portalRedirectPath: '/wifiauth -> pfsense-master',
    defaultSubnet: '192.168.110.1',
  },
  {
    id: 'grandstream',
    name: 'Grandstream GWN',
    vendor: 'Grandstream',
    models: ['GWN7660 Wi-Fi 6', 'GWN7002 Router', 'GWN7664LR'],
    syncProtocol: 'GWN External Captive Portal + RADIUS -> pfSense+',
    pfsenseRole: 'Voucher Policy & Internet Gatekeeping via pfSense+',
    portalRedirectPath: '/gwn_captive -> pfsense-master',
    defaultSubnet: '192.168.50.1',
  },
  {
    id: 'openwrt',
    name: 'OpenWrt / CoovaChilli',
    vendor: 'OpenWrt Community',
    models: ['OpenWrt 23.05 + CoovaChilli', 'GL.iNet Flint 2 (MT6000)', 'openNDS'],
    syncProtocol: 'UAM JSON / Chilled Redirect + RADIUS -> pfSense+',
    pfsenseRole: 'UAM Secret Handshake & Voucher Approval via pfSense+',
    portalRedirectPath: '/uam -> pfsense-master',
    defaultSubnet: '10.1.0.1',
  },
  {
    id: 'engenius',
    name: 'EnGenius / D-Link Business',
    vendor: 'EnGenius & D-Link',
    models: ['EnGenius ECW230', 'D-Link DAP-X2810', 'DWL-6610AP'],
    syncProtocol: 'External Splash Portal + RADIUS -> pfSense+',
    pfsenseRole: 'Captive Auth & Bandwidth Shaping via pfSense+',
    portalRedirectPath: '/captive -> pfsense-master',
    defaultSubnet: '192.168.60.1',
  },
];

export function validateMacAddress(mac: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  const trimmed = mac.trim();
  if (!trimmed) {
    return { isValid: false, normalized: '', error: 'Hardware MAC address is required' };
  }
  const clean = trimmed.replace(/[-.]/g, ':').toUpperCase();
  const macRegex = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;
  if (!macRegex.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      error: 'Enter a valid MAC address (e.g. D4:5D:64:1B:9A:80)',
    };
  }
  return { isValid: true, normalized: clean };
}

export function validateIPv4(ip: string): { isValid: boolean; error?: string } {
  const trimmed = ip.trim();
  if (!trimmed) {
    return { isValid: false, error: 'IP address is required' };
  }
  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  if (!ipv4Regex.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid IPv4 address (e.g. 192.168.88.1)' };
  }
  return { isValid: true };
}

export function simulateRouterScan(preferredBrandId?: string, overrideMac?: string): RouterScanResult {
  const brand =
    CAPTIVE_DEVICE_BRANDS.find((b) => b.id === preferredBrandId) || CAPTIVE_DEVICE_BRANDS[1]; // Default MikroTik or selected
  const model = brand.models[0];
  const macCheck = overrideMac ? validateMacAddress(overrideMac) : { isValid: false, normalized: '' };
  const macAddress = macCheck.isValid ? macCheck.normalized : 'D4:5D:64:1B:9A:80';
  const gatewayOctets = brand.defaultSubnet.split('.');
  const deviceIp = `${gatewayOctets[0]}.${gatewayOctets[1]}.${gatewayOctets[2]}.156`;
  const subnet = `${gatewayOctets[0]}.${gatewayOctets[1]}.${gatewayOctets[2]}.0/24`;

  return {
    brandId: brand.id,
    brandName: brand.name,
    model,
    firmware: brand.id === 'pfsense-plus' ? 'pfSense+ 24.11-RELEASE' : 'Captive-Sync v4.2 (RADIUS)',
    gatewayIp: brand.defaultSubnet,
    subnet,
    macAddress,
    deviceIp,
    ssidDetected: 'VXK_PREPAID_HOTSPOT',
    pfsenseEndpoint: `https://${PFSENSE_AUTHORITY_CONFIG.masterHost}:${PFSENSE_AUTHORITY_CONFIG.authPort}${brand.portalRedirectPath}`,
    pfsenseReachable: true,
    latencyMs: 14,
    scannedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };
}

export interface PartnerRegistrationInput {
  partnerBusinessName: string;
  location: string;
  deviceName: string;
  brandId: string;
  macAddress: string;
  gatewayIp: string;
  isDirectConnection: boolean;
  scanCompleted: boolean;
  scanConfirmed: boolean;
}

export function validatePartnerDeviceRegistration(input: PartnerRegistrationInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.partnerBusinessName || !input.partnerBusinessName.trim()) {
    errors.partnerBusinessName = 'Wi-Fi business partner / venue name is required';
  }
  if (!input.deviceName || !input.deviceName.trim()) {
    errors.deviceName = 'Device name / friendly label is required';
  }
  const brandExists = CAPTIVE_DEVICE_BRANDS.some((b) => b.id === input.brandId);
  if (!brandExists) {
    errors.brandId = 'Select a supported captive portal router brand';
  }
  const macCheck = validateMacAddress(input.macAddress);
  if (!macCheck.isValid) {
    errors.macAddress = macCheck.error || 'Invalid MAC address';
  }
  const ipCheck = validateIPv4(input.gatewayIp);
  if (!ipCheck.isValid) {
    errors.gatewayIp = ipCheck.error || 'Invalid gateway IP';
  }
  if (input.isDirectConnection) {
    if (!input.scanCompleted) {
      errors.scan = 'Run a device scan on the connected router before registering';
    } else if (!input.scanConfirmed) {
      errors.scanConfirmed = 'Please confirm the scanned router details to add to the partner dashboard';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function authorizePartnerDeviceWithPfSense(
  device: PartnerDevice,
  voucherCode?: string
): {
  ok: boolean;
  updatedDevice?: PartnerDevice;
  error?: string;
} {
  let normalizedVoucher: string | undefined = device.approvedVoucherCode;
  if (voucherCode && voucherCode.trim()) {
    const check = validateVoucherCode(voucherCode);
    if (!check.isValid) {
      return { ok: false, error: check.error || 'Invalid pfSense+ voucher code' };
    }
    normalizedVoucher = check.normalized;
  }

  return {
    ok: true,
    updatedDevice: {
      ...device,
      pfsenseAuthStatus: 'Authorized',
      voucherAuthority: 'pfSense+ Master',
      approvedVoucherCode: normalizedVoucher || 'PFS-VOUCH-SYNC',
      lastSyncedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    },
  };
}

export function computePartnerDashboardStats(devices: PartnerDevice[]) {
  const totalDevices = devices.length;
  const authorizedCount = devices.filter((d) => d.pfsenseAuthStatus === 'Authorized').length;
  const pendingCount = devices.filter((d) => d.pfsenseAuthStatus === 'Pending Auth').length;
  const uniqueBrandsCount = new Set(devices.map((d) => d.brandId)).size;
  const totalActiveSessions = devices.reduce((acc, d) => acc + d.activeSessions, 0);

  return {
    totalDevices,
    authorizedCount,
    pendingCount,
    uniqueBrandsCount,
    totalActiveSessions,
  };
}
