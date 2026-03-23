'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateAuthorId } from '@/lib/utils';

interface CommentFormProps {
  postId: string;
  postAuthorId?: string;
  parentId?: string;
  onCommentCreated?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  existingReaction?: 'empathy' | 'disempathy' | null;
}

export default function CommentForm({
  postId,
  postAuthorId,
  parentId,
  onCommentCreated,
  onCancel,
  placeholder = '댓글을 작성하세요...',
  existingReaction,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [reactionType, setReactionType] = useState<'empathy' | 'disempathy'>(existingReaction || 'empathy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorId, setAuthorId] = useState('');

  useEffect(() => {
    setAuthorId(generateAuthorId());
  }, []);

  // Check if user is post author or has already voted
  const isPostAuthor = postAuthorId && authorId === postAuthorId;
  const hasVoted = existingReaction !== null && existingReaction !== undefined;
  const canVote = !isPostAuthor && !hasVoted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Use existing reaction if already voted, or empathy for post author
    const finalReaction = canVote ? reactionType : (existingReaction || 'empathy');

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      parent_id: parentId || null,
      content: content.trim(),
      author_id: authorId,
      created_at: new Date().toISOString(),
      reaction_type: finalReaction,
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
    <form onSubmit={handleSubmit} className="space-y-2">
      {canVote && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReactionType('empathy')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              reactionType === 'empathy'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
            }`}
          >
            공감
          </button>
          <button
            type="button"
            onClick={() => setReactionType('disempathy')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              reactionType === 'disempathy'
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
            }`}
          >
            비공감
          </button>
        </div>
      )}
      {hasVoted && !isPostAuthor && (
        <div className="text-xs text-zinc-500">
          이미 <span className={existingReaction === 'empathy' ? 'text-emerald-400' : 'text-rose-400'}>
            {existingReaction === 'empathy' ? '공감' : '비공감'}
          </span>으로 투표했습니다
        </div>
      )}
      {isPostAuthor && (
        <div className="text-xs text-zinc-500">
          작성자는 공감/비공감 투표에 참여할 수 없습니다
        </div>
      )}
      <div className="flex gap-2">
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
          className="px-3 py-2 bg-zinc-600 hover:bg-zinc-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
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
      </div>
    </form>
  );
}
