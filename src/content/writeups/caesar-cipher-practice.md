---
title: '密码学学习——恺撒密码'
summary: '用 C 手写恺撒密码：把字母表整体平移 k 位，顺手踩了数组越界、%s 的宽度限制和取模回绕三个坑。'
category: 密码学
tags: ['密码学', 'C语言学习']
publishedAt: 2026-11-19T11:00:00+08:00
---

了解到古典密码里最简单的恺撒密码：把每个字母在字母表上向后移动固定的位数，位移量 `k` 就是密钥，反向移动同样的位数就是解密。于是想自己写一遍加密程序。

## 第一版

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>

char x[12];
int k;
char y[12];

int crypto(char *x, int k)
{
	k = k % 26;
	for (int i = 0; x[i] != '\0'; i++)
	{
		y[i] = x[i] + k;
	}
	y[strlen(x)] = '\0';
	return 0;
}

int main()
{
	printf("1.\n");
	scanf_s("%11s", x, 12);
	printf("w.\n");
	scanf_s("%d", &k);
	crypto(x, k);
	int z = strlen(y);
	for (int i = 0; i < z; i++)
	{
		putchar(y[i]);
	}
	putchar('\n');
	return 0;
}
```

这是改过之后的版本，最开始还有三处问题，直接导致运行异常：

1. `x` 是数组，写 `&x` 时取到的是整个数组的地址，类型是 `char (*)[12]`，和 `%s` 要求的 `char *` 对不上；数组名本身就会退化成指向首元素的指针，直接写 `x` 才对。
2. 一开始写的是 `%c`，它只读一个字符；要读一串字符得用 `%s`。宽度写成 `%11s`，表示最多读 11 个字符，给结尾的 `\0` 留一个字节。
3. `scanf_s` 读 `%s` 时要求额外传缓冲区容量，所以补上 `12`。注意这里的 `11` 和 `12` 不是一回事：`11` 是最大读取宽度，`12` 是 `scanf_s` 用来做边界检查的缓冲区大小，正好等于 `char x[12]` 的字节数。

## 第二版

第一版只是把字符的 ASCII 码整体加 `k`，没有在字母表内回绕，于是会出现这样的结果：

```text
1.
xyz
w.
1
yz{
```

`z` 加 1 之后越过了 `z`，落到 ASCII 表里紧跟在 `z` 后面的 `{`；位移量再大一些，还会掉进不可打印字符的区间。

所以要改两处：

1. 先判断字符是不是英文字母。只有 `A-Z` 和 `a-z` 参与位移，数字、空格、标点这些非字母字符原样保留，否则标点也会被一起挪走。
2. 位移结果用取模拉回 `0-25`，再贴回字母起点，这样 `z` 往后一位能回到 `a`，字母表首尾就接上了。

```c
if (x[i] >= 'A' && x[i] <= 'Z')
{
	y[i] = (x[i] - 'A' + k) % 26 + 'A';
}
else if (x[i] >= 'a' && x[i] <= 'z')
{
	y[i] = (x[i] - 'a' + k) % 26 + 'a';
}
else
{
	y[i] = x[i];
}
```

### 修改后的代码

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>

char x[27];
int k;
char y[27];

int crypto(char *x, int k)
{
	k = k % 26;
	for (int i = 0; x[i] != '\0'; i++)
	{
		if (x[i] >= 'A' && x[i] <= 'Z')
		{
			y[i] = (x[i] - 'A' + k) % 26 + 'A';
		}
		else if (x[i] >= 'a' && x[i] <= 'z')
		{
			y[i] = (x[i] - 'a' + k) % 26 + 'a';
		}
		else
		{
			y[i] = x[i];
		}
	}
	y[strlen(x)] = '\0';
	return 0;
}

int main()
{
	printf("Put your string:\n");
	scanf_s("%26s", x, 27);
	if (strlen(x) <= 27 && strlen(x) >= 1)
	{
		printf("Put your number:\n");
		scanf_s("%d", &k);
		crypto(x, k);
		int z = strlen(y);
		printf("The out put is:\n");
		for (int i = 0; i < z; i++)
		{
			putchar(y[i]);
		}
		putchar('\n');
	}
	else
	{
		printf("Your input is out the limition.");
	}
	return 0;
}
```

**输出**

```text
Put your string:
abc123
Put your number:
3
The out put is:
def123
```

这里的长度判断写在读入之后，只能算事后检查，拦不住已经发生的越界；真正防止写穿数组的是 `%26s` 这个宽度限制，加上 `char x[27]` 刚好容纳 26 个字符和结尾的 `\0`。

## 总结

对一个问题的考虑还是不全面：输入超过缓冲区长度时，多出来的字符会写到数组外面，也就是数组越界（缓冲区溢出），而不是“输出溢出”——输出本身没有超出范围的问题，漏考虑的是输入长度。

对 `scanf` 和 `scanf_s` 的掌握也不够熟练：转换说明（`%c` 和 `%s` 的区别）、宽度限制、`scanf_s` 要求的缓冲区容量参数，这三样以前是混着用的。

其他的还没想好，先就这样吧。
