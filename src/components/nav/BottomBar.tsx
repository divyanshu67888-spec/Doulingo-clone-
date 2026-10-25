'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav.config';
import { NotificationBell } from './NotificationBell';
import { TOKENS } from '@/lib/tokens';

export function MobileHeader() {
  return (
    <header
      className="sm:hidden sticky top-0 left-0 right-0 h-14 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none"
      aria-label="Mobile Header"
    >
      <Link href="/home" className="flex items-center gap-2 focus:outline-none">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
          style={{ backgroundColor: TOKENS.colors.brand.green }}
        >
          LQ
        </div>
        <span className="text-lg font-black tracking-tight" style={{ color: TOKENS.colors.brand.green }}>
          LinguaQuest
        </span>
      </Link>
      <NotificationBell />
    </header>
  );
}

export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md z-30 select-none pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Navigation Bar"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px] ${
                isActive ? 'text-[#58CC02]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
              }`}
            >
              <Icon
                className="w-5 h-5 mb-0.5"
                style={{ color: isActive ? TOKENS.colors.brand.green : undefined }}
              />
              <span className={`text-[11px] leading-tight ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
