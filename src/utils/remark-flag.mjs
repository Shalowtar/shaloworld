/**
 * 自定义 remark 插件：把 ```flag 代码块替换成「点击显示 + 复制」的折叠块。
 *
 * 在 mdast 阶段就把节点换成 raw HTML，这样无论 Shiki 何时介入都不会被覆盖。
 *
 *   ```flag
 *   flag{example}
 *   ```
 */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function makeFlagHtml(flag) {
  const masked = '•'.repeat(Math.min(Math.max(flag.length, 8), 24));
  return (
    `<div class="flag-box" data-flag="${escapeHtml(flag)}">` +
    `<span class="flag-label">FLAG</span>` +
    `<code class="flag-value" data-revealed="false">${masked}</code>` +
    `<button class="flag-btn" type="button" data-act="toggle">显示</button>` +
    `<button class="flag-btn" type="button" data-act="copy">复制</button>` +
    `</div>`
  );
}

function walk(node) {
  if (!node.children || !node.children.length) return;
  for (let i = 0; i < node.children.length; i += 1) {
    const child = node.children[i];
    if (child.type === 'code' && child.lang === 'flag') {
      node.children[i] = {
        type: 'html',
        value: makeFlagHtml((child.value || '').trim()),
      };
      continue;
    }
    walk(child);
  }
}

export default function remarkFlagBlock() {
  return (tree) => {
    walk(tree);
  };
}
