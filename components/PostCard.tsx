'use client';

import Link from 'next/link';
import { Post } from '@/types';
import Timer from './Timer';
import { formatRelativeTime } from '@/lib/utils';
import { useState } from 'react';

interface PostCardProps {
  post: Post;
  onExpire?: () => void;
  isNew?: boolean;
  isMine?: boolean;
}

function PieChart({ empathy, disempathy }: { empathy: number; disempathy: number }) {
  const total = empathy + disempathy;
  if (total === 0) return null;

  const empathyPercent = (empathy / total) * 100;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const empathyDash = (empathyPercent / 100) * circumference;
  const disempathyDash = circumference - empathyDash;

  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" viewBox="0 0 40 40" className="transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="8"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="8"
          strokeDasharray={`${empathyDash} ${disempathyDash}`}
        />
      </svg>
      <div className="flex flex-col text-xs">
        <span className="text-emerald-400">{empathy} 공감</span>
        <span className="text-rose-400">{disempathy} 비공감</span>
      </div>
    </div>
  );
}

function getPostMood(empathy: number, disempathy: number): 'empathy' | 'disempathy' | 'neutral' | 'none' {
  const total = empathy + disempathy;
  if (total === 0) return 'none';

  const empathyRatio = empathy / total;

  if (empathyRatio >= 0.65) return 'empathy';
  if (empathyRatio <= 0.35) return 'disempathy';
  return 'neutral';
}

function getMoodStyles(mood: 'empathy' | 'disempathy' | 'neutral' | 'none', isMine: boolean) {
  if (isMine) {
    return 'border-emerald-600/50 bg-emerald-900/10';
  }

  switch (mood) {
    case 'empathy':
      return 'border-emerald-500/30 bg-emerald-900/10';
    case 'disempathy':
      return 'border-rose-500/30 bg-rose-900/10';
    case 'neutral':
      return 'border-amber-500/30 bg-amber-900/10';
    default:
      return 'border-zinc-700 bg-zinc-800/50';
  }
}

export default function PostCard({ post, onExpire, isNew, isMine }: PostCardProps) {
  const [isExpired, setIsExpired] = useState(false);

  const handleExpire = () => {
    setIsExpired(true);
    onExpire?.();
  };

  if (isExpired) {
    return (
      <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 animate-fade-out">
        <p className="text-zinc-500 text-center italic">이 글은 사라졌습니다...</p>
      </div>
    );
  }

  const empathy = post.empathy_count ?? 0;
  const disempathy = post.disempathy_count ?? 0;
  const total = empathy + disempathy;
  const mood = getPostMood(empathy, disempathy);
  const moodStyles = getMoodStyles(mood, isMine ?? false);

  return (
    <Link href={`/post/${post.id}`}>
      <article className={`rounded-xl p-4 border transition-all cursor-pointer group hover:brightness-110 ${moodStyles}`}>
        <div className="flex items-center gap-2 mb-2">
          {isMine && (
            <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full">
              내 글
            </span>
          )}
          {isNew && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse">
              NEW
            </span>
          )}
          {!isNew && (post.new_comment_count ?? 0) > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full animate-pulse">
              +{post.new_comment_count} 새 댓글
            </span>
          )}
          {mood === 'empathy' && total > 0 && (
            <span className="text-xs text-emerald-400">공감이 많아요</span>
          )}
          {mood === 'disempathy' && total > 0 && (
            <span className="text-xs text-rose-400">비공감이 많아요</span>
          )}
          {mood === 'neutral' && total > 0 && (
            <span className="text-xs text-amber-400">의견이 나뉘어요</span>
          )}
        </div>
        <p className="text-white whitespace-pre-wrap break-words mb-3">{post.content}</p>

        <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
          <div className="flex items-center gap-4">
            <span>{formatRelativeTime(post.created_at)}</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.comment_count ?? 0}
            </span>
            {total > 0 && <PieChart empathy={empathy} disempathy={disempathy} />}
          </div>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">댓글 보기 →</span>
        </div>

        <Timer createdAt={post.created_at} expiresAt={post.expires_at} onExpire={handleExpire} />
      </article>
    </Link>
  );
}
