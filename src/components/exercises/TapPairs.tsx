'use client';

import React, { useState } from 'react';
import { TOKENS } from '@/lib/tokens';
import { Check } from 'lucide-react';

export interface PairCard {
  id: string;
  text: string;
  pairId: string;
}

export interface TapPairsProps {
  exerciseId: string;
  instruction: string;
  leftCards: PairCard[];
  rightCards: PairCard[];
  matchedPairIds: string[];
  onMatchPair: (pairId: string) => void;
  onWrongMatch: () => void;
  isSubmitted: boolean;
}

export function TapPairs({
  instruction,
  leftCards,
  rightCards,
  matchedPairIds,
  onMatchPair,
  onWrongMatch,
  isSubmitted,
}: TapPairsProps) {
  const [selectedLeft, setSelectedLeft] = useState<PairCard | null>(null);
  const [selectedRight, setSelectedRight] = useState<PairCard | null>(null);
  const [mismatchError, setMismatchError] = useState(false);

  const handleSelectLeft = (card: PairCard) => {
    if (isSubmitted || matchedPairIds.includes(card.pairId)) return;
    setMismatchError(false);

    if (selectedRight) {
      // Check match
      if (selectedRight.pairId === card.pairId) {
        onMatchPair(card.pairId);
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        setMismatchError(true);
        onWrongMatch();
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          setMismatchError(false);
        }, 600);
      }
    } else {
      setSelectedLeft(card);
    }
  };

  const handleSelectRight = (card: PairCard) => {
    if (isSubmitted || matchedPairIds.includes(card.pairId)) return;
    setMismatchError(false);

    if (selectedLeft) {
      // Check match
      if (selectedLeft.pairId === card.pairId) {
        onMatchPair(card.pairId);
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        setMismatchError(true);
        onWrongMatch();
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          setMismatchError(false);
        }, 600);
      }
    } else {
      setSelectedRight(card);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {instruction}
        </h2>
        <span className="text-xs font-bold text-gray-400">
          {matchedPairIds.length} / {leftCards.length} matched
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Left Column (Spanish) */}
        <div className="space-y-2.5">
          {leftCards.map((card) => {
            const isMatched = matchedPairIds.includes(card.pairId);
            const isSelected = selectedLeft?.id === card.id;

            return (
              <button
                key={card.id}
                type="button"
                disabled={isMatched || isSubmitted}
                onClick={() => handleSelectLeft(card)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left font-black text-sm sm:text-base transition-all flex items-center justify-between ${
                  isMatched
                    ? 'border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-850 text-gray-400 cursor-default opacity-50'
                    : isSelected
                    ? mismatchError
                      ? 'border-[#FF4B4B] bg-[#FF4B4B]/15 text-[#FF4B4B] animate-shake'
                      : 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02] shadow-md ring-2 ring-[#58CC02]/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white hover:border-gray-300 active:translate-y-[1px]'
                }`}
                style={{
                  minHeight: TOKENS.spacing.minTouchTarget,
                  boxShadow: isMatched ? 'none' : '0 3px 0 #E5E5E5',
                }}
              >
                <span className="truncate">{card.text}</span>
                {isMatched && <Check className="w-4 h-4 text-[#58CC02] flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Right Column (English) */}
        <div className="space-y-2.5">
          {rightCards.map((card) => {
            const isMatched = matchedPairIds.includes(card.pairId);
            const isSelected = selectedRight?.id === card.id;

            return (
              <button
                key={card.id}
                type="button"
                disabled={isMatched || isSubmitted}
                onClick={() => handleSelectRight(card)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left font-black text-sm sm:text-base transition-all flex items-center justify-between ${
                  isMatched
                    ? 'border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-850 text-gray-400 cursor-default opacity-50'
                    : isSelected
                    ? mismatchError
                      ? 'border-[#FF4B4B] bg-[#FF4B4B]/15 text-[#FF4B4B] animate-shake'
                      : 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02] shadow-md ring-2 ring-[#58CC02]/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white hover:border-gray-300 active:translate-y-[1px]'
                }`}
                style={{
                  minHeight: TOKENS.spacing.minTouchTarget,
                  boxShadow: isMatched ? 'none' : '0 3px 0 #E5E5E5',
                }}
              >
                <span className="truncate">{card.text}</span>
                {isMatched && <Check className="w-4 h-4 text-[#58CC02] flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
