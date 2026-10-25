'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { TOKENS } from '@/lib/tokens';
import { Heart, Play, RefreshCw, X, Sparkles } from 'lucide-react';

export function OutOfHearts({
  nextHeartInSeconds,
  onAdFinished,
  onRetry,
}: {
  nextHeartInSeconds: number | null;
  onAdFinished: () => Promise<void>;
  onRetry: () => void;
}) {
  const router = useRouter();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [countdown, setCountdown] = useState(nextHeartInSeconds || 1800);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    setAdCountdown(5);

    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAdFinished().then(() => {
            setIsWatchingAd(false);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center select-none">
      {isWatchingAd ? (
        <div className="max-w-md w-full bg-gray-900 text-white rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto animate-pulse">
            <Play className="w-8 h-8 text-[#58CC02] fill-[#58CC02]" />
          </div>
          <div>
            <h3 className="text-xl font-black">Sponsor Video</h3>
            <p className="text-xs text-gray-400 mt-1">Refilling full hearts in...</p>
          </div>
          <div className="text-4xl font-black text-[#58CC02]">{adCountdown}s</div>
        </div>
      ) : (
        <div className="max-w-md w-full space-y-8">
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center animate-pulse">
              <Heart className="w-12 h-12 text-[#FF4B4B] fill-[#FF4B4B]" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
              <X className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              You ran out of hearts!
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Next heart refills in{' '}
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {minutes}m {seconds < 10 ? `0${seconds}` : seconds}s
              </span>
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleWatchAd}
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Watch Ad to Refill All Hearts</span>
            </Button>

            <Button
              onClick={onRetry}
              variant="secondary"
              size="md"
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Session</span>
            </Button>

            <Button
              onClick={() => router.push('/home')}
              variant="ghost"
              size="md"
              className="w-full text-gray-500"
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
