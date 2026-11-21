---
title: 'C 语言练习——函数 · 汉诺塔'
summary: '先用非递归方式硬搬汉诺塔，忘了小盘必须压大盘；改用递归后，按“n-1 到 B、n 到 C、n-1 到 C”三步完成。'
category: C
subcategories: ['练习']
tags: ['C语言', '函数', '递归']
publishedAt: 2026-11-21T17:30:00+08:00
---

这次来写选做——汉诺塔。

懒得介绍了。

没看题目，也没注意汉诺塔规则要求，简单地就……

错误示范，请模仿：

```c
#include <stdio.h>
int n;
int A = n;
int B = 0;
int C = 0;
void tran() 
{
	for (int i = 1;i <n;i++) 
	{
		int x = i;
		printf("A->B,%d\n", x);
	}
	printf("A现在有1个,为%d\nB现在有%d个,从上倒下依次为%d-1\nC现在有0个\n", n, n - 1, n - 1);
	printf("\nA->C,%d\n",n);
	printf("A现在有0个\nB现在有%d个,从上倒下依次为%d-1\nC现在有1个,为%d\n\n", n-1, n-1,n);
	for (int j = n-1;j >=1;j--) 
	{
		int x = j;
		printf("B->C,%d\n", x);
	}
}
int main()
{
	printf("input number\n");
	if (scanf_s("%d", &n) != 1 || n <= 0)
	{
		printf("input wrong\n");
	}
	else 
	{
		printf("\n根据你的输入：\n");
		printf("A现在有%d个，从上到下依次标为1-%d\nB现在有0个\nC现在有0个\n\n", n, n);
		tran();
		printf("现在已经将A的%d个全部按从下到上的顺序放到了C\n", n);
		printf("A现在有0个\nB现在有0个\nC现在有%d个,从上到下依次为1-%d\n", n, n);
	}
	return 0;
}
```

我想的是将各个盘从上到下标记为 1 到 n，然后通过代号放到 B、C，但是我忘了一点，就是小盘必须压大盘，所以上面是错误的。

## 递归解法

好吧，用递归：

```c
#include <stdio.h>
void calc(int n, char from, char mid, char to) 
{
	if (n == 1) 
	{
		printf("第%d个从%c->%c\n", n, from, to);
		return;
	}
	calc(n - 1, from/*A*/, to/*C*/, mid/*B*/);
	printf("第%d个从%c->%c\n", n, from/*A*/, to/*C*/);
	calc(n - 1, mid/*B*/, from/*A*/, to/*C*/);
}
int main() 
{
	int n;
	printf("请输入个数n\n");
	if (scanf_s("%d", &n) != 1 || n < 1 || n>50) 
	{
		printf("输入不对或者太大了");
		return 1;
	}
	printf("\n搬运过程：\n");
	calc(n, 'A', 'B', 'C');
	return 0;
}
```

## 思路

主要还是在：

```text
n-1 从 A 到 B
n   从 A 到 C
n-1 从 B 到 C
```

然后每一轮都是这个逻辑：先将上一个放到 B，再将本轮放到 C，最后将上一个放到 C。

每一轮都重复此操作，通过递归实现全部搬运。

---

现就这样吧。
