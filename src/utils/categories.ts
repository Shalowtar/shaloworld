import type { Post } from './posts';
import { SUBCATEGORY_ORDER } from '../consts';

export interface CategoryNode {
  name: string;
  pathNames: string[];
  posts: Post[];
  children: CategoryNode[];
  count: number;
  latest: number;
}

/** 分类 URL 片段：英文转小写，中文原样保留 */
export function categorySlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/** 目录里的分类页面地址，例如 /categories/reverse/sparkctf2026/ */
export function categoryHref(pathNames: string[]): string {
  return `/categories/${pathNames.map((n) => encodeURIComponent(categorySlug(n))).join('/')}/`;
}

/** Astro 静态路由参数，例如 reverse/sparkctf2026 */
export function categoryRoute(pathNames: string[]): string {
  return pathNames.map(categorySlug).join('/');
}

function latestOf(posts: Post[]): number {
  return posts.reduce((max, p) => Math.max(max, p.data.publishedAt.getTime()), 0);
}

function makeNode(name: string, pathNames: string[], scoped: Post[]): CategoryNode {
  const depth = pathNames.length - 1;
  const nodePosts = scoped.filter((p) =>
    p.data.subcategories.slice(0, depth).every((s, i) => s === pathNames[i + 1])
  );

  const nextIndex = depth;
  const childNames = [
    ...new Set(
      nodePosts
        .map((p) => p.data.subcategories[nextIndex])
        .filter((s): s is string => Boolean(s))
    ),
  ];

  const children = childNames.map((child) =>
    makeNode(child, [...pathNames, child], nodePosts)
  );

  if (depth === 0) {
    const order = SUBCATEGORY_ORDER[pathNames[0]] ?? [];
    children.sort((a, b) => {
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      const oa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
      const ob = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
      return oa - ob || b.latest - a.latest;
    });
  } else {
    children.sort((a, b) => b.latest - a.latest);
  }

  return {
    name,
    pathNames,
    posts: [...nodePosts].sort(
      (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
    ),
    children,
    count: nodePosts.length,
    latest: latestOf(nodePosts),
  };
}

/** 按目录层级生成分类树；只保留有文章的分类 */
export function categoryTree(posts: Post[], categories: readonly string[]): CategoryNode[] {
  return categories
    .map((name) => {
      const scoped = posts.filter((p) => p.data.category === name);
      return scoped.length ? makeNode(name, [name], scoped) : null;
    })
    .filter((n): n is CategoryNode => n !== null);
}

/** 把分类树展开成所有分类页面 */
export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  for (const node of nodes) {
    out.push(node, ...flattenCategoryTree(node.children));
  }
  return out;
}
