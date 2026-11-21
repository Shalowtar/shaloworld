import { defineConfig } from 'astro/config';
import remarkFlagBlock from './src/utils/remark-flag.mjs';

export default defineConfig({
  // 与 src/consts.ts 的 SITE.url、public/robots.txt 保持一致；换正式域名时三处一起改
  site: 'https://shaloworld.pages.dev',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
    remarkPlugins: [remarkFlagBlock],
  },
});
