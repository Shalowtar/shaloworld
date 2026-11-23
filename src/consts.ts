/**
 * 站点全局配置 —— 大部分内容改这里就够了；
 * 域名还需要同步 astro.config.mjs 与 public/robots.txt。
 */
const SITE_URL = 'https://shaloworld.pages.dev';

export const SITE = {
  /** 站点名（报头、<title>、RSS 都用它） */
  title: 'Shaloworld',
  description: 'Shalowtar 的小世界',
  author: 'Shalowtar',
  /** 部署后的正式域名，务必与 astro.config.mjs 的 site 保持一致 */
  url: SITE_URL,
  /**
   * 社交分享封面（必须是绝对地址，微信/X/Telegram 都只认绝对 URL）。
   * 站内图片放在 public/ 下，换域名后这里会自动跟着变
   */
  ogImage: `${SITE_URL}/og-default.png`,
  email: 'zrlwy2007@foxmail.com',
  github: 'https://github.com/Shalowtar',
  /** 顶部导航 */
  nav: [
    { label: '项目', href: '/projects/' },
    { label: '文章', href: '/writeups/' },
    { label: '关于', href: '/about/' },
  ],
};

/** 分类配色（与 global.css 中的 [data-cat] 对应）；C 不是 CTF 分类，用来放纯 C 语言练习；密码学用来放古典/现代密码学的原理练习 */
export const CATEGORIES = ['Reverse', 'Pwn', 'Crypto', 'Web', 'Misc', 'IoT', 'C', '密码学'] as const;
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Insane'] as const;

/** 目录页二级分类的显示顺序；没有列出的按时间排 */
export const SUBCATEGORY_ORDER: Record<string, string[]> = {
  Reverse: ['SparkCTF2026', 'R3CTF2025', '其他', '学习周报'],
  C: ['学习', '练习'],
};
