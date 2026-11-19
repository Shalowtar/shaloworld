---
title: 'C 语言学习 · 日期换算'
summary: '实验课作业：日期转天数、天数反推日期。初版三个坑（if 里写 break、&& 和 || 混、没做范围校验），改完又踩到 scanf_s 残留换行让 fgets 读到空行。'
category: C
tags: ['C语言学习']
publishedAt: 2026-11-19T15:10:00+08:00
---

这是我们实验课的作业，要求是设计一个程序，根据用户的选择走两条路：

1. 日期转换成天数；
2. 指定年份和第几天，求出日期。

还要调用自己设计的函数，让程序给出正确的输出。于是开始写，初版找不到了，但问题我还记得。

## 初版的三个问题

1. 往 `if` 条件里面写一堆 `break`，`break` 不在循环和 `switch` 里面，然后输出不了；
2. `&&` 和 `||` 搞混了：`&&` 要两个都满足，`||` 是其中一个满足就行；
3. 没有做输入范围限制，超过正常的月份和日期也能跑。

## 修正版代码

```c
#include <stdio.h>
int z[13] = { 0,31,28,31,30,31,30,31,31,30,31,30,31 };
int date_0;
int month;

int date(int a1) // 传入年份，生成对应每个月的天数
{
	if ((a1 % 4 == 0 && a1 % 100 != 0) || a1 % 400 == 0)
	{
		z[2] = 29;
	}
	else
	{
		z[2] = 28;
	}
	return 0;
}

int calc(int a1, int a2) // 传入年份 a1，传入天数 a2
{
	int j = 1;
	int a = a2;
	while (a > z[j])
	{
		a -= z[j];
		j++;
	}
	month = j;
	date_0 = a;
	return 0;
}

int main()
{
	while (1)
	{
		int a; // 年份
		int b; // 月份
		int c; // 日期
		int d = 0;
		int e; // 天数
		int x; // 初始输入方向
		putchar('\n');
		printf("选择你想要做的计算\n1.月份日期转换成天数\n2.指定年份和第几天求出日期\n输入1或2进行选择\n");
		scanf_s("%d", &x);
		if (x != 1 && x != 2)
		{
			printf("只能输入1或2哦\n");
		}
		else
		{
			switch (x)
			{
			case(1):
				printf("请输入年份\n");
				scanf_s("%d", &a);
				if (a <= 0)
				{
					printf("你输入的年份有问题\n");
				}
				else
				{
					date(a);
					printf("请输入月份\n");
					scanf_s("%d", &b);
					if (b <= 0 || b >= 13)
					{
						printf("你输入的月份有问题\n");
					}
					else
					{
						printf("请输入日期\n");
						scanf_s("%d", &c);
						if (c <= 0 || c > z[b])
						{
							printf("你输入的日期有问题\n");
						}
						else
						{
							for (int i = 1;i < b;++i)
							{
								d += z[i];
							}
							e = d + c;
							printf("转换出的天数是%d", e);
						}
					}
				}
				break;
			case(2):
				printf("请输入年份\n");
				scanf_s("%d", &a);
				if (a <= 0)
				{
					printf("你输入的年份有问题\n");
					break;
				}
				else
				{
					date(a);
					printf("请输入天数\n");
					scanf_s("%d", &c);
					if ((a % 4 == 0 && a % 100 == 0) || a % 400 == 0)
					{
						if (c <= 0 || c > 366)
						{
							printf("你输入的天数不对");
							break;
						}
						else
						{
							calc(a, c);
							printf("现在是%d年%d月%d日\n", a, month, date_0);
						}
					}
					else
					{
						if (c <= 0 || c > 365)
						{
							printf("你输入的天数不对");
							break;
						}
						else
						{
							calc(a, c);
							printf("现在是%d年%d月%d日\n", a, month, date_0);
						}
					}
				}
				break;
			}
		}
		putchar('\n');
	}
	return 0;
}
```

**输出示例**

```text
选择你想要做的计算
1.月份日期转换成天数
2.指定年份和第几天求出日期
输入1或2进行选择
1
请输入年份
2026
请输入月份
11
请输入日期
19
转换出的天数是323

选择你想要做的计算
1.月份日期转换成天数
2.指定年份和第几天求出日期
输入1或2进行选择
2
请输入年份
2026
请输入天数
323
现在是2026年11月19日
```

## 不是数字就死循环

其实还有问题：如果输入的字符不是数，就会一直循环打印。

我试过加条件判断，都没能解决。问 AI，才知道要用 `fgets` 加 `sscanf`。

思路是**一次读一整行**，再从这一行里解析数字，脏字符不会遗留到下一次。

## 再改版

但跑路线 2 的时候又出了问题：

```text
输入1或2进行选择
2
请输入年份
2026
请输入天数
323
现在是2026年11月19日


选择你想要做的计算
1.月份日期转换成天数
2.指定年份和第几天求出日期
输入1或2进行选择
不是数字，请重新输入

选择你想要做的计算
1.月份日期转换成天数
2.指定年份和第几天求出日期
输入1或2进行选择
这是怎么回事
```

原因：`scanf_s("%d", &c)` 读到 `323` 就停住，`323` 后面的 `\n` 也留在缓冲区。

程序算完回到菜单，`fgets` 一调用就立刻读到缓冲区里那个残留的 `\n`，它以为这是一行空输入；`sscanf` 在空行里找不到数字，返回 0，于是打印“不是数字，请重新输入”，`continue` 又回菜单。

```c
#include <stdio.h>

int z[13] = { 0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
int date_0;
int month;

int date(int a1)                     /* 传入年份，生成对应每个月的天数 */
{
    if ((a1 % 4 == 0 && a1 % 100 != 0) || a1 % 400 == 0)
    {
        z[2] = 29;
    }
    else
    {
        z[2] = 28;
    }
    return 0;
}

int calc(int a1, int a2)             /* 传入年份 a1，传入天数 a2 */
{
    int j = 1;
    int a = a2;
    while (a > z[j])
    {
        a -= z[j];
        j++;
    }
    month = j;
    date_0 = a;
    return 0;
}

int main()
{
    while (1)
    {
        int a;                       /* 年份 */
        int b;                       /* 月份 */
        int c;                       /* 日期 */
        int d = 0;
        int e;                       /* 天数 */
        int x;                       /* 初始输入方向 */
        char line[64];

        putchar('\n');
        printf("选择你想要做的计算\n1.月份日期转换成天数\n2.指定年份和第几天求出日期\n输入1或2进行选择\n");

        if (fgets(line, sizeof line, stdin) == NULL)        /* 输入结束 / EOF */
            return 1;

        if (sscanf_s(line, "%d", &x) != 1)
        {
            printf("不是数字，请重新输入\n");
            continue;
        }

        if (x != 1 && x != 2)
        {
            printf("只能输入1或2哦\n");
            continue;
        }
        else
        {
            switch (x)
            {
            case 1:
                printf("请输入年份\n");
                scanf_s("%d", &a);
                if (a <= 0)
                {
                    printf("你输入的年份有问题\n");
                }
                else
                {
                    date(a);
                    printf("请输入月份\n");
                    scanf_s("%d", &b);
                    if (b <= 0 || b >= 13)
                    {
                        printf("你输入的月份有问题\n");
                    }
                    else
                    {
                        printf("请输入日期\n");
                        scanf_s("%d", &c);
                        if (c <= 0 || c > z[b])
                        {
                            printf("你输入的日期有问题\n");
                        }
                        else
                        {
                            for (int i = 1; i < b; ++i)
                            {
                                d += z[i];
                            }
                            e = d + c;
                            printf("转换出的天数是%d", e);
                        }
                    }
                }
                break;

            case 2:
                printf("请输入年份\n");
                scanf_s("%d", &a);
                if (a <= 0)
                {
                    printf("你输入的年份有问题\n");
                }
                else
                {
                    date(a);
                    printf("请输入天数\n");
                    scanf_s("%d", &c);
                    {
                        int ch;
                        while ((ch = getchar()) != '\n' && ch != EOF) {}
                    }
                    if ((a % 4 == 0 && a % 100 != 0) || a % 400 == 0)
                    {
                        if (c <= 0 || c > 366)
                        {
                            printf("你输入的天数不对");
                        }
                        else
                        {
                            calc(a, c);
                            printf("现在是%d年%d月%d日\n", a, month, date_0);
                        }
                    }
                    else
                    {
                        if (c <= 0 || c > 365)
                        {
                            printf("你输入的天数不对");
                        }
                        else
                        {
                            calc(a, c);
                            printf("现在是%d年%d月%d日\n", a, month, date_0);
                        }
                    }
                }
                break;
            }
        }

        putchar('\n');
    }
    return 0;
}
```

累了。
