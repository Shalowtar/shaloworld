---
title: 'C 语言练习 · 随便写的猜数字'
summary: '第一次用 rand 和 srand 写了个猜幸运数字的小程序，顺便踩了“忘记播种”的坑。'
category: Misc
tags: ['C语言学习']
publishedAt: 2026-11-18T22:00:00+08:00
---

随便写的 C 代码，练习一下。

第一次使用随机数，代码如下。

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
int main()
{
	int x;
	printf("Input your lucky number:\n");
	srand((unsigned int)time(NULL));
	int a = rand();
	a = a % 100 + 1;
	if (scanf_s("%d", &x) == 1)
	{
		printf("I think the lucky number is %d\n", a);
		if (x == a)
		{
			printf("Wow,your number is the lucky number too,amazing!\n");
		}
		else
		{
			printf("Your lucky number is %d,though it's not as same as mine,it's lucky,too!\n", x);
		}
	}
	else
	{
		printf("Please just input one,thanks.\n");
	}
	return 0;
}
```

**输出如下，随便填了一个数**

```text
Input your lucky number:
7
I think the lucky number is 71
Your lucky number is 7,though it's not as same as mine,it's lucky,too!
```

第一次忘记设置随机种子了。。。不播种的话 `rand()` 每次都从同一个起点开始，同一个程序连跑几次，出来的“幸运数字”是一模一样的。

---

### 总结

不知道总结什么。
