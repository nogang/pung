'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import Timer from '@/components/Timer';
import CommentList from '@/components/CommentList';
import { formatRelativeTime } from '@/lib/utils';

interface PostDetailPageProps {
  params: {
    id: string;
  };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchPost = useCallback(async () => {
    const { data, error } = await supabase.from('posts').select('*').eq('id', params.id).single();

    if (error || !data) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (expiresAt <= now) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setPost(data as Post);
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchPost();

    const channel = supabase
      .channel(`post:${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${params.id}`,
        },
        () => {
          setNotFound(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, fetchPost]);

  const handleExpire = () => {
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="text-center text-zinc-500 py-8">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 mb-4">이 글은 이미 사라졌거나 존재하지 않습니다.</p>
        <Link href="/" className="text-emerald-500 hover:text-emerald-400">
          ← 메인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm">
        ← 목록으로
      </Link>

      <article className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
        <p className="text-white whitespace-pre-wrap break-words text-lg mb-4">{post.content}</p>
        <div className="text-sm text-zinc-500 mb-3">{formatRelativeTime(post.created_at)}</div>
        <Timer createdAt={post.created_at} expiresAt={post.expires_at} onExpire={handleExpire} />
      </article>

      <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50">
        <h2 className="text-lg font-medium text-white mb-4">댓글</h2>
        <CommentList postId={post.id} postAuthorId={post.author_id} />
      </div>
    </div>
  );
}
