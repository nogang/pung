'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import PostForm from '@/components/PostForm';
import PostCard from '@/components/PostCard';
import {
  generateAuthorId,
  getLastVisitTime,
  updateLastVisitTime,
  isNewSinceLastVisit,
} from '@/lib/utils';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authorId, setAuthorId] = useState('');
  const [lastVisit, setLastVisit] = useState(0);

  useEffect(() => {
    setAuthorId(generateAuthorId());
    const lastVisitTime = getLastVisitTime();
    setLastVisit(lastVisitTime);

    // Update last visit time after a short delay so new posts can be marked
    const timer = setTimeout(() => {
      updateLastVisitTime();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const fetchPosts = useCallback(async () => {
    // Fetch posts
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }

    // Create a map of post_id -> post_author_id
    const postAuthorMap = new Map<string, string>();
    (postsData as Post[]).forEach((post) => {
      postAuthorMap.set(post.id, post.author_id);
    });

    // Fetch comments with reaction types and author
    const { data: comments, error: countError } = await supabase
      .from('comments')
      .select('post_id, reaction_type, author_id, created_at')
      .order('created_at', { ascending: true });

    if (countError) {
      console.error('Error fetching comments:', countError);
    }

    // Count comments per post (all comments)
    const countMap = new Map<string, number>();
    // Track unique voters per post (excluding post author, first vote only)
    const voterMap = new Map<string, Map<string, 'empathy' | 'disempathy'>>();

    comments?.forEach((c) => {
      // Count all comments
      countMap.set(c.post_id, (countMap.get(c.post_id) || 0) + 1);

      // Skip if commenter is the post author
      const postAuthor = postAuthorMap.get(c.post_id);
      if (c.author_id === postAuthor) return;

      // Only count first vote per user per post
      if (!voterMap.has(c.post_id)) {
        voterMap.set(c.post_id, new Map());
      }
      const postVoters = voterMap.get(c.post_id)!;
      if (!postVoters.has(c.author_id)) {
        postVoters.set(c.author_id, c.reaction_type);
      }
    });

    // Calculate empathy/disempathy counts from unique voters
    const empathyMap = new Map<string, number>();
    const disempathyMap = new Map<string, number>();

    voterMap.forEach((voters, postId) => {
      let empathy = 0;
      let disempathy = 0;
      voters.forEach((reaction) => {
        if (reaction === 'empathy') empathy++;
        else disempathy++;
      });
      empathyMap.set(postId, empathy);
      disempathyMap.set(postId, disempathy);
    });

    // Merge counts into posts
    const postsWithCounts = (postsData as Post[]).map((post) => ({
      ...post,
      comment_count: countMap.get(post.id) || 0,
      empathy_count: empathyMap.get(post.id) || 0,
      disempathy_count: disempathyMap.get(post.id) || 0,
    }));

    setPosts(postsWithCounts);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    const postsChannel = supabase
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

    const commentsChannel = supabase
      .channel('comments-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
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
              <PostCard
                post={post}
                onExpire={() => handlePostExpire(post.id)}
                isMine={post.author_id === authorId}
                isNew={post.author_id !== authorId && lastVisit > 0 && isNewSinceLastVisit(post.created_at, lastVisit)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
