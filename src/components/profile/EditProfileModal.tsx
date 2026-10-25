'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TOKENS } from '@/lib/tokens';
import { Camera, Trash2, AlertCircle } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentPhoto: string | null;
  currentGoal: number;
  onSuccess: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentName,
  currentPhoto,
  currentGoal,
  onSuccess,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentName);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhoto);
  const [dailyGoal, setDailyGoal] = useState<number>(currentGoal || 20);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo file size must be less than 2 MB.');
      return;
    }

    // Check mime type (JPG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid JPG, PNG, or WebP image.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError('Display name must be between 2 and 30 characters.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: trimmed,
          photoUrl,
          dailyGoal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" asSheetOnMobile={true}>
      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Photo Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-full border-4 border-[#58CC02] overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl font-black text-gray-500 shadow-inner">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase() || 'U'
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <span>Change Photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>

            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={30}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#58CC02] text-sm"
          />
        </div>

        {/* Daily Goal */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
            Daily XP Goal
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 30, 50].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setDailyGoal(goal)}
                className={`py-2.5 rounded-2xl border-2 text-center text-sm font-bold transition-colors ${
                  dailyGoal === goal
                    ? 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                style={{ minHeight: TOKENS.spacing.minTouchTarget }}
              >
                {goal} XP
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
