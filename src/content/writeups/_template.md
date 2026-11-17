---
# 这是一份写作模板，draft: true 表示永不发布：
# 它不会出现在首页、列表、归档、标签、RSS 和 sitemap 里。
# 想写新文章不要改这个文件，用 `npm run new "题目名" reverse` 生成新文件；
# 确认不再需要参照时可以整个删掉（站点会退回空状态，功能不受影响）。
title: 写作模板（不会发布）
summary: 这份文件只用来参照字段格式，draft 为 true 所以全站都不会显示它。
event: 赛事名称
category: Reverse
difficulty: Medium
tags:
  - 标签一
  - 标签二
publishedAt: 2026-11-17
tools:
  - IDA Pro
  - Python 3
solveTime: 1h
attachments: []
draft: true
---

## 0. 题目信息

```bash
file 附件名
checksec --file=附件名
```

保护机制建议用表格列清楚（Canary / NX / PIE / RELRO）。

## 1. 初步侦察

文件类型、架构、字符串、导入表里有什么值得注意的东西。

## 2. 静态分析

关键函数、伪代码、逻辑还原。

## 3. 动态验证

断点打在哪、寄存器/内存怎么变化。

## 4. 关键点定位

真正卡住题目的那一个判断或那一个越界。

## 5. 利用 / 还原

```python
# exp 或还原脚本
```

## 6. Flag

Flag 用 `flag` 作为代码块语言，会渲染成默认遮罩、点击显示、可复制的块：

```flag
flag{示例占位}
```

## 7. 复盘

- 卡在哪、为什么卡；
- 下次遇到同类题的最快路径是什么。
