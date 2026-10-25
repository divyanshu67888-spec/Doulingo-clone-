'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { TOKENS } from '@/lib/tokens';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  asSheetOnMobile?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  asSheetOnMobile = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full bg-white dark:bg-[#1c1c1c] shadow-2xl border-t sm:border-2 border-gray-200 dark:border-gray-800 transition-all ${
          asSheetOnMobile
            ? 'rounded-t-[28px] sm:rounded-[24px] max-h-[90vh] overflow-y-auto sm:max-w-md'
            : 'rounded-[24px] max-w-md max-h-[90vh] overflow-y-auto'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800/80">
          {title ? (
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ minHeight: TOKENS.spacing.minTouchTarget, minWidth: TOKENS.spacing.minTouchTarget }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
