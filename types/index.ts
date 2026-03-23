export interface Post {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  expires_at: string;
  comment_count?: number;
  empathy_count?: number;
  disempathy_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  author_id: string;
  created_at: string;
  reaction_type: 'empathy' | 'disempathy';
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}
