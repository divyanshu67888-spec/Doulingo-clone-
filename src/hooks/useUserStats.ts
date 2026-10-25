'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface UserStats {
  displayName: string;
  photoUrl: string | null;
  language: string;
  timeZone: string;
  dailyGoal: number;
  totalSeconds: number;
  totalXp: number;
  todayXp: number;
  level: {
    level: number;
    progress: number;
    xpInLevel: number;
    xpForNextLevel: number;
    isMaxLevel: boolean;
  };
  league: {
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Sapphire' | 'Ruby';
    nextTier: string | null;
    xpToNext: number;
    progress: number;
    note: string;
    isTopLeague: boolean;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    isActiveToday: boolean;
  };
  hearts: {
    hearts: number;
    maxHearts: number;
    nextHeartInSeconds: number | null;
  };
  progress: Array<{
    id: string;
    unitId: string;
    unitKey: string;
    title: string;
    description: string;
    orderIndex: number;
    status: 'locked' | 'unlocked' | 'completed';
    crowns: number;
    xpEarned: number;
    xpReward: number;
    exerciseCount: number;
  }>;
  completedCount: number;
  unlockedCount: number;
  totalUnitsCount: number;
  continueUnitId: string;
  unreadNotifications: number;
  settings?: {
    soundEnabled: boolean;
    remindersEnabled: boolean;
    emailRemindersEnabled: boolean;
  };
}

export function useUserStats() {
  const queryClient = useQueryClient();

  const query = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch stats');
      }
      return res.json();
    },
    refetchInterval: 30000, // 30s polling
  });

  const invalidateStats = () => {
    queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    queryClient.invalidateQueries({ queryKey: ['weekly-stats'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return {
    ...query,
    stats: query.data,
    invalidateStats,
  };
}
