/**
 * 站点全局配置 —— 改这里就够了。
 * 改完标题/名字/链接后重新 `npm run build` 即可。
 */
export const SITE = {
  /** 站点名（报头、<title> 后缀、RSS 都用它） */
  title: 'Shaloworld',
  /** 用于 <title> 后缀与 RSS */
  tagline: '逆向 / CTF 解题记录',
  description:
    'Shalowtar 的 CTF Writeup 与逆向笔记：记录 Reverse 的解题过程、工具链和踩过的坑。',
  author: 'Shalowtar',
  /** 部署后的正式域名，务必替换，影响 RSS 与 sitemap */
  url: 'https://shalowtar.com',
  email: 'shalowtar@example.com',
  github: 'https://github.com/shalowtar',
  /** 顶部导航 */
  nav: [
    { label: 'Writeup', href: '/writeups/' },
    { label: '归档', href: '/archive/' },
    { label: '标签', href: '/tags/' },
    { label: '关于', href: '/about/' },
  ],
};

/** 首页技能矩阵：level 1-5，用来画进度条 */
export const SKILLS = [
  { name: '逆向分析', level: 4, note: 'IDA / Ghidra / x64dbg' },
  { name: 'Python 脚本', level: 4, note: '分析脚本 / 自动化' },
  { name: 'Linux / WSL', level: 3, note: '调试环境、Docker 复现' },
  { name: '汇编与调试', level: 3, note: 'x86 / x64 / gdb' },
];

/** 分类配色（与 global.css 中的 [data-cat] 对应） */
export const CATEGORIES = ['Reverse', 'Pwn', 'Crypto', 'Web', 'Misc', 'IoT'] as const;
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Insane'] as const;
