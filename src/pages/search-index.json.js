import { getCollection } from 'astro:content';
import { visiblePosts, formatDate } from '../utils/posts';

/** 搜索索引单独出一个静态 JSON：搜索页 HTML 不再随文章数线性变大 */
export async function GET() {
  const all = visiblePosts(await getCollection('writeups'));

  const index = all.map((p) => ({
    title: p.data.title,
    summary: p.data.summary,
    url: `/writeups/${p.id}/`,
    cat: p.data.category,
    event: p.data.event ?? '',
    tags: p.data.tags,
    date: formatDate(p.data.publishedAt),
    body: (p.body ?? '').replace(/\s+/g, ' ').slice(0, 4000),
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
  });
}
