'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TOKENS } from '@/lib/tokens';
import { Trophy, BookOpen, Crown, ShieldAlert, Sparkles } from 'lucide-react';
import { Difficulty } from '@/server/crowns';

export interface LessonModalData {
  unitId: string;
  title: string;
  description: string;
  orderIndex: number;
  xpReward: number;
  exerciseCount: number;
  status: 'locked' | 'unlocked' | 'completed';
  crowns: number;
}

export function LessonModal({
  data,
  isOpen,
  onClose,
}: {
  data: LessonModalData | null;
  isOpen: boolean;
  onClose: () => void;
  hearts?: number;
}) {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{
    available: boolean;
    recommendedDifficulty?: 'normal' | 'medium' | 'hard';
    modelRecommendation?: string;
  } | null>(null);

  React.useEffect(() => {
    if (!isOpen || !data?.unitId) return;

    const currentUnitId = data.unitId;
    let isMounted = true;
    async function fetchRecommendation() {
      try {
        const res = await fetch('/api/difficulty/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unitId: currentUnitId }),
        });
        if (!res.ok) return;
        const result = await res.json();
        if (isMounted && result.available) {
          setRecommendation(result);
        }
      } catch {
        // Silently continue if ML service is unreachable
      }
    }

    fetchRecommendation();
    return () => {
      isMounted = false;
      setRecommendation(null);
    };
  }, [isOpen, data?.unitId]);

  if (!data) return null;

  const handleStart = async () => {
    setIsStarting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: data.unitId,
          difficulty: selectedDifficulty,
        }),
      });

      const session = await res.json();
      if (!res.ok) {
        throw new Error(session.error || 'Failed to start session');
      }

      onClose();
      router.push(`/lesson/${data.unitId}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error starting lesson');
      setIsStarting(false);
    }
  };

  const isMediumUnlocked = data.crowns >= 1;
  const isHardUnlocked = data.crowns >= 2;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data.title} asSheetOnMobile={true}>
      <div className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {data.description}
        </p>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: TOKENS.colors.semantic.xp }}
            >
              <Trophy className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold uppercase">Reward</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">
                +{data.status === 'completed' ? 10 : data.xpReward} XP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: TOKENS.colors.semantic.lessons }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold uppercase">Exercises</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">
                {data.exerciseCount} Steps
              </p>
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2.5">
          {recommendation?.available && recommendation.modelRecommendation && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300">
              <span className="text-base select-none">🤖</span>
              <div className="flex-1 text-xs leading-tight">
                <span className="font-extrabold">
                  Suggested difficulty: {recommendation.modelRecommendation}
                </span>{' '}
                <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 block sm:inline mt-0.5 sm:mt-0">
                  (demo, ML model trained on synthetic data)
                </span>
              </div>
            </div>
          )}

          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Select Difficulty & Crowns
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Normal */}
            <button
              type="button"
              onClick={() => setSelectedDifficulty('normal')}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${
                selectedDifficulty === 'normal'
                  ? 'border-[#58CC02] bg-[#58CC02]/10 font-black text-[#58CC02]'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={{ minHeight: TOKENS.spacing.minTouchTarget }}
            >
              <Crown className="w-4 h-4 mx-auto mb-1 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold block">Normal</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Crown 1</span>
            </button>

            {/* Medium */}
            <button
              type="button"
              disabled={!isMediumUnlocked}
              onClick={() => isMediumUnlocked && setSelectedDifficulty('medium')}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${
                !isMediumUnlocked
                  ? 'opacity-40 border-dashed border-gray-300 cursor-not-allowed text-gray-400'
                  : selectedDifficulty === 'medium'
                  ? 'border-[#58CC02] bg-[#58CC02]/10 font-black text-[#58CC02]'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={{ minHeight: TOKENS.spacing.minTouchTarget }}
            >
              <Crown className="w-4 h-4 mx-auto mb-1 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold block">Medium</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {isMediumUnlocked ? 'Crown 2' : 'Locked'}
              </span>
            </button>

            {/* Hard */}
            <button
              type="button"
              disabled={!isHardUnlocked}
              onClick={() => isHardUnlocked && setSelectedDifficulty('hard')}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${
                !isHardUnlocked
                  ? 'opacity-40 border-dashed border-gray-300 cursor-not-allowed text-gray-400'
                  : selectedDifficulty === 'hard'
                  ? 'border-[#58CC02] bg-[#58CC02]/10 font-black text-[#58CC02]'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={{ minHeight: TOKENS.spacing.minTouchTarget }}
            >
              <Crown className="w-4 h-4 mx-auto mb-1 text-red-500 fill-red-500" />
              <span className="text-xs font-bold block">Hard</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {isHardUnlocked ? 'Crown 3' : 'Locked'}
              </span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          onClick={handleStart}
          disabled={isStarting}
          className="w-full"
          size="lg"
        >
          {isStarting ? (
            'Preparing Lesson...'
          ) : data.status === 'completed' ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Replay Lesson
            </span>
          ) : (
            'Start Lesson'
          )}
        </Button>
      </div>
    </Modal>
  );
}
