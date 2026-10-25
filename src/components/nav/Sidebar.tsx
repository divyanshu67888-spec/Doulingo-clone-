'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav.config';
import { NotificationBell } from './NotificationBell';
import { TOKENS } from '@/lib/tokens';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] px-4 py-6 z-30 select-none"
      aria-label="Main Navigation"
    >
      {/* Brand Logo */}
      <div className="flex items-center justify-between px-3 mb-8">
        <Link href="/home" className="flex items-center gap-2.5 focus:outline-none">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md"
            style={{ backgroundColor: TOKENS.colors.brand.green }}
          >
            LQ
          </div>
          <span className="text-2xl font-black tracking-tight" style={{ color: TOKENS.colors.brand.green }}>
            LinguaQuest
          </span>
        </Link>
        <NotificationBell />
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1.5" aria-label="Sidebar Links">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base transition-all duration-150 border-2 font-bold ${
                isActive
                  ? 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
              }`}
              style={{ minHeight: TOKENS.spacing.minTouchTarget }}
            >
              <Icon
                className="w-6 h-6 flex-shrink-0"
                style={{ color: isActive ? TOKENS.colors.brand.green : undefined }}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 px-2 text-xs text-gray-400">
        <p className="font-semibold text-gray-500">LinguaQuest Web v1.0</p>
        <p className="text-[11px] mt-0.5">Learn Spanish daily</p>
      </div>
    </aside>
  );
}
