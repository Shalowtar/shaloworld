/**
 * 项目清单 —— 加项目就在数组里追加一条，页面会自动列出。
 * summary 写一句“做了什么 + 结果”，比罗列技术栈更让人看得懂。
 */
export interface Project {
  name: string;
  /** 项目目录里的大类，例如 工具 / 逆向 / Web；省掉时归到「项目」 */
  category?: string;
  summary: string;
  stack: string[];
  /** 维护中 / 进行中 / 已完成 */
  status?: string;
  /** 线上演示地址 */
  href?: string;
  /** 代码仓库地址 */
  repo?: string;
}

export const PROJECTS: Project[] = [];
