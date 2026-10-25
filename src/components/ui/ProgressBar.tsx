'use client';

import React from 'react';
import { TOKENS } from '@/lib/tokens';

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
        <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
}
