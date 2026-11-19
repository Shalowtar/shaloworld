---
title: 'C 语言练习 · Switch-case'
summary: '用 switch-case 替代一串 if 判断，第一次忘了写 break 看到 case 一路穿透，补上 break 和 while 循环后程序能连续读数。'
category: C
tags: ['C语言学习']
publishedAt: 2026-11-19T11:30:00+08:00
---

这次来学习和练习 `switch-case` 语句：先把一串区间判断压成一个整数 `a`，再让 `switch` 按 `a` 的值分路输出。

## 第一版

```c
#include <stdio.h>
int main()
{
	int x;
	int a;
	printf("Input your number:\n");
	if (scanf_s("%d", &x) == 1 && x < 100 && x > -100)
	{
		if (x > 0 && x < 50)
		{
			a = 1;
		}
		else if (x >= 50 && x < 100)
		{
			a = 2;
		}
		else if (x < 0 && x > -50)
		{
			a = 3;
		}
		else if (x <= -50 && x > -100)
		{
			a = 4;
		}
		else
		{
			a = 0;
		}
		switch (a)
		{
		case 0:printf("wow\n");
		case 1:printf("1\n");
		case 2:printf("2\n");
		case 3:printf("3\n");
		case 4:printf("4\n");
		}
	}
	return 0;
}
```

**输出**

```text
Input your number:
2
1
2
3
4
```

输入 2 落在 1 那一档，结果从 `1` 一直打印到 `4`。原因是每个 `case` 后面少了 `break`：`switch` 匹配到 `case 1` 后只决定从哪一行开始执行，并不会自动停下，会继续往下依次执行后面的 `case`，这就是常说的 **case 穿透（fall-through）**。

## 最终代码

补上 `break`，又在每个分支后加了 `putchar('\n')` 让输出分行，最后套一层 `while (1)`，让程序算完一轮还能继续读下一个数，顺便回顾前面的循环和 `continue`。

```c
#include <stdio.h>
int main()
{
	int x;
	int a;
	while (1) {
		printf("Input your number:\n");
		if (scanf_s("%d", &x) == 1 && x < 100 && x > -100)
		{
			if (x > 0 && x < 50)
			{
				a = 1;
			}
			else if (x >= 50 && x < 100)
			{
				a = 2;
			}
			else if (x < 0 && x > -50)
			{
				a = 3;
			}
			else if (x <= -50 && x > -100)
			{
				a = 4;
			}
			else
			{
				a = 0;
			}
			printf("The output is:");
			switch (a)
			{
			case 0:printf("wow\n");
				putchar('\n');
				break;
			case 1:printf("1\n");
				putchar('\n');
				break;
			case 2:printf("2\n");
				putchar('\n');
				break;
			case 3:printf("3\n");
				putchar('\n');
				break;
			case 4:printf("4\n");
				putchar('\n');
				break;
			}
			continue;
		}
		else
		{
			printf("Your input is out the limition.\n");
			continue;
		}
	}
	return 0;
}
```

**输出**

```text
Input your number:
0
The output is:wow

Input your number:
1
The output is:1

Input your number:
51
The output is:2

Input your number:
-1
The output is:3

Input your number:
-51
The output is:4
```

就这样吧。
