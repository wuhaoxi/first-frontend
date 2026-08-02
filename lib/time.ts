export function formatRelativeTime(createdAt: string, now?: Date): string {
  const created = new Date(createdAt).getTime();
  const current = now ? now.getTime() : Date.now();
  const diffMs = current - created;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= 1) {
    return 'just now';
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}
