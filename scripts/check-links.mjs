/**
 * 构建产物死链检查：扫描 dist 里所有 HTML 的内部链接与静态资源，
 * 确认目标文件真实存在。用法：npm run build && npm run check:links
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(process.cwd(), 'dist');

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

/** 把一个站内链接解析成 dist 里应当存在的文件 */
function candidates(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean.startsWith('/')) return [];
  const target = path.join(root, decodeURIComponent(clean));
  const out = [target];
  if (clean.endsWith('/')) out.push(path.join(target, 'index.html'));
  else if (!path.extname(target)) {
    out.push(`${target}.html`, path.join(target, 'index.html'));
  }
  return out;
}

const files = (await walk(root)).filter((f) => f.endsWith('.html'));
const missing = [];
let checked = 0;

for (const file of files) {
    const html = await readFile(file, 'utf8');
    const rel = path.relative(root, file);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|javascript:|data:|#|\/\/)/.test(href)) continue;
    const list = candidates(href);
    if (!list.length) continue;
    checked += 1;
    if (!list.some((c) => existsSync(c))) {
      const served = list.find((c) => !path.extname(c));
      if (!served) missing.push(`${rel} → ${href}`);
    }
  }
}

// 顺手确认每个 HTML 都有对应的可访问路径（防止某个页面漏生成）
for (const file of files) {
  const s = await stat(file);
  if (!s.isFile()) missing.push(`${path.relative(root, file)} 不是文件`);
}

console.log(`检查了 ${files.length} 个页面、${checked} 条站内链接`);
if (missing.length) {
  console.log(`发现 ${missing.length} 条死链：`);
  for (const line of missing) console.log('  ' + line);
  process.exit(1);
}
console.log('没有死链');
