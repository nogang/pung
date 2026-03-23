'use client';

import { useState, useEffect } from 'react';
import { formatTimeRemaining, getProgressPercentage } from '@/lib/utils';

interface TimerProps {
  createdAt: string;
  expiresAt: string;
  onExpire?: () => void;
}

export default function Timer({ createdAt, expiresAt, onExpire }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(expiresAt));
  const [progress, setProgress] = useState(getProgressPercentage(createdAt, expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress = getProgressPercentage(createdAt, expiresAt);
      setProgress(newProgress);
      setTimeRemaining(formatTimeRemaining(expiresAt));

      if (newProgress <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, expiresAt, onExpire]);

  const getProgressColor = () => {
    if (progress > 50) return 'bg-emerald-500';
    if (progress > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-1000`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 whitespace-nowrap min-w-[60px] text-right">
        {timeRemaining}
      </span>
    </div>
  );
}
