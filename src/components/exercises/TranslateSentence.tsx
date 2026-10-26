'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';
import { speakSpanish } from '@/lib/tts';
import { TOKENS } from '@/lib/tokens';

export interface TranslateSentenceProps {
  exerciseId: string;
  prompt: string;
  instruction: string;
  typedValue: string;
  onChangeValue: (val: string) => void;
  isSubmitted: boolean;
  isCorrect?: boolean;
}

export function TranslateSentence({
  prompt,
  instruction,
  typedValue,
  onChangeValue,
  isSubmitted,
  isCorrect,
}: TranslateSentenceProps) {
  const handlePlayAudio = () => {
    speakSpanish(prompt);
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
        {instruction}
      </h2>

      {/* Sentence Bubble with Speaker Button */}
      <div className="flex items-start gap-4 p-5 rounded-3xl bg-white dark:bg-[#1f1f1f] border-2 border-gray-200 dark:border-gray-800 shadow-sm">
        <button
          type="button"
          onClick={handlePlayAudio}
          aria-label={`Listen to ${prompt}`}
          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#1CB0F6] text-white shadow-md hover:brightness-105 active:scale-95 transition-all flex-shrink-0"
        >
          <Volume2 className="w-6 h-6" />
        </button>
        <div className="pt-1.5">
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-snug">
            {prompt}
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Your English translation
        </label>
        <textarea
          disabled={isSubmitted}
          rows={3}
          value={typedValue}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder="Type the English translation here..."
          className={`w-full p-4 rounded-2xl border-2 text-base font-semibold transition-all focus:outline-none resize-none ${isSubmitted
              ? isCorrect
                ? 'border-[#58CC02] bg-[#58CC02]/10 text-gray-900'
                : 'border-[#FF4B4B] bg-[#FF4B4B]/10 text-gray-900'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#58CC02] focus:bg-white dark:focus:bg-gray-850'
            }`}
          style={{ minHeight: '100px' }}
        />
      </div>
    </div>
  );
}
