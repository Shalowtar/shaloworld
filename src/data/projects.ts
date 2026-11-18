/**
 * 项目清单 —— 加项目就在数组里追加一条，页面会自动列出。
 * summary 写一句“做了什么 + 结果”，比罗列技术栈更让人看得懂。
 */
export interface Project {
  name: string;
  summary: string;
  stack: string[];
  /** 维护中 / 进行中 / 已完成 */
  status?: string;
  /** 线上演示地址 */
  href?: string;
  /** 代码仓库地址 */
  repo?: string;
}

export const PROJECTS: Project[] = [
  {
    name: 'Shaloworld · 个人博客',
    summary:
      '纯静态的杂志风个人站点：自研墨迹鼠标交互与进站动画，构建期生成搜索索引，零第三方脚本。',
    stack: ['Astro', 'TypeScript', 'Canvas', 'Cloudflare Pages'],
    status: '维护中',
    href: 'https://shaloworld.pages.dev',
    repo: 'https://github.com/Shalowtar/shaloworld',
  },
  {
    name: '挑战杯 · 团队项目',
    summary: '五人团队项目，负责方向梳理与分工协作，目前处于方案与实现阶段。',
    stack: ['团队协作', '方案设计'],
    status: '进行中',
  },
];
