'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/Button';
import { TOKENS } from '@/lib/tokens';
import { Zap, Flame, Award, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { soundManager } from '@/lib/sounds';

export interface CompletionScreenProps {
  xpAwarded: number;
  currentStreak: number;
  isPerfect: boolean;
  leveledUp: boolean;
  newLevel: number;
  soundEnabled?: boolean;
  onContinue: () => void;
}

export function CompletionScreen({
  xpAwarded,
  currentStreak,
  isPerfect,
  leveledUp,
  newLevel,
  soundEnabled = true,
  onContinue,
}: CompletionScreenProps) {
  useEffect(() => {
    // Sound effect
    if (leveledUp) {
      soundManager.playLevelUp(soundEnabled);
    } else {
      soundManager.playComplete(soundEnabled);
    }

    // Confetti respecting prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mediaQuery.matches) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#58CC02', '#FFC800', '#1CB0F6', '#FF9600'],
      });
    }
  }, [leveledUp, soundEnabled]);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
      <div className="max-w-md w-full space-y-6">
        {/* Crown / Checkmark Icon */}
        <div className="w-24 h-24 rounded-full bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="w-14 h-14" />
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Lesson Complete!
          </h1>
          <p className="text-sm text-gray-500 mt-1">Outstanding effort today!</p>
        </div>

        {/* Level Up Banner if applicable */}
        {leveledUp && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400 text-amber-600 dark:text-amber-400 font-black text-base flex items-center justify-center gap-2 animate-bounce-subtle">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Leveled Up! You are now Level {newLevel}!</span>
          </div>
        )}

        {/* Perfect Lesson Badge if 0 mistakes */}
        {isPerfect && (
          <div className="p-3.5 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02] text-[#58CC02] font-black text-sm flex items-center justify-center gap-2">
            <Star className="w-5 h-5 fill-[#58CC02]" />
            <span>Perfect Lesson! Zero mistakes made!</span>
          </div>
        )}

        {/* Reward Stat Cards */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* XP Card */}
          <div className="p-4 rounded-2xl border-2 border-yellow-200 dark:border-yellow-900/40 bg-yellow-50/50 dark:bg-yellow-950/20 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-yellow-600 uppercase mb-1">
              <Zap className="w-4 h-4 fill-yellow-500" />
              <span>XP Earned</span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              +{xpAwarded}
            </p>
          </div>

          {/* Streak Card */}
          <div className="p-4 rounded-2xl border-2 border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-600 uppercase mb-1">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>Streak</span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {currentStreak} <span className="text-sm font-semibold text-gray-400">days</span>
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="pt-6">
          <Button
            onClick={onContinue}
            variant="primary"
            size="lg"
            className="w-full text-lg flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
