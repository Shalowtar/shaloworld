/**
 * 站点全局配置 —— 改这里就够了。
 * 改完标题/名字/链接后重新 `npm run build` 即可。
 */
export const SITE = {
  /** 站点名（报头、<title>、RSS 都用它） */
  title: 'Shaloworld',
  description: 'Shalowtar 的小世界',
  author: 'Shalowtar',
  /** 部署后的正式域名，务必替换，影响 RSS 与 sitemap */
  url: 'https://shalowtar.com',
  /**
   * 社交分享封面（必须是绝对地址，微信/X/Telegram 都只认绝对 URL）。
   * 正式域名启用后，把这里换成 https://shalowtar.com/og-default.png 即可
   */
  ogImage: 'https://shaloworld.pages.dev/og-default.png',
  email: 'zrlwy2007@foxmail.com',
  github: 'https://github.com/Shalowtar',
  /** 顶部导航 */
  nav: [
    { label: '项目', href: '/projects/' },
    { label: '学习', href: '/writeups/' },
    { label: '标签', href: '/tags/' },
    { label: '归档', href: '/archive/' },
    { label: '关于', href: '/about/' },
  ],
};

/** 分类配色（与 global.css 中的 [data-cat] 对应）；C 不是 CTF 分类，用来放纯 C 语言练习 */
export const CATEGORIES = ['Reverse', 'Pwn', 'Crypto', 'Web', 'Misc', 'IoT', 'C'] as const;
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Insane'] as const;
