export function generateAuthorId(): string {
  if (typeof window === 'undefined') return '';

  const stored = localStorage.getItem('pung_author_id');
  if (stored) return stored;

  const newId = `anon_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('pung_author_id', newId);
  return newId;
}

export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) return '만료됨';

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  }
  return `${seconds}초`;
}

export function getProgressPercentage(createdAt: string, expiresAt: string): number {
  const created = new Date(createdAt).getTime();
  const expiry = new Date(expiresAt).getTime();
  const now = new Date().getTime();

  const total = expiry - created;
  const elapsed = now - created;
  const remaining = Math.max(0, 100 - (elapsed / total) * 100);

  return remaining;
}

export function formatRelativeTime(createdAt: string): string {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const diff = now - created;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  return '1시간 전';
}
