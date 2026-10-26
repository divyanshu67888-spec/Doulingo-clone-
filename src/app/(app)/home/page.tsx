'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStats } from '@/hooks/useUserStats';
import { LessonPath } from '@/components/dashboard/LessonPath';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { TOKENS } from '@/lib/tokens';
import { Flame, Zap, Heart, BookOpen, Award, ArrowRight, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { stats, isLoading, error } = useUserStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <p className="text-red-500 font-bold mb-4">Please log in to continue learning.</p>
        <Link href="/login">
          <Button variant="primary">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const handleContinueLearning = () => {
    if (stats.continueUnitId) {
      router.push(`/lesson/${stats.continueUnitId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 select-none">
      {/* Top Header: Greeting & Level Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          {/* Hard rule 7: Exactly `Welcome back, {displayName}!` and nothing else */}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Welcome back, {stats.displayName}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Ready to conquer today&apos;s Spanish milestones?
          </p>
        </div>

        {/* Small Level Badge & League Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1f1f1f] border-2 border-gray-200 dark:border-gray-800 shadow-sm">
            <Award className="w-4 h-4 text-[#FFC800]" />
            <span className="text-xs font-black text-gray-800 dark:text-gray-200">
              {stats.level.isMaxLevel ? 'Max level' : `Level ${stats.level.level}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1f1f1f] border-2 border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-black" style={{ color: TOKENS.colors.leagues[stats.league.tier.toLowerCase() as keyof typeof TOKENS.colors.leagues] || '#58CC02' }}>
              {stats.league.tier} League
            </span>
          </div>
        </div>
      </div>

      {/* Daily Goal & Continue Learning Container */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1c1c1c] border-2 border-gray-200 dark:border-gray-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#58CC02]" />
            <h2 className="text-base font-black text-gray-900 dark:text-white">Daily Goal</h2>
          </div>
          <span className="text-sm font-extrabold text-gray-600 dark:text-gray-300">
            {stats.todayXp} / {stats.dailyGoal} XP
          </span>
        </div>

        {/* Daily Goal Progress Bar */}
        <ProgressBar
          value={stats.todayXp}
          max={stats.dailyGoal}
          color={TOKENS.colors.brand.green}
          height="16px"
        />

        {/* Continue Learning Button directly below */}
        <Button
          onClick={handleContinueLearning}
          variant="primary"
          size="lg"
          className="w-full text-lg mt-2 flex items-center justify-center gap-2"
        >
          <span>Continue Learning</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 4 Stat Cards: Streak (Orange), XP (Yellow), Hearts (Red), Lessons (Blue) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Streak Card */}
        <div
          className="p-4 rounded-2xl border-2 border-orange-100 dark:border-orange-950/40 bg-gradient-to-br from-orange-50/70 to-white dark:from-orange-950/20 dark:to-[#1a1a1a] shadow-sm relative overflow-hidden"
          style={{ minHeight: TOKENS.spacing.minTouchTarget }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <Flame className="w-5 h-5 fill-orange-500" />
            </div>
            <span className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400">
              Streak
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.streak.currentStreak}
            </p>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {stats.streak.currentStreak === 1 ? 'day active' : 'days active'}
            </p>
          </div>
        </div>

        {/* 2. XP Card: Shows Today's XP and All-time XP */}
        <div
          className="p-4 rounded-2xl border-2 border-yellow-100 dark:border-yellow-950/40 bg-gradient-to-br from-yellow-50/70 to-white dark:from-yellow-950/20 dark:to-[#1a1a1a] shadow-sm relative overflow-hidden"
          style={{ minHeight: TOKENS.spacing.minTouchTarget }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Zap className="w-5 h-5 fill-yellow-500" />
            </div>
            <span className="text-xs font-bold uppercase text-yellow-600 dark:text-yellow-400">
              Experience
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.todayXp} <span className="text-xs font-normal text-gray-400">today</span>
            </p>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {stats.totalXp} all-time XP
            </p>
          </div>
        </div>

        {/* 3. Hearts Card */}
        <div
          className="p-4 rounded-2xl border-2 border-red-100 dark:border-red-950/40 bg-gradient-to-br from-red-50/70 to-white dark:from-red-950/20 dark:to-[#1a1a1a] shadow-sm relative overflow-hidden"
          style={{ minHeight: TOKENS.spacing.minTouchTarget }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <Heart className="w-5 h-5 fill-red-500" />
            </div>
            <span className="text-xs font-bold uppercase text-red-600 dark:text-red-400">
              Hearts
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>∞</span>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Unlimited</span>
            </p>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Unlimited practice
            </p>
          </div>
        </div>

        {/* 4. Lessons Card */}
        <div
          className="p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-950/40 bg-gradient-to-br from-blue-50/70 to-white dark:from-blue-950/20 dark:to-[#1a1a1a] shadow-sm relative overflow-hidden"
          style={{ minHeight: TOKENS.spacing.minTouchTarget }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
              Lessons
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.completedCount}/{stats.totalUnitsCount}
            </p>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              completed
            </p>
          </div>
        </div>
      </div>

      {/* Lesson Path Section */}
      <div className="pt-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Learning Path
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Advance node by node to master Spanish vocabulary
          </p>
        </div>

        <LessonPath units={stats.progress} hearts={stats.hearts.hearts} />
      </div>
    </div>
  );
}
