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

  return (
    <Link href={`/post/${post.id}`}>
      <article className={`bg-zinc-800/50 hover:bg-zinc-800/70 rounded-xl p-4 border transition-all cursor-pointer group ${isMine ? 'border-emerald-600/50' : 'border-zinc-700'}`}>
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
        </div>
        <p className="text-white whitespace-pre-wrap break-words mb-3">{post.content}</p>
        <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
          <div className="flex items-center gap-3">
            <span>{formatRelativeTime(post.created_at)}</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.comment_count ?? 0}
            </span>
          </div>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">댓글 보기 →</span>
        </div>
        <Timer createdAt={post.created_at} expiresAt={post.expires_at} onExpire={handleExpire} />
      </article>
    </Link>
  );
}
