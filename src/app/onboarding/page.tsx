'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TOKENS } from '@/lib/tokens';
import { Check, Globe, Sparkles } from 'lucide-react';

const LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', active: true },
  { code: 'fr', name: 'French', flag: '🇫🇷', active: false },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', active: false },
  { code: 'de', name: 'German', flag: '🇩🇪', active: false },
  { code: 'zh', name: 'Mandarin', flag: '🇨🇳', active: false },
];

const LEVELS = [
  { id: 'beginner', title: 'Beginner', subtitle: 'Start from the basics' },
  { id: 'intermediate', title: 'Intermediate', subtitle: 'Build conversation and vocabulary' },
  { id: 'advanced', title: 'Advanced', subtitle: 'Refine and master nuances' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSelectLanguage = (code: string, active: boolean) => {
    setSelectedLanguage(code);
    if (!active) {
      setNotice('French, Japanese, German, and Mandarin are coming soon! We will start you with Spanish for now.');
    } else {
      setNotice(null);
    }
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
        }),
      });
      router.push('/home');
      router.refresh();
    } catch (e) {
      console.error(e);
      router.push('/home');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#1a1a1a] rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 sm:p-10 shadow-xl">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white mb-3 shadow-md"
            style={{ backgroundColor: TOKENS.colors.brand.green }}
          >
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Welcome to LinguaQuest!
          </h1>
          <p className="text-sm text-gray-500 mt-1">What would you like to learn today?</p>
        </div>

        {/* Step 1: Select Language */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Choose a language
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code, lang.active)}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-2.5 transition-all text-left relative ${
                    isSelected
                      ? 'border-[#58CC02] bg-[#58CC02]/10 ring-2 ring-[#58CC02]/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={{ minHeight: TOKENS.spacing.minTouchTarget }}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{lang.name}</p>
                    {!lang.active && (
                      <span className="text-[10px] text-amber-500 font-semibold block">Coming soon</span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#58CC02] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {notice && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-medium">
              {notice}
            </div>
          )}
        </div>

        {/* Step 2: Select Level */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Your current level
          </label>
          <div className="space-y-2.5">
            {LEVELS.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all text-left ${
                    isSelected
                      ? 'border-[#58CC02] bg-[#58CC02]/10 ring-2 ring-[#58CC02]/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={{ minHeight: TOKENS.spacing.minTouchTarget }}
                >
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">{lvl.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{lvl.subtitle}</p>
                  </div>
                  {isSelected && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: TOKENS.colors.brand.green }}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Setting Up...' : 'Start Learning'}
        </Button>
      </div>
    </div>
  );
}
