import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'writeups'>;

/** 2026-11-16 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 2026 年 11 月 16 日 */
export function formatDateCN(date: Date): string {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

/** 已发布 + 非草稿，按时间倒序 */
export function visiblePosts(posts: Post[]): Post[] {
  return posts
    .filter((p) => {
      if (p.data.draft) return false;
      return p.data.publishedAt.getTime() <= Date.now();
    })
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

/** 中文按字数、英文按词数粗估，代码块也算进去（偏保守） */
export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  const text = body.replace(/```[\s\S]*?```/g, ' '.repeat(120));
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(cjk / 380 + words / 220);
  return Math.max(1, minutes);
}

/** 统计标签出现次数，按次数倒序 */
export function tagCounts(posts: Post[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 同赛事或同标签的其它文章，作为相关推荐 */
export function relatedPosts(current: Post, all: Post[], limit = 3): Post[] {
  const others = all.filter((p) => p.id !== current.id);
  const scored = others.map((p) => {
    let score = 0;
    if (p.data.event && p.data.event === current.data.event) score += 5;
    if (p.data.category === current.data.category) score += 2;
    const shared = p.data.tags.filter((t) => current.data.tags.includes(t)).length;
    score += shared;
    return { p, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}
