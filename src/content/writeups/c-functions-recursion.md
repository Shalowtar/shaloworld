---
title: 'C 语言学习——函数'
summary: '练习函数设计与调用，用阶乘对比递归和迭代：递归沿调用栈展开后逐层回溯，迭代在单个函数帧里原地累乘，并加了输入范围保护。'
category: C
subcategories: ['学习']
tags: ['C语言', '函数']
publishedAt: 2026-11-21T16:40:00+08:00
---

学习函数设计，调用。

## 递归和迭代

```c
#include <stdio.h>
int calc(int n) //递归
{
	if (n <= 1)
		return 1;
	return (unsigned long long)n * calc(n - 1);
}
int calc_1(int n) //迭代
{
	int r=1;
	for (int i = 2;i <= n;++i) 
	{
		r *= i;
	}
	return r;
}
int main() 
{
	int x;
	printf("Input your number\n");
	if (scanf_s("%d", &x) != 1 || x <= 0 || x > 30) 
	{
		printf("Your input is wrong or too heavy\n");
	}
	else 
	{
		printf("\n你的输入是%d,现在计算%d!\n", x, x);
		printf("递归：\n%d!=%d\n", x, calc(x));
		printf("迭代：\n%d!=%d\n", x, calc_1(x));
	}
	return 0;
}
```

输出：

```text
Input your number
6

你的输入是6,现在计算6!
递归：
6!=720
迭代：
6!=720
```

误输入保护：

```text
Input your number
x
Your input is wrong or too heavy
Input your number
-3
Your input is wrong or too heavy
```

另一种迭代：

```c
int calc_1(int n)
{
	int r = n;
	for (int i = n-1;i > 1;--i)
	{
		r *= i;
	}
	return r;
}
```

## 查了一下

递归：在**调用栈**上展开，n 层调用帧，返回时逐层「回溯」相乘。

迭代：在**一个函数帧**里，用一个变量 `r` 原地累乘，n 次循环。

---

就这样吧。
