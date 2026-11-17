/**
 * 新建文章骨架：node scripts/new-post.mjs "标题" reverse
 *
 * 生成 src/content/writeups/<日期>-<slug>.md，并把分类、日期预填好。
 * 不覆盖已存在的文件。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CATEGORY_MAP = {
  reverse: 'Reverse',
  rev: 'Reverse',
  pwn: 'Pwn',
  crypto: 'Crypto',
  web: 'Web',
  misc: 'Misc',
  iot: 'IoT',
};

const args = process.argv.slice(2);
const title = args[0];
const categoryArg = (args[1] || 'reverse').toLowerCase();

if (!title) {
  console.error('用法: node scripts/new-post.mjs "文章标题" [reverse|pwn|crypto|web|misc|iot]');
  process.exit(1);
}

const category = CATEGORY_MAP[categoryArg];
if (!category) {
  console.error(`未知分类 "${args[1]}"，可用: ${Object.keys(CATEGORY_MAP).join(' / ')}`);
  process.exit(1);
}

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
  now.getDate()
).padStart(2, '0')}`;

/** 只保留 ASCII 字母数字转成 slug；标题基本是中文时用分类+时间兜底 */
const asciiSlug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40);

const fallback = `${category.toLowerCase()}-${Math.floor(now.getTime() / 1000)}`;
const slug = asciiSlug.length >= 3 ? asciiSlug : fallback;
const filename = `${date}-${slug}.md`;

const dir = path.join('src', 'content', 'writeups');
await mkdir(dir, { recursive: true });
const target = path.join(dir, filename);

if (existsSync(target)) {
  console.error(`已存在: ${target}`);
  process.exit(1);
}

const body = `---
title: ${title}
summary: 一句话说清这题考什么、你怎么解的。
event: 赛事名称
category: ${category}
difficulty: Medium
tags:
  - 待填
publishedAt: ${date}
tools:
  - 待填
solveTime: 1h
---

## 0. 题目信息

\`\`\`bash
file 附件名
checksec --file=附件名
\`\`\`

## 1. 初步侦察

## 2. 静态分析

## 3. 动态验证

## 4. 关键点定位

## 5. 利用 / 还原

\`\`\`python
# exp 或脚本
\`\`\`

## 6. Flag

\`\`\`flag
flag{填你的}
\`\`\`

## 7. 复盘

- 卡在哪、为什么卡；
- 下次遇到同类题的最快路径。
`;

await writeFile(target, body, 'utf8');
console.log(`已创建 ${target}`);
console.log('提示：把 summary / event / tags / tools 改成真实内容后再提交。');
