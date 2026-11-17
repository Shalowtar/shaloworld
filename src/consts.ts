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
  email: 'zrlwy2007@fomail.com',
  github: 'https://github.com/Shalowtar',
  /** 顶部导航 */
  nav: [
    { label: 'Writeup', href: '/writeups/' },
    { label: '归档', href: '/archive/' },
    { label: '标签', href: '/tags/' },
    { label: '关于', href: '/about/' },
  ],
};

/** 分类配色（与 global.css 中的 [data-cat] 对应） */
export const CATEGORIES = ['Reverse', 'Pwn', 'Crypto', 'Web', 'Misc', 'IoT'] as const;
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Insane'] as const;
