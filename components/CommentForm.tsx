'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateAuthorId } from '@/lib/utils';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentCreated?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  postId,
  parentId,
  onCommentCreated,
  onCancel,
  placeholder = '댓글을 작성하세요...',
}: CommentFormProps) {
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

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      parent_id: parentId || null,
      content: content.trim(),
      author_id: authorId,
      created_at: new Date().toISOString(),
    });

    setIsSubmitting(false);

    if (error) {
      console.error('Error creating comment:', error);
      alert('댓글 작성에 실패했습니다.');
      return;
    }

    setContent('');
    onCommentCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-zinc-700/50 text-white placeholder-zinc-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        maxLength={200}
      />
      <button
        type="submit"
        disabled={!content.trim() || isSubmitting}
        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
      >
        {isSubmitting ? '...' : '작성'}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          취소
        </button>
      )}
    </form>
  );
}
