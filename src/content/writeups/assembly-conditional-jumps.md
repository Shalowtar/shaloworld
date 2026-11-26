---
title: '汇编学习 · 条件跳转'
summary: '用一段 GCC 汇编练习条件跳转：分清 jle、jge、je 的方向与分支合并，修正自己翻译时漏掉的跳转和 printf 换行。'
category: 汇编
subcategories: []
tags: ['汇编', '条件跳转']
publishedAt: 2026-11-26T23:41:00+08:00
---

今天来学习汇编语言。

先看一段汇编：

```asm
classify:
.LFB0:
	.cfi_startproc
	endbr64
	push	rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	mov	rbp, rsp
	.cfi_def_cfa_register 6
	mov	DWORD PTR -4[rbp], edi
	mov	DWORD PTR -8[rbp], esi
	cmp	DWORD PTR -4[rbp], 10
	jle	.L2
	cmp	DWORD PTR -8[rbp], 0
	je	.L2
	mov	eax, 1
	jmp	.L3
.L2:
	cmp	DWORD PTR -4[rbp], -5
	jge	.L4
	mov	eax, 2
	jmp	.L3
.L4:
	mov	eax, 0
.L3:
	pop	rbp
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
.LFE0:
	.size	classify, .-classify
	.section	.rodata
.LC0:
	.string	"%d\n"
	.text
	.globl	main
	.type	main, @function
main:
.LFB1:
	.cfi_startproc
	endbr64
	push	rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	mov	rbp, rsp
	.cfi_def_cfa_register 6
	mov	esi, 3
	mov	edi, 12
	call	classify
	mov	edx, eax
	lea	rax, .LC0[rip]
	mov	esi, edx
	mov	rdi, rax
	mov	eax, 0
	call	printf@PLT
	mov	esi, 3
	mov	edi, -9
	call	classify
	mov	edx, eax
	lea	rax, .LC0[rip]
	mov	esi, edx
	mov	rdi, rax
	mov	eax, 0
	call	printf@PLT
	mov	esi, 0
	mov	edi, 5
	call	classify
	mov	edx, eax
	lea	rax, .LC0[rip]
	mov	esi, edx
	mov	rdi, rax
	mov	eax, 0
	call	printf@PLT
	mov	eax, 0
	pop	rbp
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
```

## 我的翻译

```c
#include<stdio.h>
int classfy(int x, int y)
{
	if (x <= 10)
	{
		if (x >= -5)
		{
			return 0;
		}
		return 2;
	}
	if (y == 0)
		return 1;
	return 0;
}
int main()
{
	printf("%d", classfy(12, 3));
	printf("%d", classfy(-9, 3));
	printf("%d", classfy(5, 0));
	return 0;
}
```

## 标准答案

```c
#include <stdio.h>
int classify(int x, int y)
{
    if (x > 10 && y != 0)
    {
        return 1;
    }
    if (x < -5) 
    {
        return 2;
    }
    return 0;
}

int main(void)
{
    printf("%d\n", classify(12, 3));
    printf("%d\n", classify(-9, 3));
    printf("%d\n", classify(5, 0));
    return 0;
}
```

---

## 错误点

1. `y` 的条件写反，逻辑错误 ✗
2. 两个条件跳转分支都会指向另一个，但是我只写了一个。
3. `printf` 缺换行 ✗

```asm
.LC0:
	.string	"%d\n"
```

4. `x` 段的跳转方向相反。

---

## 知识点

- `mov a, b`：即将 b 的值传给 a。
- `cmp a, b`：即用 a-b，更改标志位 ZF（0 标志）、SF（符号）、CF（进位借位）、OF（溢出）。
- `jle`：小于等于跳转（有符号）。
- `jge`：大于等于跳转（有符号）。
- `je`：等于跳转。
- `jmp`：跳转。

---

## 总结

读汇编的时候可以先不管跳转读下去，然后再返回来将条件补上。

这种条件分支时可以先理出条件和去向，再还原成 C。

---

先这样吧。
