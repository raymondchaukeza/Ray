import React, { useEffect } from 'react';
import { FaultReportTicketForm } from './FaultReportTicketForm.tsx';
import { FaultTicket, UserSession } from '../types/index.ts';

interface FaultReportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onSubmitTicket: (ticket: FaultTicket) => void;
  initialLineSpeed?: string;
  initialVoucherError?: string;
}

export const FaultReportTicketModal: React.FC<FaultReportTicketModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitTicket,
  initialLineSpeed,
  initialVoucherError,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-title"
    >
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="w-full max-w-3xl my-auto">
        <FaultReportTicketForm
          currentUser={currentUser}
          onSubmitTicket={onSubmitTicket}
          onClose={onClose}
          isOverlay={true}
          initialLineSpeed={initialLineSpeed}
          initialVoucherError={initialVoucherError}
        />
      </div>
    </div>
  );
};
