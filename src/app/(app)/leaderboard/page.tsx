'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStats } from '@/hooks/useUserStats';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TOKENS } from '@/lib/tokens';
import { Trophy, Shield, Sparkles, User as UserIcon } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoUrl: string | null;
  totalXp: number;
  rank: number;
  isCurrentUser: boolean;
  isSeed: boolean;
}

interface LeaderboardData {
  topUsers: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  currentUserRank: number;
  totalParticipants: number;
}

export default function LeaderboardPage() {
  const { stats } = useUserStats();

  const { data, isLoading } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to load leaderboard');
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const league = stats?.league || {
    tier: 'Bronze',
    nextTier: 'Silver',
    xpToNext: 500,
    progress: 0,
    note: '500 XP to reach Silver',
    isTopLeague: false,
  };

  const isUserInTop10 = data.currentUserRank > 0 && data.currentUserRank <= 10;
  const showSeparateUserRow = !isUserInTop10 && data.currentUserEntry !== null;

  const leagueColorKey = league.tier.toLowerCase() as keyof typeof TOKENS.colors.leagues;
  const leagueColor = TOKENS.colors.leagues[leagueColorKey] || '#58CC02';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 select-none">
      {/* League Header Card */}
      <div
        className="p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-md relative overflow-hidden"
        style={{ borderRadius: TOKENS.radii.card }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: leagueColor }}
            >
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Current League
              </span>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {league.tier} League
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-gray-400 block">Rank</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              #{data.currentUserRank || '-'}
            </span>
          </div>
        </div>

        {/* League progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
            <span>{league.note}</span>
            <span>{Math.round(league.progress * 100)}%</span>
          </div>
          <ProgressBar
            value={league.progress * 100}
            max={100}
            color={leagueColor}
            height="12px"
          />
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border-2 border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFC800]" />
            <h2 className="font-black text-gray-900 dark:text-white text-base">Top Learners</h2>
          </div>
          <span className="text-xs text-gray-500 font-semibold">
            {data.totalParticipants} learners competing
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.topUsers.map((user) => {
            const isRank1 = user.rank === 1;
            const isRank2 = user.rank === 2;
            const isRank3 = user.rank === 3;

            return (
              <div
                key={user.userId}
                className={`flex items-center justify-between px-5 py-4 transition-colors ${
                  user.isCurrentUser
                    ? 'bg-[#58CC02]/10 dark:bg-[#58CC02]/20 font-bold border-l-4 border-l-[#58CC02]'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
                style={{ minHeight: TOKENS.spacing.minTouchTarget }}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-7 text-center font-black text-sm flex-shrink-0">
                    {isRank1 ? (
                      <span className="text-xl">🥇</span>
                    ) : isRank2 ? (
                      <span className="text-xl">🥈</span>
                    ) : isRank3 ? (
                      <span className="text-xl">🥉</span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">{user.rank}</span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-black text-sm flex-shrink-0 overflow-hidden">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      user.displayName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm truncate ${user.isCurrentUser ? 'text-[#58CC02] font-black' : 'text-gray-900 dark:text-white font-bold'}`}>
                      {user.displayName}
                      {user.isCurrentUser && ' (You)'}
                    </p>
                    {user.isSeed && (
                      <span className="text-[10px] text-gray-400 block font-normal">Active learner</span>
                    )}
                  </div>
                </div>

                {/* Right: XP */}
                <div className="text-right flex-shrink-0">
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                    {user.totalXp} XP
                  </span>
                </div>
              </div>
            );
          })}

          {/* Separator and Current User Row if outside Top 10 */}
          {showSeparateUserRow && data.currentUserEntry && (
            <>
              <div className="px-6 py-2.5 bg-gray-50 dark:bg-gray-900/60 text-center text-xs font-bold text-gray-400">
                • • •
              </div>
              <div
                className="flex items-center justify-between px-5 py-4 bg-[#58CC02]/15 dark:bg-[#58CC02]/25 border-l-4 border-l-[#58CC02]"
                style={{ minHeight: TOKENS.spacing.minTouchTarget }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-7 text-center font-black text-sm text-gray-500 dark:text-gray-400">
                    {data.currentUserEntry.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#58CC02]/20 border-2 border-[#58CC02] flex items-center justify-center text-[#58CC02] font-black text-sm">
                    {data.currentUserEntry.photoUrl ? (
                      <img src={data.currentUserEntry.photoUrl} alt="You" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      data.currentUserEntry.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#58CC02] truncate">
                      {data.currentUserEntry.displayName} (You)
                    </p>
                    <span className="text-[10px] text-gray-500 block">Your true rank</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-black text-sm text-[#58CC02]">
                    {data.currentUserEntry.totalXp} XP
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
