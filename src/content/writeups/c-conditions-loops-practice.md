---
title: 'C 语言练习二 · 条件和循环'
summary: '练条件和循环的一版小程序：中途踩到 scanf_s 用 %d 去读 long long 的坑，最后自己把反复输入的循环改通了。'
category: C
tags: ['C语言学习']
publishedAt: 2026-11-19T00:05:00+08:00
---

本来随便写的，练练条件和循环。

## 第一版

```c
#include <stdio.h>

int main()
{
	printf("请输入你想到的一个数。\n");
	long long x;
	if (scanf_s("%d", &x) == 1)
	{
		if (x >= 0)
		{
			for (int i = 0;i <= x % 100 + 1;i++)
			{
				if (x >= 10 && x < 100)
				{
					printf("这是：\n");
					putchar('*');
					putchar(' ');
					putchar('-');
					putchar('\n');
				}
				else
				{
					long long y = (((x ^ i - 1) >> 3) + ((x ^ i + 1) << 3)) << 5;
					printf("你说啥%d\n", y);
				}
			}
		}
		else if (x < 0)
		{
			for (int i = 0;i <= (-x) % 100 + 1;i++)
			{
				if (x <= -10 && x > -100)
				{
					printf("这是：\n");
					putchar('-');
					putchar(' ');
					putchar('*');
					putchar('\n');
					printf("What\n");
				}
				else
				{
					long long y = 13 * (((x ^ i - 1) >> 3) + ((x ^ i + 1) << 3)) << 5;
					printf("你说啥%d\n", y);
				}
			}
		}
	}
	else
	{
		printf("只能输入一个数哦！");
	}
	return 0;
}
```

但是输出和我预期的不太一样，没有打印“这是”，全是“你说啥”。

## 找问题

```text
scanf_s("%d",&x)，期望是 long long，但是 %d 是 int，取的 x 值不是输入的值
```

`%d` 只读 4 个字节，而 `x` 是 8 个字节的 `long long`，高位没被写进去，后面所有判断和移位就全乱了。改成 `%lld` 才对。

---

## 改成能反复输入

本来是想让程序不直接退出，能够输入一个后再输入。

但是 AI 给的方案没能解决，反而带来了新的问题。

所以自己改代码，在每个大条件判断后面加上了换行和 `continue`，然后就实现了这个想法。

### 下面是最终代码

```c
#include <stdio.h>
int main()
{
	long long x;
	while (1)
	{
		printf("请输入你想到的一个数。\n");
		if (scanf_s("%lld", &x) == 1)
		{
			if (x >= 0)
			{
				printf("请看下面：\n");
				for (int i = 0;i <= x % 100 + 1;i++)
				{
					if (x < 50 && x >= 0)
					{

						for (int j = 0;j < x;j++)
						{
							putchar('*');
							putchar(' ');
							putchar('-');
						}
					}
					else
					{
						long long y = (((x ^ i - 1) >> 3) + ((x ^ i + 1) << 3)) << 5;
						printf("你说啥啊，是不是%lld\n", y);
					}
				}
			}
			else if (x < 0)
			{
				printf("请看下面：\n");
				for (int i = 0;i <= (-x) % 100 + 1;i++)
				{
					if (x <= 0 && x > -50)
					{
						for (int j = 0;j <= -x;j++)
						{
							putchar('-');
							putchar(' ');
							putchar('*');
							printf("What");
						}
						putchar('\n');
					}
					else
					{
						long long y = 13 * (((x ^ i - 1) >> 3) + ((x ^ i + 1) << 3)) << 5;
						printf("你说啥啊，是不是%lld\n", y);
					}
				}
			}
			putchar('\n');
			continue;
		}
		else
		{
			printf("只能输入一个数哦！");
			putchar('\n');
			continue;
		}
	}
	return 0;
}
```

**输出示例**

```text
请输入你想到的一个数。
1
请看下面：
* -* -* -
请输入你想到的一个数。
-1
请看下面：
- *What- *What
- *What- *What
- *What- *What

请输入你想到的一个数。
51
请看下面：
你说啥啊，是不是12576
你说啥啊，是不是12736
你说啥啊，是不是12480
......
```

就这样吧，睡了。
