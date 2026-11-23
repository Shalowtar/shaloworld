---
title: 'SparkCTF week3 · tiwate'
summary: 'SparkCTF w3 的 tiwate：核心是控制流平坦化，顺着 case 的出口和来源倒推，弄清 24 字节分组矩阵变换后再写逆变换。'
category: Reverse
subcategories: ['SparkCTF2026', 'week3']
event: SparkCTF
tags: ['逆向', 'C语言', 'SparkCTF2026']
tools: ['IDA']
publishedAt: 2026-11-23T10:30:00+08:00
---

原本想来复现一下这道题，但是我发现这里面有被我忽略的点——控制流平坦化。当时新生赛时，这一段控制流平坦化的代码是直接让 AI 给我看的，然后没有多加注意，也没有去思考相关的问题。现在来思考这道题，然后再去对控制流平坦化的处理方法进行进一步了解。

## 文件侦察

——直接过了。

这道题考点就是控制流平坦化，然后核心代码段也很好定位。

然后我对有些函数进行了命名（随便命的）。

## 代码分析

```c
int __fastcall aaa(int argc, const char **argv, const char **envp)
{
  _BYTE v4[32]; // [rsp+20h] [rbp-20h] BYREF

  scanf(Format: *(const char *const *)&argc, argv, envp);
  printf(Format: "Akasha dispatch terminal:");
  if ( (unsigned int)rule(a1: v4) != 0 && (unsigned int)encrypto(a1: (__int64)v4) != 0 )
    printf(Format: "Commission cleared. No more smart overtime.");
  else
    printf(Format: "Complete workflow, incorrect state order.");
  return 0;
}
```

`rule` 依旧是要求 `flag{24字节}`。

然后是主加密代码：

```c
 n5 = 0;
  v23 = 0;
  v22 = 0;
  v21 = 0;
  for ( i = 0; i <= 11; ++i )
  {
    v1 = rand() << 16;
    dword_1400190A0[i] = (-1640531527 * i) ^ rand() ^ v1;
  }
  v2 = check(a1: dword_1400190A0[0]);
  while ( 2 )
  {
    switch ( v2 )
    {
      case 0LL:
        for ( j = 0; j <= 23; ++j )
          *((_BYTE *)&v15[24] + j) = *(_BYTE *)(byte_140014070[j] + a1);
        n5 = 0;
        v5 = chose(a1: 0, a2: 0);
        v2 = check(a1: v5);
        continue;
      case 1LL:
        v6 = chose(a1: 1, a2: n5 <= 5);
        v2 = check(a1: v6);
        continue;
      case 2LL:
        for ( k = 0; k <= 3; ++k )
        {
          v17 = word_1400140C0[4 * n5 + k];
          for ( m = 0; m <= 3; ++m )
            v17 += word_1400140A0[4 * k + m] * *((unsigned __int8 *)&v15[2 * n5 + 24] + m);
          v15[4 * n5 + k] = v17 % 0x101;
        }
        v7 = chose(a1: 2, a2: 0);
        v2 = check(a1: v7);
        continue;
      case 3LL:
        v21 ^= (unsigned __int16)v15[4 * n5] ^ (157 * n5);
        v8 = chose(a1: 3, a2: v21 & 1);
        v2 = check(a1: v8);
        continue;
      case 4LL:
        ++n5;
        v9 = chose(a1: 4, a2: 0);
        v2 = check(a1: v9);
        continue;
      case 5LL:
        v23 = 0;
        v10 = chose(a1: 5, a2: 0);
        v2 = check(a1: v10);
        continue;
      case 6LL:
        if ( v15[v23] == aYmGec1[v23] )
          v3 = chose(a1: 6, a2: 1u);
        else
          v3 = chose(a1: 6, a2: 0);
        v2 = check(a1: v3);
        continue;
      case 7LL:
        if ( (unsigned int)++v23 > 0x17 )
          v11 = chose(a1: 7, a2: 1u);
        else
          v11 = chose(a1: 7, a2: 0);
        v2 = check(a1: v11);
        continue;
      case 8LL:
        v22 = 1;
        v12 = chose(a1: 8, a2: 0);
        v2 = check(a1: v12);
        continue;
      case 9LL:
        v22 = 0;
        v13 = chose(a1: 9, a2: 0);
        v2 = check(a1: v13);
        continue;
      case 10LL:
        result = v22;
        break;
      case 11LL:
        v21 ^= 0x13579BDFu;
        v14 = chose(a1: 11, a2: v21 & 1);
        v2 = check(a1: v14);
        continue;
      default:
        result = 0;
        break;
    }
    return result;
  }
```

可以看到一堆 `switch` 和 `case`（当时看不懂，让 AI 过了，自己确实是走马观花了，没认真看）。

然后是 `chose` 和 `check`：

```c
_int64 __fastcall chose(int a1, unsigned int a2)
{
  dword_1400190D0 ^= rand();
  return (unsigned int)dword_1400190A0[byte_140014140[3 * a1 + a2 % 3]];
}
```

```c
__int64 __fastcall check(int a1)
{
  unsigned int i; // [rsp+Ch] [rbp-4h]

  for ( i = 0; i <= 0xB; ++i )
  {
    if ( a1 == dword_1400190A0[i] )
      return i;
  }
  return 11;
 }
```

以及这里面要用到的数据：

```text
byte_140014140 01 01 01 05 02 02 03 03 03 04 04 04 01 01 01 06
06 06 09 07 07 06 08 08  0A 0A 0A 0A 0A 0A 0A 0A
0A 0A 0A 0A
```

```text
byte_140014070 
db 07 0C 11 16 03 08 0D 12 17 04 09 0E 13 00 05 0A 0F 14 01 06 0B 10 15 02
word_1400140A0 
dw 2, 1, 2 dup(0), 3 dup(1), 2 dup(0), 3 dup(1), 2 dup(0), 1, 2
word_1400140C0 
dw 1, 4, 7, 0Ah, 0Ch, 0Fh, 12h, 15h, 17h, 1Ah, 1Dh, 20h, 22h, 25h, 28h 2Bh, 2Dh, 30h, 33h, 36h, 38h, 3Bh, 3Eh, 41h, 8 dup(0)
aYmGec1 
dd 1B001Ah 55005Ch 7A0064h 55007Fh 240027h 660027h 7D0071h 89h
```

至于 `dword_1400190A0`：

```c
for ( i = 0; i <= 11; ++i )
{
  v1 = rand() << 16;
  dword_1400190A0[i] = (-1640531527 * i) ^ rand() ^ v1;
}
```

## 顺着 case 倒推

在那些 `case` 里面，能够看到一些算法，而在其他无用 `case` 里面，基本上没有类似的代码，能够猜测真正要用上的代码。然后我从正确返回倒着去看这个逻辑。

首先，看能返回和结束的位置：

```c
case 10LL:
  result = v22;
  break;
default:
  result = 0;
  break;
}
return result;
```

那么很明了，需要走 `case 10`。

然后看 `v22`：

```c
case 8LL:
  v22 = 1;
  v12 = chose(a1: 8, a2: 0);
  v2 = check(a1: v12);
  continue;
case 9LL:
  v22 = 0;
  v13 = chose(a1: 9, a2: 0);
  v2 = check(a1: v13);
  continue;
```

则需要走 `case 8`，并且 `case 8` 里面，`v12` 为 `dA0[10]`，`v2` 为 10，跳转到 `case 10`，逻辑符合。则我们需要看怎么到 `case 8`，在 `b140` 里面找到对应为 8 的位置为 22 和 23，而 `chose` 里面选择的是：

```c
3 * a1 + a2 % 3
```

那么需要 `a1=7`。

找到对应 `a1=7` 的 `case 7`：

```c
case 7LL:
  if ( (unsigned int)++v23 > 0x17 )
    v11 = chose(a1: 7, a2: 1u);
  else
    v11 = chose(a1: 7, a2: 0);
  v2 = check(a1: v11);
  continue;
```

分析一下，可以知道，`case 7` 会判断 `v23` 和 `0x17` 的大小，然后跳转 `case 6` 或 `case 8`。

```c
case 6LL:
  if ( v15[v23] == aYmGec1[v23] )
    v3 = chose(a1: 6, a2: 1u);
  else
    v3 = chose(a1: 6, a2: 0);
  v2 = check(a1: v3);
  continue;
```

分析 `case 6`，结合 `case 7`，这两个 `case` 在共同作用，对 `v15` 和 `aYmGec1` 标准数组逐字节比较，相等则跳转 `case 7` 继续比较，直到 24 字节全部比较完；不等，`case 6` 直接跳到 `case 9`，将 `v22` 赋为 0 后跳转到 `case 10`，直接就判定失败。

所以需要 `v15` 和标准数组逐字节相等。

接下来分析 `v15` 是怎么得来的，相关代码：

```c
case 0LL:
  for ( j = 0; j <= 23; ++j )
    *((_BYTE *)&v15[24] + j) = *(_BYTE *)(byte_140014070[j] + a1);
case 2LL:
  for ( k = 0; k <= 3; ++k )
  {
    v17 = word_1400140C0[4 * n5 + k];
    for ( m = 0; m <= 3; ++m )
      v17 += word_1400140A0[4 * k + m] * *((unsigned __int8 *)&v15[2 * n5 + 24] + m);
    v15[4 * n5 + k] = v17 % 0x101;
  }
```

可以看到，在对 `v15` 处理时还用到了 `n5`，再看 `n5`：

```c
case 0LL:
  n5 = 0;
case 1LL:
  v6 = chose(a1: 1, a2: n5 <= 5);
  v2 = check(a1: v6);
case 4LL:
  ++n5;
  v9 = chose(a1: 4, a2: 0);
  v2 = check(a1: v9);
  continue;
```

`case 1`，如果 `n5<=5`，传入 1，跳转到 `case 2`；否则传入 0，跳转到 `case 5`，再通过 `case 5` 跳转到 `case 6` 进行比较。

进入 `case 2`，最后跳转到 `case 3`，然后跳转到 `case 4`，`case 4` 之后又跳转到 `case 1`。

那么上面就形成了一个循环，循环 6 次（`n5=0; n5<=5; ++n5`）。

在这个循环内，先经过 `case 2` 的算法，再经过 `case 3` 的算法。

在循环外面，还有两个，但是根本用不到 `dA0` 的值，只是用下标：

```c
// 最外面
for ( i = 0; i <= 11; ++i )
{
  v1 = rand() << 16;
  dword_1400190A0[i] = (-1640531527 * i) ^ rand() ^ v1;
}
// case 0
for ( j = 0; j <= 23; ++j )
  *((_BYTE *)&v15[24] + j) = *(_BYTE *)(byte_140014070[j] + a1);
n5 = 0;
```

好了，现在关键信息均已分析全，可以开始写解密代码了。

## 写解密代码

写着写着，发现我处理不了：

```c
a0[4 * i + k] = x % 0x101
```

不会写这个的逆变换，只能请教一下 AI 了，后面专门去看看这个，现在看不下去了——晕。

```c
#include <stdio.h>
#include <stdint.h>
int x;
unsigned char a0[24];
unsigned char a1[24];
unsigned int v21;
unsigned char b70[24] = 
{ 0x07,0x0C,0x11,0x16,0x03,0x08,0x0D,0x12,
  0x17,0x04,0x09,0x0E,0x13,0x00,0x05,0x0A,
  0x0F,0x14,0x01,0x06,0x0B,0x10,0x15,0x02 };
unsigned char wC0[24] =
{ 0x01,0x04,0x07,0x0A,0x0C,0x0F,0x12,0x15,
  0x17,0x1A,0x1D,0x20,0x22,0x25,0x28,0x2B,
  0x2D,0x30,0x33,0x36,0x38,0x3B,0x3E,0x41 };
unsigned char wA0[16] =
{ 0x02,0x01,0x00,0x00,0x01,0x01,0x01,0x00,
  0x00,0x01,0x01,0x01,0x00,0x00,0x01,0x02 };
unsigned char st[24] =
{ 0x59,0x4D,0x3E,0x2F,0x47,0x45,0x43,0x31,
  0x26,0x1A,0x1B,0x5C,0x55,0x64,0x7A,0x7F,
  0x55,0x27,0x24,0x27,0x66,0x71,0x7D,0x89 };
static const int invA[4][4] =
{ {86,86,85,86},{86,85,87,85},{85,87,85,86},{86,85,86,86} };
void encrypto() 
{
	for (int j = 0;j <= 23;++j) 
	{
		a0[j] = a1[b70[j]];
	}
	for (int i = 0;i <= 5;i++) 
	{
		for (int k = 0; k <= 3; ++k)
		{
			x = wC0[4 * i + k];
			for (int m = 0; m <= 3; ++m)
				x += wA0[4 * k + m] * a0[4*i+m];
			a0[4 * i + k] = x % 0x101;
		}
	}
}
void decrypto() 
{
	for (int i = 0;i <= 5;i++)
	{
		for (int k = 0;k <= 3;++k) 
		{
			x = 0;
			for (int m = 0; m <= 3; ++m)
				x += invA[k][m] * ((int)st[4 * i + m] - (int)wC0[4 * i + m]);
			x %= 0x101;
			if (x < 0) x += 0x101;
			a0[4 * i + k] = (unsigned char)x;
		}
	}
	for (int j = 0;j <= 23;++j) 
	{
		a1[b70[j]] = a0[j];
	}
}
int main() 
{
	decrypto();
	printf("flag{");
	for (int i = 0;i <= 23;++i) 
	{
		putchar(a1[i]);
	}
	printf("}\n");
	return 0;
}
```

## 输出

```text
flag{r4nd0m_states_need_a_map}
```

## 总结

一步步分析了控制流。对于这种类型的问题：

1. 找出口
2. 追来源

现在只能做到静态分析，动态分析还做不到。

还有一些工具和插件能反平坦化，还有一个 dump 转移表的，通过 IDAPython 进行。

---

先就这样吧。
