'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { TOKENS } from '@/lib/tokens';
import { Check, Lock, Crown, Play, BookOpen } from 'lucide-react';
import { LessonModal, LessonModalData } from './LessonModal';

interface LessonUnit {
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
}

export function LessonPath({
  units,
  hearts,
}: {
  units: LessonUnit[];
  hearts: number;
}) {
  const [selectedUnit, setSelectedUnit] = useState<LessonModalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find the current active node: the first unlocked node that is not yet completed
  const currentActiveUnit = units.find((u) => u.status === 'unlocked') || units[0];

  const handleUnitClick = (unit: LessonUnit) => {
    if (unit.status === 'locked') return;

    setSelectedUnit({
      unitId: unit.unitId,
      title: unit.title,
      description: unit.description,
      orderIndex: unit.orderIndex,
      xpReward: unit.xpReward,
      exerciseCount: unit.exerciseCount,
      status: unit.status,
      crowns: unit.crowns,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-xl mx-auto py-4 select-none">
      <div className="space-y-4">
        {units.map((unit, index) => {
          const isCurrent = currentActiveUnit && currentActiveUnit.unitId === unit.unitId;
          const isCompleted = unit.status === 'completed';
          const isLocked = unit.status === 'locked';

          // Slightly stagger position visually for playful learning path vibe
          const offsetStyles =
            index % 3 === 1
              ? 'translate-x-2 sm:translate-x-4'
              : index % 3 === 2
              ? '-translate-x-2 sm:-translate-x-4'
              : '';

          return (
            <div
              key={unit.unitId}
              className={`transition-transform duration-200 ${offsetStyles}`}
            >
              <button
                type="button"
                disabled={isLocked}
                onClick={() => handleUnitClick(unit)}
                aria-label={`${unit.title}, ${unit.status}, ${unit.crowns} of 3 crowns`}
                className={`w-full text-left p-4 sm:p-5 rounded-3xl border-2 transition-all duration-200 flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'border-[#58CC02] bg-white dark:bg-[#1f1f1f] shadow-lg shadow-[#58CC02]/20 ring-4 ring-[#58CC02]/30 active:scale-[0.98]'
                    : isCompleted
                    ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-gray-700 active:scale-[0.98]'
                    : 'border-gray-200 dark:border-gray-800/60 bg-gray-100/60 dark:bg-gray-900/40 opacity-70 cursor-not-allowed'
                }`}
                style={{
                  minHeight: TOKENS.spacing.minTouchTarget,
                  boxShadow: isCurrent ? TOKENS.shadows.glowGreen : undefined,
                }}
              >
                {/* Node Icon Circle */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-white transition-all shadow-md ${
                      isCurrent
                        ? 'bg-[#58CC02] animate-bounce-subtle'
                        : isCompleted
                        ? 'bg-[#FFD700] text-gray-900'
                        : 'bg-gray-300 dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-8 h-8 stroke-[3.5] text-amber-950" />
                    ) : isLocked ? (
                      <Lock className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Play className="w-7 h-7 fill-white translate-x-0.5" />
                    )}
                  </div>

                  {/* Level / Step index pill */}
                  <span className="absolute -bottom-1 -right-1 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-full px-1.5 py-0.5 text-[10px] font-black text-gray-700 dark:text-gray-300 shadow-sm">
                    #{unit.orderIndex + 1}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate">
                      {unit.title}
                    </h2>
                    {isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30 uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {unit.description}
                  </p>

                  {/* Crowns (0-3) */}
                  <div className="flex items-center gap-1 mt-2" aria-label={`${unit.crowns} of 3 crowns`}>
                    {[1, 2, 3].map((crownNum) => (
                      <Crown
                        key={crownNum}
                        className={`w-4 h-4 transition-colors ${
                          unit.crowns >= crownNum
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 dark:text-gray-700'
                        }`}
                      />
                    ))}
                    <span className="sr-only">{unit.crowns} of 3 crowns</span>
                    <span className="text-[11px] font-bold text-gray-400 ml-1">
                      {unit.crowns}/3
                    </span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0 text-right">
                  {isCompleted ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/60">
                      Done
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#58CC02] text-white shadow-sm">
                      Start
                    </span>
                  ) : isLocked ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-gray-400">
                      Locked
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                      Open
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <LessonModal
        data={selectedUnit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hearts={hearts}
      />
    </div>
  );
}
