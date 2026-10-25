'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Flame, Award, ArrowDown, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TOKENS } from '@/lib/tokens';

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery<{ notifications: NotificationItem[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json();
    },
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications/read', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && (data?.unreadCount ?? 0) > 0) {
      markReadMutation.mutate();
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = data?.unreadCount ?? 0;
  const badgeText = unreadCount > 9 ? '9+' : unreadCount > 0 ? `${unreadCount}` : null;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex items-center justify-center w-12 h-12 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#58CC02]"
        style={{ minHeight: TOKENS.spacing.minTouchTarget, minWidth: TOKENS.spacing.minTouchTarget }}
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        {badgeText && (
          <span
            className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white rounded-full animate-pulse"
            style={{ backgroundColor: TOKENS.colors.semantic.hearts }}
          >
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
          role="region"
          aria-label="Notifications panel"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-[#58CC02] font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Marked as read
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {(!data?.notifications || data.notifications.length === 0) ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No notifications right now. Keep up your streak!
              </div>
            ) : (
              data.notifications.map((n) => {
                let Icon = Award;
                let iconColor: string = TOKENS.colors.semantic.xp;
                if (n.type === 'streak_reminder') {
                  Icon = Flame;
                  iconColor = TOKENS.colors.semantic.streak;
                } else if (n.type === 'rank_change') {
                  Icon = ArrowDown;
                  iconColor = TOKENS.colors.semantic.hearts;
                }

                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${
                      !n.readAt ? 'bg-green-50/30 dark:bg-green-950/10' : ''
                    }`}
                  >
                    <div
                      className="p-2 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${iconColor}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-snug break-words">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
