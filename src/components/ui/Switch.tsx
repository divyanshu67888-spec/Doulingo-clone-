'use client';

import React from 'react';
import { TOKENS } from '@/lib/tokens';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: SwitchProps) {
  const switchId = id || `switch-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center justify-between py-3 min-h-[48px]">
      <label htmlFor={switchId} className="flex-1 pr-4 cursor-pointer select-none">
        <span className="text-base font-bold text-gray-900 dark:text-gray-100 block">
          {label}
        </span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
            {description}
          </span>
        )}
      </label>

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#58CC02] ${
          checked ? 'bg-[#58CC02]' : 'bg-gray-300 dark:bg-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ minHeight: '32px', minWidth: '56px' }}
      >
        <span
          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
          style={{ borderRadius: TOKENS.radii.pill }}
        />
      </button>
    </div>
  );
}
