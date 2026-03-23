'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateAuthorId } from '@/lib/utils';

interface PostFormProps {
  onPostCreated?: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorId, setAuthorId] = useState('');

  useEffect(() => {
    setAuthorId(generateAuthorId());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후

    const { error } = await supabase.from('posts').insert({
      content: content.trim(),
      author_id: authorId,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    setIsSubmitting(false);

    if (error) {
      console.error('Error creating post:', error);
      alert('글 작성에 실패했습니다.');
      return;
    }

    setContent('');
    onPostCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="지금 무슨 생각을 하고 있나요? 1시간 후에 사라집니다..."
        className="w-full bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none min-h-[100px]"
        maxLength={500}
      />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-700">
        <span className="text-sm text-zinc-500">{content.length}/500</span>
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? '작성 중...' : '털어놓기'}
        </button>
      </div>
    </form>
  );
}
