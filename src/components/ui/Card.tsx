'use client';

import React from 'react';
import { TOKENS } from '@/lib/tokens';

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1a1a1a] rounded-2xl border-2 border-gray-200 dark:border-gray-800 transition-all duration-150 ${className}`}
      style={{
        boxShadow: TOKENS.shadows.card,
        borderRadius: TOKENS.radii.card,
      }}
    >
      {children}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  color = TOKENS.colors.brand.green,
  height = '14px',
  className = '',
}: {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  className?: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative ${className}`}
      style={{ height, borderRadius: TOKENS.radii.pill }}
    >
      <div
        className="h-full rounded-full transition-all duration-300 relative"
        style={{
          width: `${percent}%`,
          backgroundColor: color,
        }}
      >
        {/* Shiny highlight */}
        <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
}
