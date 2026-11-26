---
title: 'SparkCTF week4 · tiwate'
summary: 'SparkCTF week4 的 tiwate：IDA 反编译被切断后，从汇编补出 24 字节分组加密，按 6 轮移位异或写出逆运算拿 flag。'
category: Reverse
subcategories: ['SparkCTF2026', 'week4']
event: SparkCTF
tags: ['逆向', 'SparkCTF2026', 'TEA']
tools: ['IDA']
publishedAt: 2026-11-26T11:05:00+08:00
---

新生赛题，现在来尝试复现。

## 侦察

没有检测出来什么问题。

![DIE 查壳结果](/images/sparkctf-week4-tiwate-01.png)

运行一下。

报错了，说缺少 libstdc++-6.dll、libgcc_s_seh-1.dll、libwinpthread-1.dll，补一下。

![补上运行库后的输出](/images/sparkctf-week4-tiwate-02.png)

然后运行成功，大概逻辑就是一个加密程序，检验输入。

---

## 静态分析

通过字符串，定位到关键函数，进入分析。

根据自己的判断重命名 printf。

![重命名后的主逻辑](/images/sparkctf-week4-tiwate-03.png)

然后查看。

![格式判断与比较分支](/images/sparkctf-week4-tiwate-04.png)

这是在对格式进行判断。

另一个就是核心加密。

然后看核心加密函数。

![核心加密附近的伪代码](/images/sparkctf-week4-tiwate-05.png)

![异常处理分支](/images/sparkctf-week4-tiwate-06.png)

ber 这啥呀，没有找到加密。

但是在反汇编里面有一个 `call sub_140001807`。

![反汇编里被切断的 call](/images/sparkctf-week4-tiwate-07.png)

这个函数没有在伪代码里面显示，后面有部分直接被切断了。

查看这个函数：

```c
__int64 __fastcall sub_140001807(int a1, int a2, int a3, _DWORD *a4, int a5, int a6)
{
  __int64 v7; // [rsp+2Ch] [rbp-24h]
  int v8; // [rsp+34h] [rbp-1Ch]
  int i; // [rsp+44h] [rbp-Ch]
  __int64 v11; // [rsp+48h] [rbp-8h]

  HIDWORD(v11) = *a4;
  LODWORD(v11) = a4[1];
  for ( i = 0; i <= 1; ++i )
  {
    v8 = dword_140014060[a3 + i];
    HIDWORD(v7) = v11;
    LODWORD(v7) = HIDWORD(v11) ^ v8 ^ _ROL4___w(a1, a2, n5: 5, a4: (int)v11 + v8);
    v11 = v7;
  }
  *a4 = HIDWORD(v11);
  a4[1] = v11;
  return (unsigned int)v11;
}
```

分析一下。

询问了一下 AI 有关 `HIDWORD`、`LODWORD`、`__ROL4__`。

`HIDWORD` 和 `LODWORD`：作用只是把 64 位变量切成两半。

`__ROL4__`：32 位循环左移。

a4 应该是要处理的输入，把输入分成了高低位两个组。

将 a4[0] 存为 v11 的高位，将 a4[1] 存为 v11 的低位。

再将 v11 的低位存为副本 v7 的高位，然后用 v11 的高位和（rol）低位经过算法，存为副本 v7 的低位，然后将 v7 覆盖 v11，循环两次。

再将经过加密运算后的 v11 的高位赋给 a4[0]，低位赋给 a4[1]。

大致应该是如此。试一下能不能让它显示出来，我将 191F 上面的 call 那句改成了 jmp，直接跳转到下面的加密，于是：

```c
for ( j = 0; j <= 2; ++j )
      sub_7FF64C6B1807(a1: v8, a2: v9, a3: 2 * i, a4: (_DWORD *)(8 * j + a4), a5: v10, a6: v11);
```

可以看到，实际上有三次循环，分别传入的是 a4[0]、a4[8]、a4[16]。对应在里面处理 64 位，3 次循环恰好处理 24 字节。然后也补齐了缺少的 a3（最外面也有一个 i 的循环）。

在比较里面，两个 buf 都没有值，但是有个 `&Size_`，找到，猜测其为密文。

看汇编：

```asm
048 lea     rax, [rbp-32]
048 mov     r8d, 18h
048 lea     rdx, Size_      ; Size
048 mov     rcx, rax
048 call    memcmp
```

可以看到，rcx、rdx、r8d。所以 `&Size_` 里面就是比较的密文了。

也能动调，断在 call 前，看 rdx 的实际值，实际就是这样。

---

## 解密

```c
#include <stdio.h>
#include <stdint.h>

static const uint32_t K[6] = {0x13572468, 0xA1B2C3D4, 0x0BADF00D,
                              0x55AA33CC, 0x31415926, 0x27182818};

int main(void)
{
    uint32_t v[6] = {0xDB74E57D, 0xAEBA5126, 0x99888F8B,
                     0x5CEDFCF2, 0xB4E121DA, 0xF1FFA30F};

    for (int b = 0; b < 3; b++) {
        uint32_t x = v[2 * b], y = v[2 * b + 1];
        for (int i = 5; i >= 0; i--) {
            uint32_t k = K[i], s = x + k;
            uint32_t t = y ^ k ^ (s << 5 | s >> 27);
            y = x, x = t;
        }
        v[2 * b] = x, v[2 * b + 1] = y;
    }
    printf("flag{");
    for (int i = 0; i < 6; i++)
        putchar(v[i] & 0xff), putchar(v[i] >> 8 & 0xff),
        putchar(v[i] >> 16 & 0xff), putchar(v[i] >> 24 & 0xff);
    printf("}\n");
    return 0;
}
```

输出：

```text
flag{except10ns_are_the_path!}
```

---

## 提问

为什么一开始反编译会缺那么多信息？

1. **数据类缺失（`buf1`/`buf2` 黄色没值）** —— 这类缺失不是反编译失败，而是**静态分析根本看不到**。
2. **结构类缺失（catch 块丢了、参数很多、表达式乱）** —— 这类缺失是**推断失败**。

---

就这样吧。
