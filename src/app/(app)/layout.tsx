import React from 'react';
import { Sidebar } from '@/components/nav/Sidebar';
import { TopBar } from '@/components/nav/TopBar';
import { BottomBar, MobileHeader } from '@/components/nav/BottomBar';

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#121212] overflow-x-hidden">
      {/* Desktop Left Sidebar: >=1024px */}
      <Sidebar />

      {/* Tablet TopBar: 640-1023px */}
      <TopBar />

      {/* Mobile Top Header: <640px */}
      <MobileHeader />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 pb-24 sm:pb-8 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation: <640px */}
      <BottomBar />
    </div>
  );
}
