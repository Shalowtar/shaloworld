import { defineConfig } from 'astro/config';
import remarkFlagBlock from './src/utils/remark-flag.mjs';

export default defineConfig({
  // 换成你的正式域名后，RSS 与 sitemap 里的链接才会正确
  site: 'https://shalowtar.com',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
    remarkPlugins: [remarkFlagBlock],
  },
});
