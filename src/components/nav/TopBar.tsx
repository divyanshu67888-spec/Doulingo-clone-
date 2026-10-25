'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav.config';
import { NotificationBell } from './NotificationBell';
import { TOKENS } from '@/lib/tokens';

export function TopBar() {
  const pathname = usePathname();

  return (
    <header
      className="hidden sm:flex lg:hidden sticky top-0 left-0 right-0 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md px-4 items-center justify-between z-30 select-none"
      aria-label="Tablet Navigation"
    >
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-2 flex-shrink-0 focus:outline-none">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-base"
          style={{ backgroundColor: TOKENS.colors.brand.green }}
        >
          LQ
        </div>
        <span className="text-lg font-black tracking-tight" style={{ color: TOKENS.colors.brand.green }}>
          LinguaQuest
        </span>
      </Link>

      {/* 5 items with icon and label */}
      <nav className="flex items-center gap-1 mx-2" aria-label="Tablet Links">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                isActive
                  ? 'text-[#58CC02] bg-[#58CC02]/10'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
              }`}
              style={{ minHeight: TOKENS.spacing.minTouchTarget }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bell */}
      <div className="flex-shrink-0">
        <NotificationBell />
      </div>
    </header>
  );
}
