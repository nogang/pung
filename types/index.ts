export interface Post {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  expires_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  author_id: string;
  created_at: string;
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}
