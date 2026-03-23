'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Comment, CommentWithReplies } from '@/types';
import CommentForm from './CommentForm';
import { formatRelativeTime, generateAuthorId } from '@/lib/utils';

interface CommentListProps {
  postId: string;
  postAuthorId: string;
}

function CommentItem({
  comment,
  postId,
  postAuthorId,
  currentUserId,
  onReplyCreated,
  depth = 0,
}: {
  comment: CommentWithReplies;
  postId: string;
  postAuthorId: string;
  currentUserId: string;
  onReplyCreated: () => void;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const isAuthor = comment.author_id === postAuthorId;
  const isCurrentUser = comment.author_id === currentUserId;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-zinc-700 pl-4' : ''}`}>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium ${isAuthor ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {isAuthor ? '작성자' : '익명'}
            {isCurrentUser && !isAuthor && ' (나)'}
          </span>
          <span className="text-xs text-zinc-600">{formatRelativeTime(comment.created_at)}</span>
        </div>
        <p className="text-white text-sm">{comment.content}</p>
        {depth < 2 && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-zinc-500 hover:text-zinc-300 mt-1"
          >
            답글
          </button>
        )}
        {showReplyForm && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              placeholder="답글을 작성하세요..."
              onCommentCreated={() => {
                setShowReplyForm(false);
                onReplyCreated();
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          postAuthorId={postAuthorId}
          currentUserId={currentUserId}
          onReplyCreated={onReplyCreated}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function CommentList({ postId, postAuthorId }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    setCurrentUserId(generateAuthorId());
  }, []);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    (data as Comment[]).forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    commentMap.forEach((comment) => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id)!.replies.push(comment);
      } else if (!comment.parent_id) {
        rootComments.push(comment);
      }
    });

    setComments(rootComments);
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  if (isLoading) {
    return <div className="text-zinc-500 text-center py-4">댓글 로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      <CommentForm postId={postId} onCommentCreated={fetchComments} />

      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-zinc-500 text-center py-4">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              postAuthorId={postAuthorId}
              currentUserId={currentUserId}
              onReplyCreated={fetchComments}
            />
          ))
        )}
      </div>
    </div>
  );
}
