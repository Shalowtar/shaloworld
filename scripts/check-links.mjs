/**
 * 构建产物死链检查：扫描 dist 里所有 HTML 的内部链接与静态资源，
 * 确认目标文件真实存在。用法：npm run build && npm run check:links
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

/** 把一个站内链接解析成 dist 里真正应当被回应的文件 */
function candidates(href) {
  let clean;
  try {
    clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
  } catch {
    return [];
  }
  if (!clean.startsWith('/')) return [];
  const target = path.join(root, clean);

  if (clean.endsWith('/')) return [path.join(target, 'index.html')];
  if (path.extname(target)) return [target];
  return [`${target}.html`, path.join(target, 'index.html')];
}

async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
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

    let found = false;
    for (const candidate of list) {
      if (await isFile(candidate)) {
        found = true;
        break;
      }
    }
    if (!found) missing.push(`${rel} → ${href}`);
  }
}

console.log(`检查了 ${files.length} 个页面、${checked} 条站内链接`);
if (missing.length) {
  console.log(`发现 ${missing.length} 条死链：`);
  for (const line of missing) console.log('  ' + line);
  process.exit(1);
}
console.log('没有死链');
