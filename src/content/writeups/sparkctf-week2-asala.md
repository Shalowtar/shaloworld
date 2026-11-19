---
title: 'SparkCTF week2 · asala'
summary: 'UPX 脱壳后进 IDA，逆一个 24 字节的异或加密；第一版跑出乱码，问题出在抄数据时的字节顺序，不是下标。'
category: Reverse
event: SparkCTF
tags: ['逆向', 'C语言学习', 'SparkCTF2026']
tools: ['IDA', 'UPX', 'DIE']
publishedAt: 2026-11-19T14:40:00+08:00
---

这是新生赛里的 w2 题，当时依旧是全靠 AI；现在重做复现。

## 侦察文件

先用 DIE 看一眼：

```text
(Heur) Language: C/C++
(Heur) Protection: Generic [Section #0 ("UPX0") has RWX + IAT directory empty]
Packer: UPX (4.24) [NRV, brute]
```

`UPX0` 段 RWX、IAT 为空，是 UPX 加壳的典型特征，所以先脱壳。我习惯用 WSL，里面早就装好了 upx，直接跑：

```text
upx -d asara_escape_1.exe
```

```text
                       Ultimate Packer for eXecutables
                          Copyright (C) 1996 - 2024
UPX 4.2.4       Markus Oberhumer, Laszlo Molnar & John Reiser    May 9th 2024

        File size         Ratio      Format      Name
   --------------------   ------   -----------   -----------
     32768 <-      9216   28.13%    win64/pe     asara_escape_1.exe

Unpacked 1 file.
```

拿到脱壳后的程序，再进 IDA 分析。

## 看核心逻辑

关键位置很好定位，核心加密伪代码是这样的：

```c
int __fastcall sub_14000167F(char *Buffer, int n30)
{
  int result; // eax
  _BYTE v4[40]; // [rsp+20h] [rbp-28h] BYREF

  result = sub_14000153C(Buf1: (unsigned __int8 *)Buffer, n30);
  if ( result == 0 )
    return result;

  sub_1400015A8(a1: (__int64)(Buffer + 5), a2: (__int64)v4);
  return sub_140001629(a1: (__int64)v4);
}
```

```c
__int64 __fastcall sub_1400015A8(__int64 a1, __int64 a2)
{
  int n3; // ecx
  __int64 i; // rdx
  __int64 v6; // rbx
  __int64 v7; // r11
  __int64 result; // rax

  n3 = 3;
  for ( i = 0; i != 24; ++i )
  {
    v6 = n3 % 24;
    v7 = (int)i % 6;
    result = (unsigned int)i + (unsigned __int8)(byte_140004000[v7] ^ *(_BYTE *)(a1 + v6));
    *(_BYTE *)(a2 + i) = i + (byte_140004000[v7] ^ *(_BYTE *)(a1 + v6));
    n3 += 5;
  }
  return result;
}
```

```c
_BOOL8 __fastcall sub_140001629(__int64 a1)
{
  char v1; // r8
  __int64 i; // rax

  v1 = 0;
  for ( i = 0; i != 24; ++i )
    v1 |= byte_140004010[i] ^ *(_BYTE *)(a1 + i);
  return v1 == 0;
}
```

结合这几段可以推出：输入 30 字节，前 5 字节是 `flag{`，最后 1 字节是 `}`，中间 24 字节送进加密。

判定函数返回的是 `v1 == 0`，而 `v1` 是把 `a1[i]` 和 `byte_140004010[i]` 逐字节异或再按位或起来。要让 `v1` 为 0，就得每一字节都异或成 0，也就是 `a1[i] == b1[i]`——这里的 `a1` 就是主加密算出来的 `v4`。

所以目标很明确：让 `v4` 等于 `byte_140004010` 这 24 个字节，然后逆主加密。

主加密的核心只有一句：

```text
a2[i] = i + (b0[v7] ^ a1[v6]);
```

逆回去：

```text
z = a2[i] - i;
a1[v6] = z ^ b0[v7];
```

数据是静态的，直接从 IDA 里抄出来：

```text
byte_140004000
0x0E,0x71,0x23,0x5C,0x17,0x39
byte_140004010
0x55,0x44,0x91,0x4D,0x86,0x21,0x7E,0x19,
0x5E,0x47,0x32,0x64,0x89,0x4A,0x5A,0x3F,
0x68,0x52,0x6D,0x44,0x4F,0x3B,0x49,0x66
```

## 第一版

```c
#include <stdio.h>
#include <stdint.h>

char orl[24];
char b0[6] = {
	0x0E,0x71,0x23,0x5C,0x17,0x39
};
char b1[24] = {
	0x55,0x44,0x91,0x4D,0x86,0x21,0x7E,0x19,
	0x5E,0x47,0x32,0x64,0x89,0x4A,0x5A,0x3F,
	0x68,0x52,0x6D,0x44,0x4F,0x3B,0x49,0x66
};

__int64 decrypto(char *a1, char *a2)
{
	unsigned int i;
	__int64 x;
	__int64 y;
	__int64 z;
	int n = 3;
	for (i = 0; i != 24; ++i)
	{
		x = n % 24;
		y = (int)i % 6;
		z = a2[i] - i;
		a1[x] = z ^ b0[y];
		n += 5;
	}
	return 0;
}

int main()
{
	decrypto(orl, b1);
	printf("flag{");
	for (int i = 0; i != 24; ++i)
	{
		putchar(orl[i]);
	}
	printf("}\n");
	return 0;
}
```

**输出**

```text
flag{bo@[%?l2v`Oz琧sx$uLUv晑
```

跑出来是乱码，先怀疑下标。

把前几个 `i` 对应的 `v6 = n % 24`、`v7 = i % 6` 列出来核对：3、8、13、18、23、4……下标一一对应，没重合也没越界，下标这条路排除。

那就只剩数据。把数组和 IDA 里的字节逐个比对，问题出来了：**数据顺序抄错了**。

## 修正版

```c
#include <stdio.h>
#include <stdint.h>

char orl[24];
char b0[6] = {
	0x39, 0x17, 0x5C, 0x23, 0x71, 0x0E
};
char b1[24] = {
	0x66, 0x49, 0x3B, 0x4F, 0x44, 0x6D, 0x52, 0x68,
	0x3F, 0x5A, 0x4A, 0x89, 0x64, 0x32, 0x47, 0x5E,
	0x19, 0x7E, 0x21, 0x86, 0x4D, 0x91, 0x44, 0x55
};

__int64 decrypto(char *a1, char *a2)
{
	unsigned int i;
	__int64 x;
	__int64 y;
	__int64 z;
	int n = 3;
	for (i = 0; i != 24; ++i)
	{
		x = n % 24;
		y = (int)i % 6;
		z = a2[i] - i;
		a1[x] = z ^ b0[y];
		n += 5;
	}
	return 0;
}

int main()
{
	decrypto(orl, b1);
	printf("flag{");
	for (int i = 0; i != 24; ++i)
	{
		putchar(orl[i]);
	}
	printf("}\n");
	return 0;
}
```

**输出**

```text
flag{red_f1le_upx_evac_ok2601}
```

### 修改点对照

```text
初版
char b0[6] =
{
0x0E,0x71,0x23,0x5C,0x17,0x39
};
char b1[24] =
{
0x55,0x44,0x91,0x4D,0x86,0x21,0x7E,0x19,
0x5E,0x47,0x32,0x64,0x89,0x4A,0x5A,0x3F,
0x68,0x52,0x6D,0x44,0x4F,0x3B,0x49,0x66
};

修正版
char b0[6] =
{
0x39, 0x17, 0x5C, 0x23, 0x71, 0x0E
};
char b1[24] =
{
0x66, 0x49, 0x3B, 0x4F, 0x44, 0x6D, 0x52, 0x68,
0x3F, 0x5A, 0x4A, 0x89, 0x64, 0x32, 0x47, 0x5E,
0x19, 0x7E, 0x21, 0x86, 0x4D, 0x91, 0x44, 0x55
};
```

错误原因是直接默认按小端去读了。

但这些数据实际是 `db` 单字节定义，所以根本不需要大小端读取。

多字节整型才需要考虑大小端，在 IDA 里就是 `dw`、`dd`、`dq`：

- 小端：低字节在低地址，`低低高高`；
- 大端：高字节在低地址，`高低低高`。

```text
左--高字节———————低字节--右
示例：0x12,0x34,0x56,0x78
地址：0x00,0x01,0x02,0x03
大端：0x12,0x34,0x56,0x78
小端：0x78,0x56,0x34,0x12
```

就这样吧。
