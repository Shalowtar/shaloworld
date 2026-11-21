---
title: 'SparkCTF week2 · tiwate'
summary: 'SparkCTF w2 的 tiwate：两处花指令先用 patch 还原，再逆一个 RC4 式的加密；第一版被 dq 的字节序和置换表坑了两次，最后跑出 flag。'
category: Reverse
subcategories: ['SparkCTF2026', 'week2']
event: SparkCTF
tags: ['逆向', 'C语言', 'SparkCTF2026']
tools: ['IDA', 'x64dbg']
publishedAt: 2026-11-21T11:00:00+08:00
---

这是新生赛里的 w2 题，现在重做复现。程序没有加壳，但埋了两处花指令；真正的加密是一个 RC4 式的 KSA/PRGA，最后还卡在数据顺序和置换表上。

## 先找关键

先从 `main` 入手，反编译出来是这样：

```c
__int64 sub_140001BF3()
{
  _BYTE v1[32]; // [rsp+20h] [rbp-20h] BYREF

  sub_140001D17();
  sub_140001778(a1: "Commission receipt:");
  sub_14000190F();
  if ( (unsigned int)sub_1400017A1(a1: v1) != 0 && (unsigned int)sub_140001B46(a1: v1) != 0 )
    sub_140001778(a1: "Route confirmed. Paimon claims she knew it.");
  else
    sub_140001778(a1: "The marked route is not the real route.");
  return 0;
}
```

`17A1` 负责格式检查：必须是 `flag{}`，中间 24 字节。真正干活的是 `1B46`。

但 `1B46` 反编译出来只有一句：

```c
void sub_140001B46()
{
  JUMPOUT(0x140001B5BLL);
}
```

明显被花指令干扰了。切到 Graph 视图看：

![IDA 里 1B46 的花指令跳转](/writeups/sparkctf-week2-tiwate/graph-1b46.png)

`jp` 和 `jnp` 的条件正好相反，但两条跳转的目标都是 `loc_140001B5A+1`，合起来等于无条件跳。跳过去之后又是一个奇怪的 `call`：

```text
.text:0000000140001B5A 030 E8 C7 45 FC 00                call    near ptr 140FC6126h
```

`E8` 后面原本是正常指令字节，被 IDA 当成 `call` 的目标地址，后面的反编译就全乱了。把这条 `call` 按 `U` 取消定义，再按 `F5`，主逻辑就出来了：

```c
void __fastcall sub_140001B46(__int64 a1)
{
  _BYTE v1[16]; // [rsp+20h] [rbp-30h] BYREF
  _BYTE Buf1[28]; // [rsp+30h] [rbp-20h] BYREF
  int i; // [rsp+4Ch] [rbp-4h]

  for ( i = 0; i <= 23; ++i )
    Buf1[i] = *(_BYTE *)(byte_140014070[i] + a1);

  sub_140001892(a1: v1);
  sub_14000191B(a1: Buf1, a2: 24, a3: v1, a4: 16);
  memcmp(Buf1, Buf2: &Buf2_, Size: 0x18u);
  JUMPOUT(0x140001BEDLL);
}
```

末尾缺的部分大概率就是一个返回。`Buf1` 是通过指针在函数里直接改的，返回值影响不大。

## 密钥和加密

`v1` 先传给 `1892`，再和 `Buf1`、长度 24、密钥长度 16 一起传给 `191B`。猜测 `1892` 生成密钥，`191B` 做加密。

看 `1892`：

```c
void sub_140001892()
{
  JUMPOUT(0x1400018A4LL);
}
```

又是一处花指令：

![IDA 里 1892 的跳转](/writeups/sparkctf-week2-tiwate/graph-1892.png)

`jnp` 和 `jp` 组合后跳到 `18A2`，先执行一句假常量：

```text
loc_1400018A2:
mov     rax, 0FC45C7FFFFE803EBh
jmp     short loc_140001901
```

然后直接跳到 `1901`，把真正生成密钥的 `18B2` 整段绕过去了。把第一个跳转 keypatch 到 `18B2`，反编译：

```c
void __fastcall sub_140001892(__int64 a1)
{
  int n7; // [rsp+Ch] [rbp-4h]

  do
  {
    *(_BYTE *)(2 * n7 + a1) = byte_140014060[n7] ^ 0x36;
    *(_BYTE *)(2 * n7 + 1LL + a1) = byte_140014068[n7] ^ 0x36;
    ++n7;
  }
  while ( n7 <= 7 );
}
```

除了那句假常量，没有别的怪地方。虽然有分析不完整的提示，但这 8 次循环已经足够还原 16 字节密钥。

`191B` 是正常的，下面单独贴。先把静态数据抄出来，都是 `db`：

```text
byte_140014060
0x70, 0x34, 0x69, 0x6D, 0x30, 0x6E, 0x21, 0x21
byte_140014068
0x72, 0x30, 0x61, 0x64, 0x62, 0x6C, 0x30, 0x6B
byte_140014070
0x05, 0x0C, 0x13, 0x02, 0x09, 0x10, 0x17, 0x06
0x0D, 0x14, 0x03, 0x0A, 0x11, 0x00, 0x07, 0x0E
0x15, 0x04, 0x0B, 0x12, 0x01, 0x08, 0x0F, 0x16
```

根据函数里的取值，三个数组的长度分别是 8、8、24。

## 分析代码

第一步是置换。`b70` 是一个 0～23 的置换表，输入按它打乱：

```c
for ( i = 0; i <= 23; ++i )
    Buf1[i] = *(_BYTE *)(byte_140014070[i] + a1);
```

也就是 `Buf1[i] = input[b70[i]]`。

第二步生成密钥。`b60` 和 `b68` 各取一个字节，异或 `0x36` 后交替填进 16 字节的 `v1`：

```c
do
{
    *(_BYTE *)(2 * n7 + a1) = byte_140014060[n7] ^ 0x36;
    *(_BYTE *)(2 * n7 + 1LL + a1) = byte_140014068[n7] ^ 0x36;
    ++n7;
}
while ( n7 <= 7 );
```

第三步是加密，`191B` 的完整代码：

```c
__int64 __fastcall sub_14000191B(_BYTE *Buf1, int n24, __int64 a3, int n16)
{
  __int64 j_1; // rax
  _BYTE v5[258]; // [rsp+0h] [rbp-80h]
  char v6; // [rsp+102h] [rbp+82h]
  char v7; // [rsp+103h] [rbp+83h]
  int j; // [rsp+104h] [rbp+84h]
  int v9; // [rsp+108h] [rbp+88h]
  int i; // [rsp+10Ch] [rbp+8Ch]

  v9 = 0;
  for ( i = 0; i <= 255; ++i )
    v5[i] = i;

  for ( i = 0; i <= 255; ++i )
  {
    v9 = (unsigned __int8)(v5[i] + v9 + *(_BYTE *)(i % n16 + a3));
    v6 = v5[i];
    v5[i] = v5[v9];
    v5[v9] = v6;
  }

  v9 = 0;
  i = 0;
  for ( j = 0; ; ++j )
  {
    j_1 = (unsigned int)j;
    if ( j >= n24 )
      break;

    i = (unsigned __int8)(i + 1);
    v9 = (unsigned __int8)(v5[i] + v9);
    v7 = v5[i];
    v5[i] = v5[v9];
    v5[v9] = v7;
    Buf1[j] ^= v5[(unsigned __int8)(v5[i] + v5[v9])];
  }

  return j_1;
}
```

这是标准的 RC4 结构：先初始化 256 字节的 S 盒，用 16 字节密钥做 KSA 打乱，再对 24 字节做 PRGA 异或。因为异或对称，解密只要把密文再走一遍同样的流程。

最后拿结果和 `Buf2` 比较 24 字节：

```c
memcmp(Buf1, Buf2: &Buf2_, Size: 0x18u);
```

`Buf2` 是 `dq`，在内存里按 8 字节一组存放。先按内存顺序抄出来：

```text
Buf2
0xCB, 0x5C, 0xD6, 0x61, 0x39, 0xF5, 0x59, 0xE4
0x31, 0x3E, 0xB5, 0x23, 0xAB, 0xFA, 0x95, 0xD4
0xD6, 0x26, 0xB8, 0xDE, 0xA7, 0x66, 0x18, 0x7D
```

思路清楚了：保留加密部分，把输入换成 `Buf2` 逆一遍，得到打乱后的明文，再按置换表还原顺序。

## 写解密

### 第一版

```c
#include <stdint.h>
#include <stdio.h>

char b60[8] = {
    0x70, 0x34, 0x69, 0x6D, 0x30, 0x6E, 0x21, 0x21
};
char b68[8] = {
    0x72, 0x30, 0x61, 0x64, 0x62, 0x6C, 0x30, 0x6B
};
char b70[24] = {
    0x05, 0x0C, 0x13, 0x02, 0x09, 0x10, 0x17, 0x06,
    0x0D, 0x14, 0x03, 0x0A, 0x11, 0x00, 0x07, 0x0E,
    0x15, 0x04, 0x0B, 0x12, 0x01, 0x08, 0x0F, 0x16
};
char Buf2[24] = {
    0xCB, 0x5C, 0xD6, 0x61, 0x39, 0xF5, 0x59, 0xE4,
    0x31, 0x3E, 0xB5, 0x23, 0xAB, 0xFA, 0x95, 0xD4,
    0xD6, 0x26, 0xB8, 0xDE, 0xA7, 0x66, 0x18, 0x7D
};
char v1[16];

void calc()
{
    int n7 = 0;
    do
    {
        v1[2 * n7] = b60[n7] ^ 0x36;
        v1[2 * n7 + 1] = b68[n7] ^ 0x36;
        ++n7;
    } while (n7 <= 7);

    for (int i = 0; i <= 15; ++i)
    {
        printf("%2d ", v1[i]);
    }
}

__int64 decrypto(char *Buf2, int n24, char *a3, int n16)
{
    char Buf3[24];
    __int64 j_1; // rax
    unsigned char v5[258]; // [rsp+0h] [rbp-80h]
    unsigned char v6; // [rsp+102h] [rbp+82h]
    unsigned char v7; // [rsp+103h] [rbp+83h]
    int j; // [rsp+104h] [rbp+84h]
    unsigned int v9; // [rsp+108h] [rbp+88h]
    int i; // [rsp+10Ch] [rbp+8Ch]

    v9 = 0;
    for (i = 0; i <= 255; ++i)
        v5[i] = i;

    for (i = 0; i <= 255; ++i)
    {
        v9 = (unsigned __int8)(v5[i] + v9 + a3[i % 16]);
        v6 = v5[i];
        v5[i] = v5[v9];
        v5[v9] = v6;
    }

    v9 = 0;
    i = 0;
    for (j = 0; ; ++j)
    {
        j_1 = (unsigned int)j;
        if (j >= n24)
            break;

        i = (unsigned __int8)(i + 1);
        v9 = (unsigned __int8)(v5[i] + v9);
        v7 = v5[i];
        v5[i] = v5[v9];
        v5[v9] = v7;
        Buf2[j] ^= v5[(unsigned __int8)(v5[i] + v5[v9])];
    }
    return j_1;
}

int main()
{
    char inv[24];
    char out[24];

    for (int k = 0; k <= 23; ++k)
    {
        printf("%2d ", b70[k]);
    }
    putchar('\n');

    for (int i = 0; i <= 23; ++i)
    {
        inv[b70[i]] = i;
    }
    for (int n = 0; n <= 23; ++n)
    {
        printf("%2d ", inv[n]);
    }
    putchar('\n');

    calc();
    putchar('\n');

    decrypto(Buf2, 24, v1, 16);
    printf("flag{");
    for (int j = 0; j <= 23; ++j)
    {
        out[inv[j]] = Buf2[j];
    }
    for (int m = 0; m <= 23; ++m)
    {
        putchar(out[m]);
    }
    printf("}");
    putchar('\n');
    return 0;
}
```

输出：

```text
 5 12 19  2  9 16 23  6 13 20  3 10 17  0  7 14 21  4 11 18  1  8 15 22
13 20  3 10 17  0  7 14 21  4 11 18  1  8 15 22  5 12 19  2  9 16 23  6
70 68  2  6 95 87 91 82  6 84 88 90 23  6 23 93
flag{FB乔?;
Cp苫!绨a簯V}9
```

乱码。先排查置换表和密钥：打印出来的 `b70`、`inv`、异或后的 16 字节密钥都和预期一致，下标没有越界，置换也没有重复。

那问题只能出在数据顺序。`Buf2` 是 `dq`，我却直接按它在 IDA 里显示的低地址到高地址抄了，等于把每个 8 字节大端当成了小端。把它按 8 字节一组倒过来：

```c
char Buf2[24] = {
    0xE4, 0x59, 0xF5, 0x39, 0x61, 0xD6, 0x5C, 0xCB,
    0xD4, 0x95, 0xFA, 0xAB, 0x23, 0xB5, 0x3E, 0x31,
    0x7D, 0x18, 0x66, 0xA7, 0xDE, 0xB8, 0x26, 0xD6
};
```

输出变成：

```text
flag{e_wall!!tr4v3l_beyond_th}
```

flag 的字符都在，但整体错位了。说明置换的方向反了。第一版里写的是：

```c
out[inv[j]] = Buf2[j];
```

反过来，让 `Buf2` 的第 `j` 个字节回到 `b70[j]` 指向的位置：

```c
out[j] = Buf2[inv[j]];
```

再跑：

```text
flag{tr4v3l_beyond_the_wall!!}
```

这次对了。

### 最终代码

```c
#include <stdint.h>
#include <stdio.h>

char b60[8] = {
    0x70, 0x34, 0x69, 0x6D, 0x30, 0x6E, 0x21, 0x21
};
char b68[8] = {
    0x72, 0x30, 0x61, 0x64, 0x62, 0x6C, 0x30, 0x6B
};
char b70[24] = {
    0x05, 0x0C, 0x13, 0x02, 0x09, 0x10, 0x17, 0x06,
    0x0D, 0x14, 0x03, 0x0A, 0x11, 0x00, 0x07, 0x0E,
    0x15, 0x04, 0x0B, 0x12, 0x01, 0x08, 0x0F, 0x16
};
char Buf2[24] = {
    0xE4, 0x59, 0xF5, 0x39, 0x61, 0xD6, 0x5C, 0xCB,
    0xD4, 0x95, 0xFA, 0xAB, 0x23, 0xB5, 0x3E, 0x31,
    0x7D, 0x18, 0x66, 0xA7, 0xDE, 0xB8, 0x26, 0xD6
};
char v1[16];

void calc()
{
    int n7 = 0;
    do
    {
        v1[2 * n7] = b60[n7] ^ 0x36;
        v1[2 * n7 + 1] = b68[n7] ^ 0x36;
        ++n7;
    } while (n7 <= 7);

    for (int i = 0; i <= 15; ++i)
    {
        printf("%2d ", v1[i]);
    }
}

__int64 decrypto(char *Buf2, int n24, char *a3, int n16)
{
    char Buf3[24];
    __int64 j_1; // rax
    unsigned char v5[258]; // [rsp+0h] [rbp-80h]
    unsigned char v6; // [rsp+102h] [rbp+82h]
    unsigned char v7; // [rsp+103h] [rbp+83h]
    int j; // [rsp+104h] [rbp+84h]
    unsigned int v9; // [rsp+108h] [rbp+88h]
    int i; // [rsp+10Ch] [rbp+8Ch]

    v9 = 0;
    for (i = 0; i <= 255; ++i)
        v5[i] = i;

    for (i = 0; i <= 255; ++i)
    {
        v9 = (unsigned __int8)(v5[i] + v9 + a3[i % 16]);
        v6 = v5[i];
        v5[i] = v5[v9];
        v5[v9] = v6;
    }

    v9 = 0;
    i = 0;
    for (j = 0; ; ++j)
    {
        j_1 = (unsigned int)j;
        if (j >= n24)
            break;

        i = (unsigned __int8)(i + 1);
        v9 = (unsigned __int8)(v5[i] + v9);
        v7 = v5[i];
        v5[i] = v5[v9];
        v5[v9] = v7;
        Buf2[j] ^= v5[(unsigned __int8)(v5[i] + v5[v9])];
    }
    return j_1;
}

int main()
{
    char inv[24];
    char out[24];

    for (int k = 0; k <= 23; ++k)
    {
        printf("%2d ", b70[k]);
    }
    putchar('\n');

    for (int i = 0; i <= 23; ++i)
    {
        inv[b70[i]] = i;
    }
    for (int n = 0; n <= 23; ++n)
    {
        printf("%2d ", inv[n]);
    }
    putchar('\n');

    calc();
    putchar('\n');

    decrypto(Buf2, 24, v1, 16);
    printf("flag{");
    for (int j = 0; j <= 23; ++j)
    {
        out[j] = Buf2[inv[j]];
    }
    for (int m = 0; m <= 23; ++m)
    {
        putchar(out[m]);
    }
    printf("}");
    putchar('\n');
    return 0;
}
```

## 问题分析

**数据顺序。** 上次做同类题也栽在这里。`db` 是单字节定义，不需要考虑大小端；`dq` 是 8 字节，IDA 里显示的是内存低地址到高地址，抄进 C 数组时要把每组倒过来。多字节整型才需要关心大小端。

**下标对应。** 其实不必建逆表。由 `Buf1[i] = a1[b70[i]]`，而比较要求 `Buf2[i] = Buf1[i]`，所以 `Buf2[i] = a1[b70[i]]`，直接 `out[b70[j]] = Buf2[j]` 也行。两种写法等价，只是方向不同。

## 动调思路

本来想用 x64dbg 动调，但这个文件被报特洛伊木马，调试器不让附加，没实践成。

思路是跳过输入校验，直接把 EIP 设到 `sub_140001B46` 里调用加密之前，也就是 `1B94` 那条 `lea rax, [rbp+var_30]`；然后在 `memcmp` 之前下断：

```text
mov     edx, 18h        ; n24
mov     rcx, rax        ; Buf1
lea     rax, [rbp-32]
mov     r8d, 18h        ; Size
lea     rdx, Buf2_      ; Buf2
mov     rcx, rax        ; Buf1
call    memcmp
```

把送进 `191B` 的 `Buf1` 内存改成 `Buf2`，让程序自己跑一遍加密。这是对称加密，密文再过一次就会得到明文；断在 `memcmp` 前看 `rbp-32`，再按置换表还原就是 flag。

就这样吧。
