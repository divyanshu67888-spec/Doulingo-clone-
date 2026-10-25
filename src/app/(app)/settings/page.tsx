'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStats } from '@/hooks/useUserStats';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TOKENS } from '@/lib/tokens';
import { Volume2, Bell, Mail, Target, Globe, LogOut, Check, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { stats, invalidateStats } = useUserStats();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [language, setLanguage] = useState('es');

  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (stats?.settings) {
      setSoundEnabled(stats.settings.soundEnabled);
      setRemindersEnabled(stats.settings.remindersEnabled);
      setEmailRemindersEnabled(stats.settings.emailRemindersEnabled);
    }
    if (stats?.dailyGoal) {
      setDailyGoal(stats.dailyGoal);
    }
    if (stats?.language) {
      setLanguage(stats.language);
    }
  }, [stats]);

  const updateSetting = async (updates: Record<string, unknown>, rollback: () => void) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update setting');
      }

      setStatusMessage({ text: 'Setting saved successfully', isError: false });
      setTimeout(() => setStatusMessage(null), 2500);
      invalidateStats();
    } catch {
      rollback();
      setStatusMessage({ text: 'Error saving setting. Rolled back.', isError: true });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSoundToggle = (val: boolean) => {
    const prev = soundEnabled;
    setSoundEnabled(val);
    updateSetting({ soundEnabled: val }, () => setSoundEnabled(prev));
  };

  const handleRemindersToggle = (val: boolean) => {
    const prev = remindersEnabled;
    setRemindersEnabled(val);
    updateSetting({ remindersEnabled: val }, () => setRemindersEnabled(prev));
  };

  const handleEmailToggle = (val: boolean) => {
    const prev = emailRemindersEnabled;
    setEmailRemindersEnabled(val);
    updateSetting({ emailRemindersEnabled: val }, () => setEmailRemindersEnabled(prev));
  };

  const handleGoalChange = (newGoal: number) => {
    const prev = dailyGoal;
    setDailyGoal(newGoal);
    updateSetting({ dailyGoal: newGoal }, () => setDailyGoal(prev));
  };

  const handleLanguageChange = (newLang: string) => {
    const prev = language;
    setLanguage(newLang);
    updateSetting({ language: newLang }, () => setLanguage(prev));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 select-none">
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Preferences and account settings</p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            statusMessage.isError
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {statusMessage.isError ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Check className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Preferences Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm space-y-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          App Preferences
        </h2>

        <Switch
          label="Sound Effects"
          description="Synthesized audio for correct, wrong, and level-up milestones"
          checked={soundEnabled}
          onChange={handleSoundToggle}
        />

        <hr className="border-gray-100 dark:border-gray-800/80 my-2" />

        <Switch
          label="In-App & Browser Reminders"
          description="Daily practice nudge at 6 PM local time"
          checked={remindersEnabled}
          onChange={handleRemindersToggle}
        />

        <hr className="border-gray-100 dark:border-gray-800/80 my-2" />

        <Switch
          label="Daily Reminder Emails"
          description="Receive an email if daily goal is incomplete by 6 PM"
          checked={emailRemindersEnabled}
          onChange={handleEmailToggle}
        />
      </div>

      {/* Learning Goals */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#58CC02]" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">Daily XP Goal</h2>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 30, 50].map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => handleGoalChange(goal)}
              className={`py-3 rounded-2xl border-2 text-center text-sm font-bold transition-all ${
                dailyGoal === goal
                  ? 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
              }`}
              style={{ minHeight: TOKENS.spacing.minTouchTarget }}
            >
              {goal} XP
            </button>
          ))}
        </div>
      </div>

      {/* Target Language */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#1CB0F6]" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">Language</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { code: 'es', name: 'Spanish', flag: '🇪🇸', enabled: true },
            { code: 'fr', name: 'French', flag: '🇫🇷', enabled: false },
            { code: 'ja', name: 'Japanese', flag: '🇯🇵', enabled: false },
            { code: 'de', name: 'German', flag: '🇩🇪', enabled: false },
            { code: 'zh', name: 'Mandarin', flag: '🇨🇳', enabled: false },
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              disabled={!lang.enabled}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-4 py-2.5 rounded-2xl border-2 flex items-center gap-2 text-sm font-bold transition-all ${
                language === lang.code
                  ? 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]'
                  : lang.enabled
                  ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  : 'opacity-40 border-dashed border-gray-300 cursor-not-allowed text-gray-400'
              }`}
              style={{ minHeight: TOKENS.spacing.minTouchTarget }}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {!lang.enabled && <span className="text-[10px] text-gray-400 font-normal">(soon)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out - Prominent, full-width on mobile */}
      <div className="pt-4">
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="danger"
          size="lg"
          className="w-full flex items-center justify-center gap-2 text-base font-extrabold"
        >
          <LogOut className="w-5 h-5" />
          <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
        </Button>
      </div>
    </div>
  );
}
