import { getCollection } from 'astro:content';
import { visiblePosts, tagCounts } from '../utils/posts';
import { CATEGORIES, SITE } from '../consts';
import { categoryHref, categoryTree, flattenCategoryTree } from '../utils/categories';

export async function GET(context) {
  const posts = visiblePosts(await getCollection('writeups'));
  const site = (context.site ?? new URL(SITE.url)).href.replace(/\/$/, '');

  const statics = [
    '/',
    ...SITE.nav.map((item) => item.href),
    '/toc/',
    '/tags/',
    '/categories/',
    '/other/',
    '/search/',
  ];

  const entries = [
    ...statics.map((p) => ({ loc: `${site}${p}`, lastmod: null })),
    ...tagCounts(posts).map((t) => ({
      loc: `${site}/tags/${encodeURIComponent(t.tag)}/`,
      lastmod: null,
    })),
    ...flattenCategoryTree(categoryTree(posts, CATEGORIES)).map((node) => ({
      loc: `${site}${categoryHref(node.pathNames)}`,
      lastmod: null,
    })),
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
