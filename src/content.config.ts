import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Writeup 集合：文章是 src/content/writeups 下的 .md 文件。
 * 文件名（去掉 .md）就是 URL 里的 slug，例如
 *   src/content/writeups/2026-isctf-babyrev.md  →  /writeups/2026-isctf-babyrev/
 */
const writeups = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writeups' }),
  schema: z.object({
    title: z.string(),
    /** 列表页与 SEO 描述，建议 60-120 字 */
    summary: z.string(),
    /** 赛事名，例如 ISCTF 2026；没有可省 */
    event: z.string().optional(),
    category: z.enum(['Reverse', 'Pwn', 'Crypto', 'Web', 'Misc', 'IoT', 'C']),
    difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Insane']).optional(),
    tags: z.array(z.string()).default([]),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    /** 本题用到的工具，展示在题目信息区 */
    tools: z.array(z.string()).default([]),
    /** 解题耗时，例如 "2h 30m" */
    solveTime: z.string().optional(),
    /** 正文之外的题包/exp/脚本清单（文件放 public/downloads/） */
    attachments: z
      .array(
        z.object({
          name: z.string(),
          href: z.string().optional(),
          size: z.string().optional(),
          sha256: z.string().optional(),
        })
      )
      .default([]),
    /** 草稿：true 则列表与详情都不出现 */
    draft: z.boolean().default(false),
  }),
});

export const collections = { writeups };
