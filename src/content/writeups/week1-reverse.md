---
title: 第一周周报：汇编基础与 GDPTCTF 逆向复现
summary: 这一周把常用汇编指令和寄存器过了一遍，并用 IDA 复现了一道 GDPTCTF 的逆向题（时间随机数 + xxtea 校验），记录在 3 页的周报里。
category: Reverse
publishedAt: 2026-11-17
tags:
  - 逆向
  - 汇编
  - GDPTCTF
tools:
  - IDA
attachments:
  - name: 第一周周报——逆向.pdf
    href: /downloads/week1-reverse-report.pdf
    size: 206 KB
---

这一周没有布置下来的题目，就按自己的节奏把汇编基础补了一遍：`mov`、`lea`、`imul`、`shr`、`sar`、`call`、`cmp` 这些指令的作用逐个查过去，寄存器、标志位和函数调用约定也顺手过了一遍。

手上练的是一道 GDPTCTF 的逆向题。程序先用 `time` 取时间、`srand` 播种，再乘除移位取模生成 1–100 的随机数，读入一个数字后 `cmp` 比较；相等才进正确分支，把 10 和 `data_start` 的地址交给 `xxtea` 解密。最后在 IDA 里定位到 `data_start` 那块硬编码的密钥字节，改成明文对应的十六进制，程序就自己把 flag 打出来了。

完整过程、IDA 截图和逐条注释都在下面这份 pdf 里，共 3 页。

<iframe class="pdf-frame" src="/downloads/week1-reverse-report.pdf" title="第一周周报：逆向（PDF 预览）" loading="lazy"></iframe>

<p class="pdf-hint">如果上面的预览打不开（部分手机浏览器和微信内置浏览器会拦内嵌 pdf），用下面的链接下载：</p>

[下载《第一周周报——逆向》PDF（206 KB）](/downloads/week1-reverse-report.pdf)
