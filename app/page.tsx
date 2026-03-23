'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import PostForm from '@/components/PostForm';
import PostCard from '@/components/PostCard';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    setPosts(data as Post[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const handlePostExpire = (postId: string) => {
    setTimeout(() => {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }, 500);
  };

  return (
    <div className="space-y-6">
      <PostForm onPostCreated={fetchPosts} />

      {isLoading ? (
        <div className="text-center text-zinc-500 py-8">로딩 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">
          <p>아직 게시글이 없습니다.</p>
          <p className="text-sm mt-2">첫 번째 이야기를 털어놓아 보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="animate-fade-in">
              <PostCard post={post} onExpire={() => handlePostExpire(post.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
