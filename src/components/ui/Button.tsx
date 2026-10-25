'use client';

import React from 'react';
import { TOKENS } from '@/lib/tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'blue' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  fullWidthMobile?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidthMobile = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  let variantStyles = '';
  let shadowStyle = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-[#58CC02] text-white hover:brightness-105 active:translate-y-[2px]';
      shadowStyle = disabled ? 'none' : '0 4px 0 #46A302';
      break;
    case 'secondary':
      variantStyles = 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 active:translate-y-[2px]';
      shadowStyle = disabled ? 'none' : '0 4px 0 #CECECE';
      break;
    case 'danger':
      variantStyles = 'bg-[#FF4B4B] text-white hover:brightness-105 active:translate-y-[2px]';
      shadowStyle = disabled ? 'none' : '0 4px 0 #D43232';
      break;
    case 'blue':
      variantStyles = 'bg-[#1CB0F6] text-white hover:brightness-105 active:translate-y-[2px]';
      shadowStyle = disabled ? 'none' : '0 4px 0 #1899D6';
      break;
    case 'yellow':
      variantStyles = 'bg-[#FFC800] text-gray-900 font-extrabold hover:brightness-105 active:translate-y-[2px]';
      shadowStyle = disabled ? 'none' : '0 4px 0 #CCA000';
      break;
    case 'outline':
      variantStyles = 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 active:translate-y-[1px]';
      shadowStyle = disabled ? 'none' : '0 2px 0 #E5E5E5';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5';
      shadowStyle = 'none';
      break;
  }

  const sizeStyles =
    size === 'sm'
      ? 'px-4 py-2 text-sm min-h-[44px]'
      : size === 'lg'
      ? 'px-8 py-3.5 text-lg min-h-[52px]'
      : 'px-6 py-3 text-base min-h-[48px]';

  const disabledStyles = disabled
    ? 'opacity-40 cursor-not-allowed transform-none !shadow-none'
    : 'cursor-pointer active:shadow-none';

  const widthStyle = fullWidthMobile ? 'w-full sm:w-auto' : '';

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-bold tracking-wide rounded-full select-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:ring-offset-2 ${sizeStyles} ${variantStyles} ${disabledStyles} ${widthStyle} ${className}`}
      style={{
        boxShadow: shadowStyle,
        borderRadius: TOKENS.radii.pill,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
