'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, AlertCircle } from 'lucide-react';
import { speakSpanish } from '@/lib/tts';
import { TOKENS } from '@/lib/tokens';

export interface ListenTypeProps {
  exerciseId: string;
  prompt: string;
  instruction: string;
  typedValue: string;
  onChangeValue: (val: string) => void;
  isSubmitted: boolean;
  isCorrect?: boolean;
}

export function ListenType({
  prompt,
  instruction,
  typedValue,
  onChangeValue,
  isSubmitted,
  isCorrect,
}: ListenTypeProps) {
  const [ttsFallback, setTtsFallback] = useState<string | null>(null);

  const handlePlayAudio = () => {
    const res = speakSpanish(prompt);
    if (!res.success && res.fallbackMessage) {
      setTtsFallback(res.fallbackMessage);
    } else {
      setTtsFallback(null);
    }
  };

  // Play audio once upon loading the exercise
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePlayAudio();
    }, 200);
    return () => clearTimeout(timer);
  }, [prompt]);

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
        {instruction}
      </h2>

      {/* Speaker button prompt area */}
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white dark:bg-[#1f1f1f] border-2 border-gray-200 dark:border-gray-800 shadow-sm gap-3">
        <button
          type="button"
          onClick={handlePlayAudio}
          aria-label="Play Spanish audio"
          className="w-20 h-20 rounded-3xl flex items-center justify-center bg-[#1CB0F6] text-white shadow-lg hover:brightness-105 active:scale-95 transition-all"
        >
          <Volume2 className="w-10 h-10" />
        </button>
        <span className="text-xs font-bold text-gray-400">Tap to hear again</span>

        {ttsFallback && (
          <div className="mt-2 p-2 bg-amber-50 text-amber-700 rounded-xl text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{ttsFallback}</span>
          </div>
        )}
      </div>

      {/* Typing field in Spanish */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Type what you hear in Spanish
        </label>
        <input
          type="text"
          disabled={isSubmitted}
          value={typedValue}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder="Type in Spanish..."
          className={`w-full h-14 px-4 rounded-2xl border-2 text-lg font-bold transition-all focus:outline-none ${
            isSubmitted
              ? isCorrect
                ? 'border-[#58CC02] bg-[#58CC02]/10 text-gray-900'
                : 'border-[#FF4B4B] bg-[#FF4B4B]/10 text-gray-900'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#58CC02]'
          }`}
        />
      </div>
    </div>
  );
}
