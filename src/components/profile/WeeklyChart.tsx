'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TOKENS } from '@/lib/tokens';

interface DayActivity {
  localDate: string;
  weekday: string;
  xp: number;
  isToday: boolean;
}

interface WeeklyStatsResponse {
  days: DayActivity[];
  axisMax: number;
  maxXp: number;
  totalWeeklyXp: number;
  isEmpty: boolean;
}

export function WeeklyChart() {
  const { data, isLoading } = useQuery<WeeklyStatsResponse>({
    queryKey: ['weekly-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats/weekly');
      if (!res.ok) throw new Error('Failed to load weekly stats');
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { days, axisMax, isEmpty, totalWeeklyXp } = data;
  const gridSteps = [axisMax, Math.round(axisMax * 0.75), Math.round(axisMax * 0.5), Math.round(axisMax * 0.25), 0];

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm"
      role="region"
      aria-label="Weekly Activity Chart"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white">Weekly Activity</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total earned this week: <span className="font-extrabold text-[#58CC02]">{totalWeeklyXp} XP</span>
          </p>
        </div>

        {isEmpty && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
            No XP yet this week
          </span>
        )}
      </div>

      {/* SVG Chart area */}
      <div className="relative h-48 w-full flex items-end">
        {/* Horizontal Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
          {gridSteps.map((step, idx) => (
            <div key={idx} className="flex items-center w-full">
              <span className="text-[10px] font-bold text-gray-400 w-8 text-right pr-2 select-none">
                {step}
              </span>
              <div className="flex-1 border-b border-gray-100 dark:border-gray-800/80" />
            </div>
          ))}
        </div>

        {/* 7 Bars Container */}
        <div className="relative z-10 w-full pl-8 flex items-end justify-between h-full pb-6 pt-2">
          {days.map((day) => {
            const heightPercent = day.xp > 0 ? Math.max(8, (day.xp / axisMax) * 100) : 0;
            const barColor = day.isToday ? TOKENS.colors.brand.green : '#94A3B8';

            return (
              <div
                key={day.localDate}
                className="flex-1 flex flex-col items-center justify-end h-full px-1 group"
              >
                {/* Tooltip on hover/focus */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded pointer-events-none shadow-md">
                  {day.xp} XP
                </div>

                {/* Bar */}
                <div
                  className="w-full max-w-[32px] rounded-t-lg transition-all duration-300 relative"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: barColor,
                    minHeight: day.xp > 0 ? '6px' : '0px',
                  }}
                  aria-label={`${day.weekday}, ${day.localDate}: ${day.xp} XP`}
                />

                {/* Weekday Label */}
                <span
                  className={`text-[11px] mt-2 block select-none ${
                    day.isToday ? 'font-black text-[#58CC02]' : 'font-semibold text-gray-500'
                  }`}
                >
                  {day.weekday}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
