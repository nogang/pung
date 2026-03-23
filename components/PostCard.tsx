'use client';

import Link from 'next/link';
import { Post } from '@/types';
import Timer from './Timer';
import { formatRelativeTime } from '@/lib/utils';
import { useState } from 'react';

interface PostCardProps {
  post: Post;
  onExpire?: () => void;
}

export default function PostCard({ post, onExpire }: PostCardProps) {
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
      <article className="bg-zinc-800/50 hover:bg-zinc-800/70 rounded-xl p-4 border border-zinc-700 transition-all cursor-pointer group">
        <p className="text-white whitespace-pre-wrap break-words mb-3">{post.content}</p>
        <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
          <span>{formatRelativeTime(post.created_at)}</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">댓글 보기 →</span>
        </div>
        <Timer createdAt={post.created_at} expiresAt={post.expires_at} onExpire={handleExpire} />
      </article>
    </Link>
  );
}
