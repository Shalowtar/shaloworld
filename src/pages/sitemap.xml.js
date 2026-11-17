import { getCollection } from 'astro:content';
import { visiblePosts } from '../utils/posts';
import { SITE } from '../consts';

export async function GET(context) {
  const posts = visiblePosts(await getCollection('writeups'));
  const site = (context.site ?? new URL(SITE.url)).href.replace(/\/$/, '');

  const statics = ['/', '/writeups/', '/archive/', '/tags/', '/about/', '/search/'];

  const entries = [
    ...statics.map((p) => ({ loc: `${site}${p}`, lastmod: null })),
    ...posts.map((post) => ({
      loc: `${site}/writeups/${post.id}/`,
      lastmod: (post.data.updatedAt ?? post.data.publishedAt).toISOString(),
    })),
  ];

  const urls = entries
    .map((e) =>
      e.lastmod
        ? `  <url><loc>${e.loc}</loc><lastmod>${e.lastmod}</lastmod></url>`
        : `  <url><loc>${e.loc}</loc></url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
