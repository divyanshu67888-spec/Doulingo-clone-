'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStats } from '@/hooks/useUserStats';
import { WeeklyChart } from '@/components/profile/WeeklyChart';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { TOKENS } from '@/lib/tokens';
import {
  Flame,
  Zap,
  Heart,
  Clock,
  Award,
  BookOpen,
  Settings,
  LogOut,
  Pencil,
  Crown,
} from 'lucide-react';

function formatTimeSpent(seconds: number): string {
  if (!seconds || seconds < 60) return '< 1m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { stats, isLoading, invalidateStats } = useUserStats();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-[#58CC02] overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl font-black text-gray-600 shadow-inner flex-shrink-0">
              {stats.photoUrl ? (
                <img src={stats.photoUrl} alt={stats.displayName} className="w-full h-full object-cover" />
              ) : (
                stats.displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  {stats.displayName}
                </h1>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  aria-label="Edit Profile"
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Learning Spanish • Daily goal: {stats.dailyGoal} XP
              </p>

              {/* Level Progress */}
              <div className="mt-3 w-48 sm:w-64 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                  <span>{stats.level.isMaxLevel ? 'Max level' : `Level ${stats.level.level}`}</span>
                  <span>
                    {stats.level.isMaxLevel ? '100%' : `${stats.level.xpInLevel}/100 XP`}
                  </span>
                </div>
                <ProgressBar
                  value={stats.level.progress * 100}
                  max={100}
                  color={TOKENS.colors.semantic.xp}
                  height="10px"
                />
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/settings')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Streak & Longest Streak */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 flex-shrink-0">
            <Flame className="w-6 h-6 fill-orange-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500">Streak / Longest</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {stats.streak.currentStreak} / {stats.streak.longestStreak} d
            </p>
          </div>
        </div>

        {/* Total XP */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 flex-shrink-0">
            <Zap className="w-6 h-6 fill-yellow-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500">Total XP</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {stats.totalXp} XP
            </p>
          </div>
        </div>

        {/* Time Spent */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500">Time Learning</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {formatTimeSpent(stats.totalSeconds)}
            </p>
          </div>
        </div>

        {/* League */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500">Current League</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {stats.league.tier}
            </p>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500">Completed Lessons</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {stats.completedCount} of {stats.totalUnitsCount}
            </p>
          </div>
        </div>

        {/* Hearts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 flex-shrink-0">
            <Heart className="w-6 h-6 fill-red-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500">Hearts</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {stats.hearts.hearts}/5
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <WeeklyChart />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentName={stats.displayName}
        currentPhoto={stats.photoUrl}
        currentGoal={stats.dailyGoal}
        onSuccess={() => invalidateStats()}
      />
    </div>
  );
}
