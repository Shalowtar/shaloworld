# Shaloworld

Shalowtar 的个人博客：面向 CTF Writeup 的纯静态站点，基于 **Astro 6** 构建——没有后端、没有数据库、没有服务器要养，构建产物就是一堆 HTML，扔到任何静态托管上都能跑。

站点名 `Shaloworld`、作者 `Shalowtar`、域名 `https://shalowtar.com`，这三处都在 `src/consts.ts` 里改。

内容全部是 `src/content/writeups/` 下的 Markdown 文件，正文永远在自己手里，换框架也不用重写。

---

## 当前状态

**功能框架已完整可用，内容为空。**

- `src/content/writeups/` 下只有一份 `_template.md`，它的 `draft: true` 意味着全站都不会显示（首页、列表、归档、标签、RSS、sitemap 都不收录），所以站点现在是干净的空状态。
- 这份模板只用来参照字段格式，**不要直接在它上面写文章**，用 `npm run new` 生成新文件。
- 不需要参照时可以删掉它，功能不受影响（只是每次构建会多一行 "collection is empty" 的提示）。

---

## 快速开始

```bash
cd blog
npm install          # 首次安装依赖（已配好国内镜像 .npmrc）
npm run dev          # 开发模式，浏览器打开 http://localhost:4321
npm run build        # 生成静态站点到 dist/
npm run preview      # 本地预览 dist/ 的构建结果
```

### 环境要求

- Node.js **≥ 22.12**（当前机器是 22.23.2，可用）
- 已锁定 `astro@6.4.8`。**不要升到 Astro 7**：它要求 Node ≥ 22.23.4，会让构建直接报错。

如果以后升级了 Node，可以 `npm install astro@latest` 再回来删掉 README 这段提示。

---

## 先改这 3 个地方

当前已按 Shaloworld / Shalowtar / `shalowtar.com` 配好，下面这张表是以后要改时对照用的：

| 文件 | 改什么 |
| --- | --- |
| `src/consts.ts` | 站点名 `title`、标语 `tagline`、作者 `author`、邮箱、GitHub、导航项、技能矩阵 `SKILLS` |
| `astro.config.mjs` | `site` 改成你的正式域名（影响 RSS 与 sitemap 里的绝对链接） |
| `public/robots.txt` | 把 sitemap 的域名同步改掉 |

域名提醒：`shalowtar.com` 必须由你自己注册并绑定到托管平台，站内配置才会指向正确地址。换域名时这三处一起改。

简历下载按钮：把 PDF 放到 `public/resume.pdf`，`/about/` 页面会自动出现「简历 PDF ↓」按钮，没放就不显示（不会出现死链）。

---

## 视觉风格（杂志风）

整站是**暖纸底 + 细规则线**的杂志版式，设计令牌集中在 `src/styles/global.css` 顶部，改一处全站生效。

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--paper` | `#ece5d6` | 页面底色（暖纸色，不是纯白） |
| `--paper-2` | `#f4efe2` | 卡片 / 区块填充 |
| `--ink` | `#241e17` | 正文墨色 |
| `--ink-strong` | `#100d08` | 标题与粗规则线 |
| `--accent` | `#943726` | 朱砂色强调（序号、栏目名、链接） |
| `--rule` / `--rule-soft` | `#c6b99f` / `#d8cdb8` | 1px 分隔线 |

字体分工：

- **标题 / 栏目标签 / 正文小节**：行楷 —— 霞鹜文楷（`LXGW WenKai`），OFL 开源可商用，自托管在 `public/fonts/wenkai/`，97 个 woff2 分片按 `unicode-range` 按需加载，整包 4.4MB 但访客只下到用到的字。
- **正文长文**：宋体（`Source Han Serif SC` → `Songti SC` → `SimSun`），零下载，长文读起来不累。
- **导航 / 元信息**：系统无衬线；**代码**：等宽。

要让**正文也用行楷**，把 `global.css` 里的 `--font-serif` 改成 `var(--font-display)` 即可（一行）。

站点现在是纯浅色，**没有深色主题、也没有切换按钮**（此前那版深色终端风已整体替换）。

---

## 写一篇文章

### 方式一：用脚手架

```bash
npm run new "ISCTF 2026 babyrev" reverse
# 生成 src/content/writeups/2026-11-16-isctf-2026-babyrev.md
```

分类可选：`reverse` / `pwn` / `crypto` / `web` / `misc` / `iot`。

### 方式二：直接新建文件

文件名就是 URL 的一部分，约定 `年份-赛事-分类-题名.md`，全小写连字符：

```
src/content/writeups/2026-isctf-reverse-babyrev.md
   →  https://your-domain.com/writeups/2026-isctf-reverse-babyrev/
```

改文件名等于改永久链接，**发布后别再改**（要做重定向很麻烦）。

### Frontmatter 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 文章标题 |
| `summary` | ✅ | 列表摘要 + SEO 描述，60–120 字最合适 |
| `category` | ✅ | `Reverse` / `Pwn` / `Crypto` / `Web` / `Misc` / `IoT` |
| `difficulty` | | `Easy` / `Medium` / `Hard` / `Insane`，默认 Medium |
| `publishedAt` | ✅ | `2026-11-16` 这种格式 |
| `updatedAt` | | 有实质修改时填，会显示「更新」 |
| `event` | | 赛事名，如 `ISCTF 2026`，同赛事文章会自动做相关推荐 |
| `tags` | | 字符串数组，参与标签页与搜索权重 |
| `tools` | | 工具清单，显示在标题下方 |
| `solveTime` | | 如 `2h 30m` |
| `attachments` | | `name` / `href` / `size` / `sha256` |
| `draft` | | `true` 时不发布、不生成页面 |

附件实体放 `public/downloads/`，`href` 写 `/downloads/xxx.zip`。

### 正文建议骨架

```markdown
## 0. 题目信息      checksec / 文件类型
## 1. 初步侦察
## 2. 静态分析
## 3. 动态验证
## 4. 关键点定位
## 5. 利用 / 还原     exp 代码
## 6. Flag
## 7. 复盘            踩了什么坑、下次怎么更快
```

`##` 和 `###` 会自动进右侧悬浮目录，标题 id 自动生成。

### Flag 折叠块

用 `flag` 作为代码块语言，渲染成默认遮罩、点击显示、可复制的块：

````markdown
```flag
flag{your_flag_here}
```
````

这样既防剧透，也避免搜索引擎把过期比赛 flag 索引走。

### 代码块

正常用三反引号 + 语言名即可，Shiki 高亮，hover 出现 `copy` 按钮。**记得用代码块包裹而不是裸写 `<` `>`**，否则 Markdown 会当标签解析。

---

## 目录结构

```
blog/
├─ astro.config.mjs       站点配置（域名、Shiki 主题、remark 插件）
├─ public/                原样拷贝到根目录：favicon、robots.txt、downloads/、resume.pdf
├─ scripts/new-post.mjs   新建文章脚本
├─ src/
│  ├─ consts.ts           站点信息、导航、技能矩阵
│  ├─ content.config.ts   Writeup 集合的 frontmatter schema
│  ├─ content/writeups/   ★ 所有文章都在这
│  ├─ layouts/BaseLayout.astro   全局外壳（head、SEO、主题初始化）
│  ├─ components/         Header / Footer / PostCard
│  ├─ styles/global.css   设计系统：颜色、排版、组件样式全在这里
│  ├─ utils/              日期、阅读时长、标签统计、相关推荐、flag 插件
│  └─ pages/
│     ├─ index.astro              首页
│     ├─ writeups/                列表 + [...id] 详情
│     ├─ archive.astro            归档
│     ├─ tags/                    标签总览 + [tag] 聚合
│     ├─ about.astro              关于 / 简历
│     ├─ search.astro             全站搜索（构建期生成索引）
│     ├─ 404.astro
│     ├─ rss.xml.js / sitemap.xml.js
```

---

## 已实现的功能

**内容**
- Markdown 文章 + frontmatter 类型校验（字段写错会在构建时报错）
- 分类筛选、标签聚合、年份归档、上下篇、相关推荐
- 全站搜索（构建时把标题/摘要/标签/正文塞进页面，纯前端匹配，零服务）
- RSS 2.0、sitemap.xml、robots.txt、canonical、OG/Twitter 卡片
- 草稿标记（`draft: true`）

**阅读体验**
- 纯浅色杂志版式（暖纸底 + 行楷标题），无主题切换
- 右侧悬浮目录，滚动高亮；顶部阅读进度条
- 代码高亮 + 一键复制；一键复制本文链接
- Flag 折叠块
- 表格、附件区、图片点击放大
- 任意页面按 `/` 或 `Ctrl K` 直达搜索
- 移动端可用

**求职向**
- `/about/` 技能矩阵、时间线、项目卡片、简历 PDF 下载
- 首页赛事/分类统计
- 结构化数据（WebSite / Person / BlogPosting），利于搜索引擎与分享抓取

---

## 域名怎么变成你的

**域名和托管是两件事**：域名是"门牌号"，托管是"房子"。现在项目里写的 `shalowtar.com` 只是一串文字，既没买，也没有服务器在应答。

### 第一步：买下 shalowtar.com

在哪买都行，认准"注册商 + 支持改 DNS"：

| 渠道 | 特点 |
| --- | --- |
| Cloudflare Registrar | 按成本价续费，无溢价，需绑信用卡；后续改 DNS 最方便 |
| Namecheap | 支持支付宝，界面英文 |
| 阿里云 / 腾讯云 | 有中文界面和发票，**需要域名实名认证**（个人身份证，1–3 天审核） |

`.com` 首年通常 30–80 元，续费 60–100 元/年。下单前在注册商页面搜 `shalowtar` 看是否可注册；被占用就退而求其次：`shalowtar.dev`、`shalowtar.net`、`shalowtar.me`、`shalowtar.tech`（`.dev` 强制 HTTPS，对技术博客更合适）。

### 第二步：先上线，拿到临时地址

照下面「部署」一节把站点传到 Cloudflare Pages / Vercel，会先得到一个平台地址，例如 `shalowtar.pages.dev`。**这一步不需要域名**，别人已经能打开。

### 第三步：把域名指过来

两种做法，选一种：

**做法 A（推荐）：把域名的 DNS 托管交给 Cloudflare**
1. Cloudflare 后台 Add a site，填 `shalowtar.com`
2. Cloudflare 给你两个 NS 地址（形如 `xxx.ns.cloudflare.com`）
3. 回注册商后台，把域名的 Nameserver 改成这两个
4. 等生效（几分钟到 24 小时），之后所有 DNS 记录都在 Cloudflare 里管
5. Pages 项目 → Custom domains → 添加 `shalowtar.com` 和 `www.shalowtar.com`

**做法 B：只在注册商加解析记录**
在 DNS 记录里加：
- `CNAME` `www` → `shalowtar.pages.dev`
- 根域 `shalowtar.com`：Cloudflare Pages / Vercel 都支持根域 CNAME 展平，按平台提示填即可；若注册商不支持根域 CNAME，就用 `A` 记录指向平台给的 IP

HTTPS 由平台自动签发，通常几分钟生效，不用自己搞证书。生效后 `https://shalowtar.com` 就能被任何设备打开。

### 第四步：把站内配置改成正式域名

域名生效后，确认这三处是 `https://shalowtar.com`（现在是）：

- `src/consts.ts` → `SITE.url`
- `astro.config.mjs` → `site`
- `public/robots.txt` → `Sitemap` 那行

改完重新构建推上去，RSS 和 sitemap 里的绝对链接才会正确。

---

## 部署

构建产物在 `dist/`，把它上传到任意静态托管即可。

### Cloudflare Pages（推荐，国内访问相对稳）

1. 把仓库推到 GitHub
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git，选这个仓库
3. 构建设置填：

| 项 | 值 |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node 版本（环境变量） | `NODE_VERSION` = `22.16.0` |

**为什么必须设 Node 版本**：这个站锁定在 `astro@6.4.8`，要求 Node ≥ 22.12。Cloudflare 默认版本可能低于这个数，构建会直接失败。报错里出现 `Astro requires Node >=22.12.0` 就是这个问题。

**还要加一个环境变量**：`NPM_CONFIG_REGISTRY` = `https://registry.npmjs.org`。
项目里的 `.npmrc` 指向国内镜像 `registry.npmmirror.com`（本机装依赖快），但 Cloudflare 的构建机在海外，走国内镜像可能超时；用环境变量覆盖回官方源更稳。

4. Deploy 后会得到一个 `https://<项目名>.pages.dev`，**这就是可以发给别人的链接**
5. 绑定自定义域名见上一节

### Vercel

同样导入仓库，框架会自动识别为 Astro，输出 `dist`。若构建报 Node 版本错误，在 Settings → General → Node.js Version 选 22.x。

### GitHub Pages

1. 仓库 Settings → Pages → Source 选 GitHub Actions
2. 新建 `.github/workflows/deploy.yml`，跑 `npm ci && npm run build` 并上传 `dist` 为 artifact
3. 若部署在 `用户名.github.io/仓库名/` 子路径，需要在 `astro.config.mjs` 里加 `base: '/仓库名'`

> 国内服务器（阿里云/腾讯云）也可，但**必须备案**，不备案就用境外托管。

---

## 备份

内容就是 `src/content/writeups/` 这一个目录，一定要双远端（本地仓库已初始化好，直接加远端即可）：

```bash
git remote add origin https://github.com/<你>/<仓库>.git
git remote set-url --add --push origin https://gitee.com/<你>/<仓库>.git
```

`set-url --add --push` 之后一次 `git push` 同时推到两边，国内那个当灾备。

---

## 还没做（按需再加）

- 评论（接 Giscus 或 Twikoo，都是一行脚本）
- 访问统计（Umami / 百度统计）
- 在线写作后台
- 点赞、登录
- i18n

这些都需要外部服务或后端，等你确认「确实需要」再加，不必现在扩。

---

## 排错

| 现象 | 原因 |
| --- | --- |
| 构建报 Node 版本不支持 | Astro 版本太高，降到 6.x |
| 文章不出现 | `draft: true`，或 `publishedAt` 是未来时间 |
| 删掉文章后，`dist/` 里仍有旧页面 | 内容层缓存没刷新。删 `node_modules/.astro` 目录再重新构建（注意缓存不在项目根的 `.astro`） |
| 文件名带中文后链接 404 | 建议改用英文 slug，中文会被 URL 编码 |
| 浅色主题下某些块颜色不对 | 检查是否有 `transition: background` 搭配 CSS 变量（会卡在过渡起点） |
