-- Pung Database Schema
-- 1시간 후 자동 삭제되는 익명 커뮤니티

-- Posts 테이블
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Comments 테이블
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Row Level Security 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 만료되지 않은 글 읽기 가능
CREATE POLICY "Anyone can read non-expired posts" ON posts
  FOR SELECT USING (expires_at > NOW());

-- 모든 사용자가 글 작성 가능
CREATE POLICY "Anyone can create posts" ON posts
  FOR INSERT WITH CHECK (true);

-- 글과 연결된 댓글 읽기 가능
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = comments.post_id AND posts.expires_at > NOW()
    )
  );

-- 모든 사용자가 댓글 작성 가능
CREATE POLICY "Anyone can create comments" ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = comments.post_id AND posts.expires_at > NOW()
    )
  );

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 만료된 글 삭제 함수
CREATE OR REPLACE FUNCTION delete_expired_posts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM posts WHERE expires_at < NOW();
END;
$$;

-- pg_cron으로 1분마다 만료된 글 삭제 (Supabase 대시보드에서 활성화 필요)
-- 아래 SQL은 pg_cron이 활성화된 후 실행
-- SELECT cron.schedule('delete-expired-posts', '* * * * *', 'SELECT delete_expired_posts()');
