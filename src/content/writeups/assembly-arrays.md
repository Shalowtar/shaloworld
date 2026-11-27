---
title: '汇编学习 · 数组'
summary: '用 GCC -O0 汇编观察数组求和：首地址、元素宽度 4、循环变量在栈上的读写，以及自己翻译时 printf 丢掉返回值的问题。'
category: 汇编
subcategories: []
tags: ['汇编', '数组']
publishedAt: 2026-11-27T17:55:00+08:00
---

先看一段数组求和的汇编。

## 汇编

```asm
sum_array:
.LFB0:
	.cfi_startproc
	endbr64
	push	rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	mov	rbp, rsp
	.cfi_def_cfa_register 6
	mov	QWORD PTR -24[rbp], rdi
	mov	DWORD PTR -28[rbp], esi
	mov	DWORD PTR -8[rbp], 0
	mov	DWORD PTR -4[rbp], 0
	jmp	.L2
.L3:
	mov	eax, DWORD PTR -4[rbp]
	cdqe
	lea	rdx, 0[0+rax*4]
	mov	rax, QWORD PTR -24[rbp]
	add	rax, rdx
	mov	eax, DWORD PTR [rax]
	add	DWORD PTR -8[rbp], eax
	add	DWORD PTR -4[rbp], 1
.L2:
	mov	eax, DWORD PTR -4[rbp]
	cmp	eax, DWORD PTR -28[rbp]
	jl	.L3
	mov	eax, DWORD PTR -8[rbp]
	pop	rbp
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
.LFE0:
	.size	sum_array, .-sum_array
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
	sub	rsp, 32
	mov	rax, QWORD PTR fs:40
	mov	QWORD PTR -8[rbp], rax
	xor	eax, eax
	mov	DWORD PTR -32[rbp], 3
	mov	DWORD PTR -28[rbp], 1
	mov	DWORD PTR -24[rbp], 4
	mov	DWORD PTR -20[rbp], 1
	mov	DWORD PTR -16[rbp], 5
	mov	DWORD PTR -12[rbp], 9
	lea	rax, -32[rbp]
	mov	esi, 6
	mov	rdi, rax
	call	sum_array
	mov	edx, eax
	lea	rax, .LC0[rip]
	mov	esi, edx
	mov	rdi, rax
	mov	eax, 0
	call	printf@PLT
	mov	eax, 0
	mov	rdx, QWORD PTR -8[rbp]
	sub	rdx, QWORD PTR fs:40
	je	.L7
	call	__stack_chk_fail@PLT
.L7:
	leave
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
```

## 我翻译的（注释了疑惑点）

```c
#include <stdio.h>
int sum_array(int *a,int b) 
{
	int x = 0;
	int y = 0;
	for (y = 0;y < b;y++)
	{
		x += a[y];//？
	}
	return x;
}
int main() 
{
	int a[6] = { 3,1,4,1,5,9 };
	sum_array(a, 6);
	printf("%d\n", );//？
	return 0;
}
```

## 标准答案

```c
int sum_array(const int *a, int n)
{
    int s = 0;
    for (int i = 0; i < n; i++) {
        s += a[i];
    }
    return s;
}

int main(void)
{
    int data[6] = {3, 1, 4, 1, 5, 9};
    printf("%d\n", sum_array(data, 6));
    return 0;
}
```

---

## 错误点

`sum_array(a, 6);` 单独成句，返回值被丢弃，**结果没有交给 printf**，程序只会输出一个空行。

```asm
call	sum_array
mov	edx, eax
lea	rax, .LC0[rip]
mov	esi, edx
mov	rdi, rax
mov	eax, 0
call	printf@PLT
```

这里 call 完的返回值在 eax，然后将值暂存到 edx，再放到 esi，作为 printf 的第二个参数。然后将格式串放到第一个参数。

---

## 疑问点

1. `s += a[i]` 那里的汇编没看懂，询问 AI 给出的详细解释：

```asm
.L3:
	mov	eax, DWORD PTR -4[rbp]     ; eax = i
	cdqe                           ; 把 32 位 int 符号扩展成 64 位 rax
	lea	rdx, 0[0+rax*4]            ; rdx = i * 4      ← 元素宽度 4 在这里
	mov	rax, QWORD PTR -24[rbp]    ; rax = a（数组首地址）
	add	rax, rdx                   ; rax = a + i*4 = &a[i]
	mov	eax, DWORD PTR [rax]       ; eax = a[i]（读 4 字节）
	add	DWORD PTR -8[rbp], eax     ; s += a[i]（直接改内存）
	add	DWORD PTR -4[rbp], 1       ; i++
```

元素宽度 4，即 int，一个元素 4 字节。

2. 数组首地址是 rbp-32 吧，为什么这里是 rbp-24？

main 里数组的首地址是 rbp-32，但是这个地址传入函数后，存放到另一个栈帧里面。

---

## 出题问题

**Q1 ✓**

数组 `a[i]` 的地址是怎么算出来的？元素宽度体现在哪个常数上？

“通过首地址和偏移量，体现在 4”——完全正确。补一个完整表述：地址 = `a + i*4`，汇编分四步走完：`cdqe`（int→64 位）→ `lea rdx,[rax*4]`（乘 4）→ `add rax, rdx`（加首地址）→ `mov eax, [rax]`（按 4 字节读）。

**Q2 ◐ 半对：结论对，理由没答**

循环变量 `i` 存在寄存器里还是栈上？为什么 `-O0` 下多半在栈上？

栈上，`-4[rbp]`，没错。但问的是“为什么”，这才是这题的考点：

1. `-O0` 不做寄存器分配优化，寄存器只拿来在两条指令之间临时中转，不负责长期保管变量。
2. 每个具名变量固定分配一个栈槽，`gdb` 里 `p i` 随时能找到对应内存，调试信息才不会撒谎。

所以 `-O0` 的汇编里你会看到 `i` 被反复 `mov eax, -4[rbp]` 读出来、`add DWORD PTR -4[rbp], 1` 写回去，一轮循环进出内存各两次。

**Q3 ✓**

循环的“退出判断”用的是 `cmp` 还是 `test`？和源码的 `i < n` 对应关系是什么？

“`cmp`，用 `i - n`”对。补两点：

- 具体是 `jl`（有符号小于），不是 `jle`。源码 `i < n` 不含等号，`jl` 恰好不带 ZF 判断。
- 为什么必须用 `cmp` 而不是 `test`：`test` 只做按位与，只能判“是否为零 / 符号位”，**没有大小概念**；`i < n` 是减法比较，只能 `cmp`。
- 为什么不用 `sub`：`cmp` 只设标志、不写回结果，`i` 和 `n` 的值都保住了。

**Q4 ✗ 错了：累加变量 s 每次加完写回哪里？**

`s` 写回的是 **`-8[rbp]`**，不是 eax。看这三行的分工：

```asm
	mov	eax, DWORD PTR [rax]      ; eax = a[i]   ← 只是"端菜的盘子"
	add	DWORD PTR -8[rbp], eax    ; s += a[i]     ← s 的家在这，直接改内存
```

`eax` 在这条循环里只是搬运 `a[i]` 的临时容器，被反复覆盖；`s` 的仓库从始至终是 `-8[rbp]`。只有函数末尾 `mov eax, DWORD PTR -8[rbp]` 那一条，才把 `s` 搬进 `eax`——因为返回值约定放 `eax`，那是“出门前装车”，不是“`s` 住在 `eax`”。

**Q5：循环展开**

把 n 改成常量 6 再编译，看编译器有没有做循环展开。

循环展开（loop unrolling）= 编译器把循环体**复制 N 份**，让一次迭代处理 N 个元素，从而把“每 1 个元素付一次 `cmp`+`jne`+`add rdx`”摊薄成“每 N 个元素付一次”。

**正确答案是：没有展开。** 判据就是数循环体里 `add eax, ...` 的条数和 `add rdx, 4` 的步长——`-O0`/`-O2` 都是 1 条、步长 4；展开后才变成 8 条、步长 32。

**询问：-O0 是什么**

`-O` 是 Optimization（优化）的开关，`-O0` 表示**关闭所有优化**，也是 gcc 没指定时使用的默认级别。

---

就这样吧。
