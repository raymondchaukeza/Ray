import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Upload,
  CheckCircle2,
  Eye,
  Send,
  FileText,
  Phone,
  User,
  Hash,
  Wifi,
  Sparkles,
  Info,
  Trash2,
} from 'lucide-react';
import { FaultTicket, UserSession } from '../types/index.ts';
import {
  LINE_SPEED_PACKAGES,
  validateFaultTicket,
  classifyFaultPriority,
  formatZARPhone,
} from '../utils/ticketRules.ts';

interface FaultReportTicketFormProps {
  currentUser: UserSession | null;
  onSubmitTicket: (ticket: FaultTicket) => void;
  onClose?: () => void;
  isOverlay?: boolean;
  initialLineSpeed?: string;
  initialVoucherError?: string;
}

export const FaultReportTicketForm: React.FC<FaultReportTicketFormProps> = ({
  currentUser,
  onSubmitTicket,
  onClose,
  isOverlay = false,
  initialLineSpeed,
  initialVoucherError,
}) => {
  // Form State
  const [phoneNumbers, setPhoneNumbers] = useState(currentUser?.phone || '');
  const [accountNumber, setAccountNumber] = useState(currentUser?.accountNumber || '');
  const [faultDetails, setFaultDetails] = useState('');
  const [lineSpeed, setLineSpeed] = useState(initialLineSpeed || currentUser?.lineSpeed || '_none');
  const [idNumber, setIdNumber] = useState(currentUser?.idNumber || '');
  const [voucherError, setVoucherError] = useState(initialVoucherError || '');

  // Uploaded Image State
  const [imageFileName, setImageFileName] = useState<string | undefined>(undefined);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validation & UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // Auto populate if user or initial props change
  useEffect(() => {
    if (currentUser) {
      if (!phoneNumbers) setPhoneNumbers(currentUser.phone);
      if (!accountNumber) setAccountNumber(currentUser.accountNumber);
      if (!idNumber) setIdNumber(currentUser.idNumber);
      if (lineSpeed === '_none' && currentUser.lineSpeed && !initialLineSpeed) {
        setLineSpeed(currentUser.lineSpeed);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialLineSpeed) {
      setLineSpeed(initialLineSpeed);
    }
  }, [initialLineSpeed]);

  useEffect(() => {
    if (initialVoucherError) {
      setVoucherError(initialVoucherError);
    }
  }, [initialVoucherError]);

  const detectedPriority = classifyFaultPriority(faultDetails);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 64MB as per Drupal spec
    const maxSizeBytes = 64 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('Files must be less than 64 MB.');
      return;
    }

    // Allowed file types: png gif jpg jpeg
    const validTypes = ['image/png', 'image/gif', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Allowed file types: png gif jpg jpeg.');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFileName(undefined);
    setImageDataUrl(undefined);
    setUploadError(null);
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateFaultTicket({
      phoneNumbers,
      accountNumber,
      faultDetails,
      lineSpeed,
      idNumber,
      voucherError,
    });
    setErrors(validation.errors);
    if (validation.isValid) {
      setPreviewMode(true);
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validation = validateFaultTicket({
      phoneNumbers,
      accountNumber,
      faultDetails,
      lineSpeed,
      idNumber,
      voucherError,
    });
    setErrors(validation.errors);
    if (!validation.isValid) {
      setPreviewMode(false);
      return;
    }

    setIsSubmitting(true);
    const randomTicketNumber = Math.floor(1000 + Math.random() * 9000);
    const newId = `TK-2026-${randomTicketNumber}`;

    setTimeout(() => {
      const now = new Date();
      const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const createdTicket: FaultTicket = {
        id: newId,
        createdAt: dateString,
        phoneNumbers: phoneNumbers.trim(),
        accountNumber: accountNumber.trim().toUpperCase(),
        faultDetails: faultDetails.trim(),
        lineSpeed,
        idNumber: idNumber.trim(),
        voucherError: voucherError.trim() || undefined,
        imageFileName,
        imageDataUrl,
        status: 'Open',
        priority: detectedPriority,
        category: detectedPriority === 'Critical' ? 'Critical Outage' : 'Service Disruption',
        notes: [
          {
            id: `n-${Date.now()}`,
            author: currentUser?.name || 'Customer Ticket Submission',
            text: faultDetails.trim(),
            timestamp: dateString,
            isStaff: false,
          },
          {
            id: `n-${Date.now() + 1}`,
            author: 'VXK NOC Automated Dispatch',
            text: `Ticket generated with priority [${detectedPriority}]. Notification dispatched to regional field engineering team.`,
            timestamp: dateString,
            isStaff: true,
          },
        ],
        estimatedResolution: detectedPriority === 'Critical' ? 'Within 4-8 hours' : 'Within 24 hours',
      };

      onSubmitTicket(createdTicket);
      setIsSubmitting(false);
      setSubmittedTicketId(newId);
    }, 600);
  };

  if (submittedTicketId) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">Fault Report Ticket Created!</h3>
        <p className="text-slate-400 text-sm mb-4">
          Your ticket has been logged into the VXK Tech NOC queue with reference:
        </p>
        <div className="inline-block px-4 py-2 bg-slate-800 rounded-xl border border-cyan-500/40 text-cyan-300 font-mono text-lg font-bold mb-6">
          {submittedTicketId}
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 text-left text-xs text-slate-300 space-y-2 mb-6 border border-slate-700/60">
          <div className="flex justify-between">
            <span className="text-slate-400">Account:</span>
            <span className="font-mono font-semibold">{accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">SMS Notification to:</span>
            <span className="font-semibold">{formatZARPhone(phoneNumbers)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Line Package:</span>
            <span>{lineSpeed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Assigned Priority:</span>
            <span className="text-amber-400 font-semibold">{detectedPriority}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              setSubmittedTicketId(null);
              setFaultDetails('');
              setVoucherError('');
              setImageFileName(undefined);
              setImageDataUrl(undefined);
              if (onClose) onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition"
          >
            Track in Tickets Dashboard
          </button>
          <button
            onClick={() => {
              setSubmittedTicketId(null);
              setFaultDetails('');
              setVoucherError('');
              setImageFileName(undefined);
              setImageDataUrl(undefined);
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
          >
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${isOverlay ? 'max-w-3xl w-full' : 'max-w-3xl mx-auto'}`}>
      {/* Header Banner */}
      <div
        className="bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 border-b border-slate-800 px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#ff0000' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-lg sm:text-xl font-bold text-white tracking-tight"
                id="page-title"
                style={{ fontSize: '24px' }}
              >
                Create FAULT REPORT TICKET
              </h2>
              {isOverlay && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Drupal Overlay
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400" style={{ fontSize: '16px' }}>
              Submit fiber, wireless or voucher connection issues directly to VXK Tech NOC
            </p>
          </div>
        </div>
        {isOverlay && onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            aria-label="Close overlay dialog"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8" style={{ backgroundColor: '#000000' }}>
        {/* Quick Fill Preset Buttons for fast testing */}
        <div className="mb-6 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Quick Example Pre-fills:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setPhoneNumbers('0824559102');
                setAccountNumber('VXK-8421');
                setFaultDetails('Continuous red optical LOS light on router since storm. No internet across all devices.');
                setLineSpeed('10/5Mbps @R900pm');
                setIdNumber('8906155234089');
                setVoucherError('');
                setErrors({});
              }}
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition text-[11px]"
            >
              Fiber LOS Red Light
            </button>
            <button
              type="button"
              onClick={() => {
                setPhoneNumbers('0718894210');
                setAccountNumber('VXK-WIFI-304');
                setFaultDetails('Voucher code gives error ERR-VOUCH-303 when logging in on public captive portal.');
                setLineSpeed('20/10Mbps PUBLIC HOT SPOT WiFi @R1050pm');
                setIdNumber('9502100876082');
                setVoucherError('ERR-VOUCH-303 (Already redeemed)');
                setErrors({});
              }}
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition text-[11px]"
            >
              Voucher Error
            </button>
          </div>
        </div>

        {/* Preview Mode Modal / View */}
        {previewMode ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/80 text-cyan-200 flex items-start gap-3">
              <Eye className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Ticket Preview</h4>
                <p className="text-xs text-cyan-300/80">
                  Review your fault details below. Click "Save & Confirm" to transmit this ticket to VXK support.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">PHONE NUMBERS</span>
                  <span className="font-semibold text-white">{formatZARPhone(phoneNumbers)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">VXK TECH ACCOUNT NUMBER</span>
                  <span className="font-mono font-bold text-cyan-400">{accountNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">ID NUMBER</span>
                  <span className="font-mono text-slate-200">{idNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">LINE SPEED</span>
                  <span className="font-semibold text-white">{lineSpeed}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">DETAILS OF FAULT</span>
                <p className="p-3 bg-slate-900 rounded-lg text-slate-200 whitespace-pre-wrap border border-slate-700">
                  {faultDetails}
                </p>
              </div>

              {voucherError && (
                <div>
                  <span className="text-xs text-slate-400 block">ERROR ON THIS VOUCHER CODE</span>
                  <span className="font-mono text-amber-400">{voucherError}</span>
                </div>
              )}

              {imageFileName && (
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Attached Picture:</span>
                  <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-700">
                    {imageDataUrl && (
                      <img
                        src={imageDataUrl}
                        alt="Uploaded fault"
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <span className="text-xs text-slate-300 font-mono">{imageFileName}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-400">Assigned Severity:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  detectedPriority === 'Critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : detectedPriority === 'High'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}>
                  {detectedPriority} Priority
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit()}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting to NOC...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save & Transmit Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* The Form corresponding to Drupal node/add/fault-report-ticket */
          <form
            id="fault-report-ticket-node-form"
            className="space-y-5"
            onSubmit={handlePreview}
          >
            {/* 1. PHONE NUMBERS */}
            <div className="form-item" id="edit-field-phone-numbers">
              <label
                htmlFor="edit-field-phone-numbers-und-0-value"
                className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5"
              >
                PHONE NUMBERS <span className="text-red-400" title="This field is required.">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="edit-field-phone-numbers-und-0-value"
                  name="field_phone_numbers[und][0][value]"
                  maxLength={10}
                  value={phoneNumbers}
                  onChange={(e) => {
                    setPhoneNumbers(e.target.value);
                    if (errors.phoneNumbers) setErrors({ ...errors, phoneNumbers: '' });
                  }}
                  placeholder="e.g. 0824559102"
                  style={{ backgroundColor: '#000000' }}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
                    errors.phoneNumbers ? 'border-red-500 bg-red-950/20' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.phoneNumbers && (
                <p className="mt-1 text-xs text-red-400">{errors.phoneNumbers}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400" style={{ fontSize: '13px' }}>
                10-digit South African mobile or landline for SMS ticket updates.
              </p>
            </div>

            {/* 2. YOUR VXK TECH ACCOUNT NUMBER */}
            <div className="form-item" id="edit-title-wrapper">
              <label
                htmlFor="edit-title"
                className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5"
              >
                YOUR VXK TECH ACCOUNT NUMBER <span className="text-red-400" title="This field is required.">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  maxLength={255}
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                  }}
                  placeholder="e.g. VXK-8421 or VXK-WIFI-304"
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
                    errors.accountNumber ? 'border-red-500 bg-red-950/20' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.accountNumber && (
                <p className="mt-1 text-xs text-red-400">{errors.accountNumber}</p>
              )}
            </div>

            {/* 3. DETAILS OF FAULT THAT YOU ARE ABOUT TO REPORT */}
            <div className="form-item" id="edit-body">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="edit-body-und-0-value"
                  className="block text-xs font-bold text-slate-200 uppercase tracking-wider"
                >
                  DETAILS OF FAULT THAT YOU ARE ABOUT TO REPORT{' '}
                  <span className="text-red-400" title="This field is required.">*</span>
                </label>
                {faultDetails.trim().length > 0 && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    detectedPriority === 'Critical'
                      ? 'bg-red-500/20 text-red-400'
                      : detectedPriority === 'High'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    Detected Priority: {detectedPriority}
                  </span>
                )}
              </div>
              <textarea
                id="edit-body-und-0-value"
                name="body[und][0][value]"
                rows={3}
                value={faultDetails}
                onChange={(e) => {
                  setFaultDetails(e.target.value);
                  if (errors.faultDetails) setErrors({ ...errors, faultDetails: '' });
                }}
                placeholder="Describe router lights (e.g. Red LOS, PON blinking), loss of connection, or physical cable issues..."
                style={{ backgroundColor: '#060606' }}
                className={`w-full p-3 bg-slate-800/80 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition resize-y ${
                  errors.faultDetails ? 'border-red-500 bg-red-950/20' : 'border-slate-700'
                }`}
              />
              {errors.faultDetails && (
                <p className="mt-1 text-xs text-red-400">{errors.faultDetails}</p>
              )}
            </div>

            {/* 4. LINE SPEED */}
            <div className="form-item" id="edit-field-line-speed">
              <label
                htmlFor="edit-field-line-speed-und"
                className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5"
              >
                LINE SPEED <span className="text-red-400" title="This field is required.">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Wifi className="w-4 h-4" />
                </div>
                <select
                  id="edit-field-line-speed-und"
                  name="field_line_speed[und]"
                  value={lineSpeed}
                  onChange={(e) => {
                    setLineSpeed(e.target.value);
                    if (errors.lineSpeed) setErrors({ ...errors, lineSpeed: '' });
                  }}
                  className={`w-full pl-9 pr-8 py-2.5 bg-slate-800/80 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition appearance-none ${
                    errors.lineSpeed ? 'border-red-500 bg-red-950/20' : 'border-slate-700'
                  }`}
                >
                  <option value="_none">- Select a value -</option>
                  {LINE_SPEED_PACKAGES.map((pkg) => (
                    <option key={pkg.value} value={pkg.value}>
                      {pkg.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
              {errors.lineSpeed && (
                <p className="mt-1 text-xs text-red-400">{errors.lineSpeed}</p>
              )}
            </div>

            {/* 5. PICTURES (Managed file upload) */}
            <div className="form-item" id="edit-field-image">
              <fieldset
                className="border border-slate-700/80 rounded-xl p-4 bg-slate-800/30"
                style={{ backgroundColor: '#000000' }}
              >
                <legend className="px-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Pictures (Optional)
                </legend>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label
                      htmlFor="edit-field-image-und-0-upload"
                      style={{ backgroundColor: '#054402' }}
                      className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 transition"
                    >
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>{imageFileName ? 'Change file' : 'Choose Picture'}</span>
                    </label>
                    <input
                      type="file"
                      id="edit-field-image-und-0-upload"
                      name="files[field_image_und_0]"
                      accept="image/png,image/gif,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {imageFileName && (
                      <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                        {imageDataUrl && (
                          <img
                            src={imageDataUrl}
                            alt="Preview"
                            className="w-6 h-6 object-cover rounded"
                          />
                        )}
                        <span className="text-slate-300 font-mono truncate max-w-[200px]">
                          {imageFileName}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-slate-400 hover:text-red-400 ml-1"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <p className="text-xs text-red-400">{uploadError}</p>
                  )}

                  <div className="text-[11px] text-slate-400" style={{ fontSize: '13px' }}>
                    Files must be less than <strong className="text-slate-300">64 MB</strong>.<br />
                    Allowed file types: <strong className="text-slate-300">png gif jpg jpeg</strong>. (e.g. photos of router LEDs, damaged fiber cables, or error screenshots).
                  </div>
                </div>
              </fieldset>
            </div>

            {/* 6. ID NUMBER */}
            <div className="form-item" id="edit-field-id-number">
              <label
                htmlFor="edit-field-id-number-und-0-value"
                className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5"
              >
                ID NUMBER <span className="text-red-400" title="This field is required.">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="edit-field-id-number-und-0-value"
                  name="field_id_number[und][0][value]"
                  maxLength={15}
                  value={idNumber}
                  onChange={(e) => {
                    setIdNumber(e.target.value);
                    if (errors.idNumber) setErrors({ ...errors, idNumber: '' });
                  }}
                  placeholder="e.g. 8906155234089 (RSA ID or Passport)"
                  style={{ backgroundColor: '#084608' }}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
                    errors.idNumber ? 'border-red-500 bg-red-950/20' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.idNumber && (
                <p className="mt-1 text-xs text-red-400">{errors.idNumber}</p>
              )}
            </div>

            {/* 7. ERROR ON THIS VOUCHER CODE */}
            <div className="form-item" id="edit-field-error-on-this-voucher-code">
              <label
                htmlFor="edit-field-error-on-this-voucher-code-und-0-value"
                className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5"
              >
                ERROR ON THIS VOUCHER CODE (Optional)
              </label>
              <input
                type="text"
                id="edit-field-error-on-this-voucher-code-und-0-value"
                name="field_error_on_this_voucher_code[und][0][value]"
                maxLength={30}
                value={voucherError}
                onChange={(e) => setVoucherError(e.target.value)}
                placeholder="e.g. ERR-VOUCH-303 or PIN not accepted"
                style={{
                  backgroundColor: '#590000',
                  color: '#fbfffb',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  fontFamily: 'Courier New',
                }}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                If the fault involves a prepaid recharge voucher code or portal login error, enter the code or error code here.
              </p>
            </div>

            {/* FORM ACTIONS (Drupal: Save & Preview) */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3" id="edit-actions">
              <button
                type="button"
                id="edit-preview"
                onClick={handlePreview}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                id="edit-submit"
                onClick={() => handleFinalSubmit()}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save (Submit Ticket)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
