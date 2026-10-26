'use client';

import React from 'react';
import { TOKENS } from '@/lib/tokens';
import { Volume2 } from 'lucide-react';
import { speakSpanish } from '@/lib/tts';

export interface MultipleChoiceProps {
  exerciseId: string;
  prompt: string;
  instruction: string;
  options: Array<{ id: string; text: string }>;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  isSubmitted: boolean;
  isCorrect?: boolean;
}

export function MultipleChoice({
  prompt,
  instruction,
  options,
  selectedOptionId,
  onSelectOption,
  isSubmitted,
  isCorrect,
}: MultipleChoiceProps) {
  const handlePlayAudio = () => {
    speakSpanish(prompt);
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      {/* Instruction */}
      <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
        {instruction}
      </h2>

      {/* Prompt Card with speaker button */}
      <div className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1f1f1f] border-2 border-gray-200 dark:border-gray-800 shadow-sm">
        <button
          type="button"
          onClick={handlePlayAudio}
          aria-label={`Listen to ${prompt}`}
          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#1CB0F6] text-white shadow-md hover:brightness-105 active:scale-95 transition-all flex-shrink-0"
        >
          <Volume2 className="w-6 h-6" />
        </button>
        <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          {prompt}
        </span>
      </div>

      {/* Options Grid: frozen order from server */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {options.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          let borderStyle = 'border-gray-200 dark:border-gray-700';
          let bgStyle = 'bg-white dark:bg-[#1a1a1a]';
          let textStyle = 'text-gray-900 dark:text-white';
          let shadowStyle = '0 3px 0 #E5E5E5';

          if (isSelected) {
            borderStyle = 'border-[#58CC02] ring-2 ring-[#58CC02]/30';
            bgStyle = 'bg-[#58CC02]/10';
            textStyle = 'text-[#58CC02] font-black';
            shadowStyle = '0 3px 0 #46A302';
          }

          if (isSubmitted && isSelected) {
            if (isCorrect) {
              borderStyle = 'border-[#58CC02]';
              bgStyle = 'bg-[#58CC02]/20';
            } else {
              borderStyle = 'border-[#FF4B4B]';
              bgStyle = 'bg-[#FF4B4B]/20';
              textStyle = 'text-[#FF4B4B] font-black';
              shadowStyle = '0 3px 0 #D43232';
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isSubmitted}
              onClick={() => onSelectOption(opt.id)}
              className={`p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all duration-150 ${borderStyle} ${bgStyle} ${textStyle} ${isSubmitted ? 'cursor-default' : 'hover:border-gray-300 dark:hover:border-gray-600 active:translate-y-[1px]'
                }`}
              style={{
                minHeight: TOKENS.spacing.minTouchTarget,
                boxShadow: shadowStyle,
              }}
            >
              <span className="w-7 h-7 rounded-xl border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                {idx + 1}
              </span>
              <span className="text-base font-extrabold flex-1">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
