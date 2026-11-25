---
title: 'SparkCTF week4 · manbo'
summary: 'SparkCTF week4 的 manbo：Rust debug 构建下定位 24 字节置换和 RC4 变体，先逆置换再解密，拿到 flag。'
category: Reverse
subcategories: ['SparkCTF2026', 'week4']
event: SparkCTF
tags: ['逆向', 'RUST', 'SparkCTF2026', 'RC4']
tools: ['IDA']
publishedAt: 2026-11-25T20:00:00+08:00
---

这是新生赛里面的一道题，我来尝试复现一下。

## 侦察

![文件信息](/images/sparkctf-week4-manbo-01.png)

文件没问题，运行一下。

![程序运行结果](/images/sparkctf-week4-manbo-02.png)

有关键字符串了。

程序逻辑大概是，用一个算法对输入进行计算，然后与标准进行对比。

---

然后进入 IDA 进行静态分析。

有关键字符串，可以在字符串里面快速定位。

![字符串窗口里的关键字符串](/images/sparkctf-week4-manbo-03.png)

然后交叉引用，反编译。

```c
__int64 __fastcall sub_17B20()
{
  __int64 v0; // rax
  __int64 v1; // rdx
  __int64 v2; // rdx
  __int64 v3; // rax
  __int64 v4; // rdx
  __int64 v5; // rax
  __int64 v6; // rdx
  __int64 v7; // rax
  __int64 v8; // rdx
  _BYTE v10[24]; // [rsp+70h] [rbp-58h] BYREF
  __int64 v11[3]; // [rsp+88h] [rbp-40h] BYREF
  __int64 v12; // [rsp+A0h] [rbp-28h]
  __int64 v13; // [rsp+A8h] [rbp-20h]
  _QWORD v14[3]; // [rsp+B0h] [rbp-18h] BYREF

  v0 = sub_17F50(a1: aRewrittenDutyP, a2: 27);
  sub_40070(a1: v0, a2: v1);
  sub_17E10(a1: v10);
  v11[0] = sub_40040();
  v12 = sub_33740(a1: v11, a2: v10);
  v13 = v2;
  if ( (v12 & 1) != 0 )
  {
    v14[0] = v13;
    sub_54770(a1: aCalledResultUn, a2: 43, a3: v14, a4: &off_58AD8, a5: &stru_58AC0);
  }
  v3 = sub_193F0(a1: v10);
  v5 = sub_17D60(a1: v3, a2: v4);
  if ( (sub_172D0(a1: v5, a2: v6) & 1) != 0 )
    v7 = sub_17F50(a1: aReviewPassedTe, a2: 56);
  else
    v7 = sub_17F50(a1: aRewriteComplet, a2: 46);
  sub_40070(a1: v7, a2: v8);
  return sub_16C20(a1: v10);
}
```

## 分析

定位到两个结束分支。

```c
  if ( (sub_172D0(a1: v5, a2: v6) & 1) != 0 )
    v7 = sub_17F50(a1: aReviewPassedTe, a2: 56);
  else
    v7 = sub_17F50(a1: aRewriteComplet, a2: 46);
```

成功分支要求返回值不等于 0。

进到 sub_172D0 里面继续分析。

末尾：

```c
 return sub_188B0(s, a2: &qword_9BED) & 1;
```

sub_188B0：

```c
 return sub_18E80(a1: s) & 1;
```

sub_18E80：

```c
  return memcmp(s1: s, s2, n: 0x18u) == 0;
```

那么，传入的 s 就是加密算法后的输入，qword_9BED 就是标准。

看 s 是怎么来的，倒着分析。

```c
 sub_17650(s, n24: 24, s: s_1, n8: 8);
 s[n0x18] = *(_BYTE *)(a1 + n5);
```

s 来源于 a1。

```c
  if ( (sub_18DB0(a1: v12, a2: &off_58890) & 1) != 0 || *(_BYTE *)(a1 + 29) != 125 )
    return 0;
```

这里是对 a1 格式的检验，推测 a1 就是输入。

然后有一些条件，不满足要求就会进入一些函数，这些函数很相似，十分复杂，推测是错误路径，重命名一下便于识别。

然后：

```c
memcpy(dest, src: &src_, n: sizeof(dest));
n5 = dest[n0x18] + 5LL;
s[n0x18] = *(_BYTE *)(a1 + n5);
```

这部分操作应该是把输入中间那 24 字节打乱后赋给 s 了。

dest 来源于 src_：

```text
3,14,1,12,23,10,21,8,19,6,17,4,15,2,13,0,11,22,9,20,7,18,5,16
```

src_ 的数据在 0-23，很难不让人想到是一个置换表。

下标是 n0x18，但是我没能找到循环次数，除了被我标记错误路线的分支之外，唯一有 24 的：

```c
v14[0] = sub_188C0(a1: 0, n24: 24);
```

问了一下 AI，这个是 Rust 的 `Range::new(0, 24)`。

所以就是从 0-23 的循环，那么这里就是在用表打乱输入。

翻译一下就是：

```c
for(i=0;i<24;i++)
{
  n5=dest[i]+5;
  s[i]=a1[n5];
}
```

s_1：

```c
v23[2] = 5;
v23[1] = 1;
memset(s: s_1, c: 0, n: sizeof(s_1));
v19[0] = sub_188C0(a1: 0, n24: 8);
v22 = 0x2179654B74735572LL;
n8 = n8_1;
v8 = *((_BYTE *)&v23[-1] + n8);
v23[0] = 0x30626E344D743463LL;
s_1[n8] = *((_BYTE *)v23 + n8) ^ v8;
```

这里也类似上面，是从 0-8 的循环。

然后 v23[-1] 就是 v22。

也就是：

```c
v22[8]={0x72,0x55,0x73,0x74,0x4B,0x65,0x79,0x21};
v23[8]={0x63,0x34,0x74,0x4D,0x34,0x6E,0x62,0x30};
for(i=0;i<8;i++)
{
 v8=v22[i];
 s_1[i]=v23[i]^v22[i];
}
```

然后在 sub_17650 里面对输入的副本进一步操作。

sub_17650 里面也有许多被标记过的 wrong 和 wrong1。

然后有类似前面的循环，从一大堆 wrong 里面提取信息。

```c
 memset(s: sa, c: 0, n: sizeof(sa));
 v26[0] = sub_188C0(a1: 0, n24: 256);
 sa[n0x100] = n0x100;
 n0x100_9 = 0;
 v30[0] = sub_188C0(a1: 0, n24: 256);
 v12 = (unsigned __int8)sa[n0x100_1];
 v16 = v12 + n0x100_9;
 v15 = n0x100_1 % n8;
 v13 = (unsigned __int8)a3[v15];
 n0x100_8 = v13 + v16;
 n0x100_9 = n0x100_8;
 sub_17D80(a1: sa, a2: 256, a3: n0x100_1, a4: n0x100_8, a5: &stru_58A90);
 n0x100_2 = 0;
 n0x100_3 = 0;
 v35[0] = sub_18920(a1: s, a2: n24);
 v36 = sub_18A70(a1: v35);
 result = v36 != 0;
 if ( v36 == 0 )
    break;
 v19 = (_BYTE *)v36;
 n0x100_6 = n0x100_2 + 1;
 n0x100_2 = n0x100_6;
 v10 = (unsigned __int8)sa[n0x100_6];
 n0x100_7 = v10 + n0x100_3;
 n0x100_3 = n0x100_7;
 sub_17D80(a1: sa, a2: 256, a3: n0x100_2, a4: n0x100_7, a5: &stru_589A0);
 v17 = (unsigned __int8)sa[n0x100_2];
 v11 = (unsigned __int8)sa[n0x100_3];
 *v19 ^= sa[(unsigned __int8)(v11 + v17)];
```

在这里面，唯一找到有关传入的 s 的只有：

```c
 v35[0] = sub_18920(a1: s, a2: n24);
```

根据函数分析，这里面直接将返回的 s 给 v35，所以现在 v35 存的是 s 的地址。

那么后续，从 v35 找到 v36，再找到 v19，直到最后有一句对 *v19 的异或运算：

```c
*v19 ^= sa[(unsigned __int8)(v11 + v17)];
```

然后再找与 sa、v11、v17 相关的信息。

## 信息还原

下面只是将伪代码里面的信息还原一下。

首先是建 sa：

```c
 memset(s: sa, c: 0, n: sizeof(sa));
 v26[0] = sub_188C0(a1: 0, n24: 256);
 sa[n0x100] = n0x100;
```

与前面类似，这里应该是：

```c
for(i=0;i<256;i++)
{
 sa[i]=i;
}
```

建了一个 0-255 的 sa 盒。

然后提取与 sa 索引相关的信息：

```c
v12 = (unsigned __int8)sa[n0x100_1];
v16 = v12 + n0x100_9;
v15 = n0x100_1 % n8;
v13 = (unsigned __int8)a3[v15];
n0x100_8 = v13 + v16;
n0x100_9 = n0x100_8;
sub_17D80(a1: sa, a2: 256, a3: n0x100_1, a4: n0x100_8, a5: &stru_58A90);
n0x100_6 = n0x100_2 + 1;
n0x100_2 = n0x100_6;
v10 = (unsigned __int8)sa[n0x100_6];
n0x100_7 = v10 + n0x100_3;
n0x100_3 = n0x100_7;
sub_17D80(a1: sa, a2: 256, a3: n0x100_2, a4: n0x100_7, a5: &stru_589A0);
v17 = (unsigned __int8)sa[n0x100_2];
v11 = (unsigned __int8)sa[n0x100_3];
```

在 (exchange)sub_17D80 里面，有个交换的操作（我重命名了）：

```c
 return change(a1: &sa[n0x100], a2: &sa[n256_1]);

_BYTE *__fastcall change(_BYTE *a1, _BYTE *a2)
{
    v5[0] = *a1;
    *a1 = *a2;
    *a2 = v5[0];
}
```

对 a3 的处理，应该是在取密钥：

```c
v15 = n0x100_1 % n8;
v13 = (unsigned __int8)a3[v15];
n0x100_8 = v13 + v16;
```

还通过 exchange 将 n0x100_1 与 n0x100_8 交换了，实际交换了 sa 里面的元素。

所以这里是在通过密钥，对 sa 盒进行置换打乱。

还原一下第二个循环：

```c
for(i=0;i<256;i++)
{
    s1=sa[i];
    k=a3[i%8];
    j+=k+s1;
    sa[i]=sa[j];
    sa[j]=s1;
}
```

然后是第三个循环。

伪代码里面：

```c
 n0x100_2 = 0;
 n0x100_6 = n0x100_2 + 1;
 n0x100_2 = n0x100_6;
```

这里还原成：

```c
 x=0;
 y=x+1;
 x=y;
```

即 x+=1。

伪代码里面：

```c
 n0x100_3 = 0;
 v10 = (unsigned __int8)sa[n0x100_6];
 n0x100_7 = v10 + n0x100_3;
 n0x100_3 = n0x100_7;
```

还原一下，接着上面：

```c
 k=0;
 sa[y];
 z=sa[y]+k;
 k=z;
```

即 k+=sa[y]。

然后再将 sa[x] 和 sa[z] 交换。

接着：

```c
v17=sa[x];
v11=sa[k];
t=sa[x]+sa[k];
*v19^=sa[t];
```

也就是 s^=sa[t]。

加上循环，就是：

```c
for(int i=0;i<24;i++)
{
 x+=1;
 y+=sa[x];
 t=sa[x];
 sa[x]=sa[y];
 sa[y]=t;
 m=sa[x]+sa[y];
 s[i]^=sa[m];
}
```

整个还原出来就是：

```c
for(int i=0;i<256;i++)
{
    sa[i]=i;
}
int x=0;
int y=0;
for(int i=0;i<256;i++)
{
    s1=sa[i];
    k=key[i%8];
    j+=k+s1;
    sa[i]=sa[j];
    sa[j]=s1;
}
for(int i=0;i<24;i++)
{
    x+=1;
    y+=sa[x];
    t=sa[x];
    sa[x]=sa[y];
    sa[y]=t;
    m=sa[x]+sa[y];
    s[i]^=sa[m];
}
```

整合一下，就是先建一个 256 字节的盒，再打乱，然后再生成密钥流。

RC4 解密就将标准密文再过一遍。

然后逆一下置换：

```c
置换：
for(i=0;i<24;i++)
{
  s[i]=input[dest[i]];
}
逆置换：
for(i=0;i<24;i++)
{
  inv[dest[i]]=i;
}
for(i=0;i<24;i++)
{
  input[i]=s[inv[i]];
}
```

还有一点，sa[x] 是无符号 0-255，所以 x 都要声明成 unsigned __int8。

密文：

```c
uint8_t cipher[24] =
{
    0xe9, 0xa8, 0x79, 0x7b, 0xc5, 0x32, 0xd9, 0xda,
    0x26, 0xfa, 0x31, 0x90, 0x4c, 0xbe, 0x96, 0x6f,
    0x1c, 0x93, 0xb8, 0x42, 0x70, 0x9d, 0xe2, 0x8c
};
```

---

## 解密

```c
#include <stdio.h>
#include <stdint.h>

int main(void)
{
    uint8_t s[24] =
    {
        0xe9, 0xa8, 0x79, 0x7b, 0xc5, 0x32, 0xd9, 0xda,
        0x26, 0xfa, 0x31, 0x90, 0x4c, 0xbe, 0x96, 0x6f,
        0x1c, 0x93, 0xb8, 0x42, 0x70, 0x9d, 0xe2, 0x8c
    };

    uint8_t dest[24] =
    {
         3, 14,  1, 12, 23, 10, 21,  8,
        19,  6, 17,  4, 15,  2, 13,  0,
        11, 22,  9, 20,  7, 18,  5, 16
    };

    uint8_t v22[8] = {0x72, 0x55, 0x73, 0x74, 0x4B, 0x65, 0x79, 0x21};
    uint8_t v23[8] = {0x63, 0x34, 0x74, 0x4D, 0x34, 0x6E, 0x62, 0x30};

    uint8_t key[8];
    for (int i = 0; i < 8; i++)
    {
        key[i] = v23[i] ^ v22[i];
    }

    uint8_t sa[256];
    for (int i = 0; i < 256; i++)
        sa[i] = (uint8_t)i;

    uint8_t j = 0;
    for (int i = 0; i < 256; i++)
    {
        uint8_t s1 = sa[i];
        uint8_t k  = key[i % 8];
        j += k + s1;
        sa[i] = sa[j];
        sa[j] = s1;
    }

    uint8_t x = 0, y = 0;
    for (int i = 0; i < 24; i++)
    {
        x += 1;
        y += sa[x];
        uint8_t t = sa[x]; sa[x] = sa[y]; sa[y] = t;
        uint8_t m = sa[x] + sa[y];
        s[i] ^= sa[m];
    }

    uint8_t inv[24];
    for (int i = 0; i < 24; i++)
        inv[dest[i]] = (uint8_t)i;

    uint8_t input[24];
    for (int i = 0; i < 24; i++)
        input[i] = s[inv[i]];

    printf("flag{");
    for (int i = 0; i < 24; i++)
        putchar(input[i]);
    printf("}\n");

    return 0;
}
```

输出：

```text
flag{rewr1te_it_in_rust_now!!}
```

---

## 解惑

printf 和 scanf 的重命名是对的。

Q（我提问），A（AI 回答）。

**Q1：v3 = sub_193F0(a1: v10); 这一句对输入做了什么？**

A1：IDA 给它推断的返回类型是 `__int64`，也就是认为只有一个返回值，所以只显示 `rax` 那一半。

反汇编的注释如下：

```asm
193f0:  mov rax, [rdi+0x8]     ; 第 1 个返回值
193f4:  mov rdx, [rdi+0x10]    ; 第 2 个返回值  ← IDA 伪代码里没出现
193f8:  ret
```

`ret` 前面有两条 `mov`，分别写入 `rax` 和 `rdx`，这是 SysV ABI 返回 16 字节结构的标准写法，例如 Rust 的 `&str { ptr, len }`。

**它不修改输入**，只是取值；`v10` 的内容、长度、容量都不变。

（这一点和我猜的一样）

**Q2：v5 = sub_17D60(a1: v3, a2: v4); 这一句对 v3 做了什么？里面好复杂，但是我只关注到了 `v7=0; return v7 + a1;`，所以猜测性地把它当作什么也没改。**

A2：不是“什么也没改”，`sub_169D0` 是 **`str::trim()`** —— 它去掉了输入首尾的空白（包括换行），把指针向后挪、长度缩短。

（看来是去掉 `\n`）

**Q3：主要逻辑函数里面，一大堆被我猜测性标记为干扰信息 wrong，基本上看到我就直接当作没有这个东西，它们的作用是什么，怎么辨别？**

A3：那一大堆 `wrong`、`wrong1`，其实来自 **Rust 在 debug 构建下插入的 panic 兜底机制**，并非程序自身的业务逻辑：每次越界检查或整数溢出检查失败时，程序都会进入下表中对应的 panic 分支。**返回值从不被使用**，并且调用之后**流程直接走向 abort**，**它不写入任何业务数据**，只做参数打包、格式化、然后终止。

（好吧，看来我把它当作不存在是对的，但是也不能随便忽视，还是要看一下有没有对最终结果起到作用）

**Q4：这个是 Rust 重写吧，遇到这类题，有没有比较好的处理方法？**

A4：对，而且整个“重写”叙事和实现细节是自洽的，作者大概率是把一份 C 版（置换 + RC4）原样搬进 Rust，再用 **debug 模式**编译。如果换成 `--release` 编译，这些检查会被优化掉大半、调用层级会被压平，题目反而没这么好读了。

有一套比较稳的流程，核心思路是：**先把 Rust 特有的检查、迭代器和返回值按 ABI 约定还原成 C，再按普通逆向题的方法分析**。

Rust 题中真正需要逆向的是作者自己的数据结构操作，panic、fmt、迭代器、**原子操作都是可识别的样板代码**。

（说的啥呀）

**先清理干扰项、再修改类型、最后逐条抄成 C**。

（。。。）

---

## 动调思路

本来想着 RC4 可以直接用动态调试，到时候只需要置换回来就行，但是这是 ELF，不能通过 x64dbg 动调，哎。

那就说一下动调思路吧。

首先下断点：

```asm
0000000000017375 1A8 B8 1D 00 00 00                mov     eax, 1Dh
000000000001737A 1A8 48 39 C8                      cmp     rax, rcx
000000000001737F 1A8 48 8B 44 24 48                mov     rax, [rsp+1A8h+var_160]
0000000000017384 1A8 80 78 1D 7D                   cmp     byte ptr [rax+29], 7Dh ; '}'
```

下在格式判断那里（将返回值改一下，让程序继续）：

```asm
00000000000174B8 1A8 48 8D 7C 24 68                lea     rdi, [rsp+104]                  ; s
00000000000174CF 1A8 E8 7C 01 00 00                call    sub_17650
```

下在调用关键函数那里（将传入 s 的地址的数据改成密文）。

单步那个 call，再看 s 的内存，读取打乱的明文。

再建逆表将明文顺序置换正确。

（后面得学一下 gdb 动调）

---

就这样吧。
