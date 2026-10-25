'use client';

import React from 'react';
import { useUserStats } from '@/hooks/useUserStats';
import { LessonPath } from '@/components/dashboard/LessonPath';
import { Sparkles, Trophy, BookOpen } from 'lucide-react';

export default function LessonsPage() {
  const { stats, isLoading, error } = useUserStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return <div className="p-8 text-center text-red-500">Failed to load lessons.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 select-none">
      <div className="text-center pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#58CC02]/10 text-[#58CC02] mb-2 uppercase">
          <BookOpen className="w-3.5 h-3.5" /> Spanish Course
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Lesson Path
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete each unit to unlock the next. Earn crowns and level up!
        </p>
      </div>

      <LessonPath units={stats.progress} hearts={stats.hearts.hearts} />
    </div>
  );
}
