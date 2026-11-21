---
title: 'SparkCTF week2 · manbo'
summary: '第一次不靠 AI 自己写解密：把 IDA 里抠出来的加密逻辑反着写，踩了下标错位、大小端和 char 符号扩展三个坑，最后跑出 flag。'
event: 'SparkCTF'
category: Reverse
subcategories: ['SparkCTF2026', 'week2']
tags: ['逆向', 'C语言', 'SparkCTF2026']
publishedAt: 2026-11-19T02:05:00+08:00
tools: ['IDA']
---

之前新生赛时靠 AI 写解密，现在自己来写，进行复现。

解密用的 C 代码里有从 IDA 抠出来的加密代码，因为 C 语言掌握得不熟练，就抠下来对照着写。

## 第一版：照着加密反过来写

```c
#include <stdio.h>
#include <stdint.h>
__int64 orl[24];
unsigned __int8 s[24] =
{
  0x7B, 0xE0, 0x22, 0x01, 0x38, 0xD1, 0xEC, 0x01,
  0x27, 0x38, 0x85, 0xD7, 0xDC, 0xCD, 0x02, 0x28,
  0xF5, 0x90, 0x42, 0x73, 0x32, 0x01, 0x80, 0x9C
};
unsigned __int8 b40[32] =
{
  0x17, 0x29, 0x43, 0x61, 0x83, 0xA7, 0xC1, 0xE3,
  0x35, 0x72, 0x19, 0xB4, 0x5D, 0x90, 0xEE, 0x08,
  0x6A, 0x2C, 0xF1, 0x47, 0x9B, 0xD0, 0x54, 0x7E,
  0x11, 0x88, 0xCD, 0x3F, 0xA2, 0x65, 0x0B, 0xDA
};
unsigned __int8 b60[32] =
{
  0x52, 0x31, 0x77, 0x18, 0xD2, 0x44, 0x9A, 0x0F,
  0xBC, 0x26, 0x63, 0xE8, 0x05, 0x91, 0x4A, 0xD7,
  0x39, 0xAF, 0x10, 0x6C, 0xF5, 0x82, 0x2D, 0xC0,
  0x74, 0x1B, 0x98, 0x56, 0xE1, 0x03, 0xBD, 0x49
};
unsigned __int8 b4020[24];
__int64 def()
{
    int v0;
    __int64 x;
    unsigned int y;
    unsigned int z;
    int i;
    int j;
    y = -1056969199;
    for (i = 0; i <= 31; ++i)
    {
        v0 = y ^ (b40[i] << (8 * (i & 3)));
        x = v0 + (unsigned int)b60[31 - i] - 1640531527;
        y = v0 + b60[31 - i] - 1640531527;
    }
    for (j = 0; j <= 23; ++j)
    {
        z = (((y << 13) ^ y) >> 17) ^ (y << 13) ^ y;
        y = (32 * z) ^ z;
        x = j;
        b4020[j] = (61 * j)
            ^ b60[((char)j + (((unsigned __int8)y ^ (unsigned __int8)(11 * j)) & 0x1F) + 7) & 0x1F]
            ^ b40[((unsigned __int8)y ^ (unsigned __int8)(11 * j)) & 0x1F]
            ^ (y >> (8 * (j & 3)));
    }
    return x;
}
unsigned __int64 encrypto(__int64 *input, char *output)
{
    int i;
    char y[24];
    unsigned __int64 v7 = 0x28u;
    for (i = 0; i <= 23; ++i)
    {
        uint8_t x = input[i] ^ b4020[i];
        y[i] = (2 * x) | (x >> 7);
    }
    for (int j = 0; j <= 23; ++j)
        output[j] = y[(j + 19) % 24];
    return v7 - 0x28u;
}
unsigned __int64 decrypto(unsigned __int8 *s, __int64 *orl)
{
    int i;
    int j;
    char y[24];
    for (int j = 0; j <= 23; ++j)
    {
        y[(j + 19) % 24] = s[j];
    }
    for (i = 0; i <= 23; ++i)
    {
        uint8_t x;

        x = (y[i] >> 1) | (y[i] << 7);
        orl[i] = x ^ b4020[i];
    }
    return 0;
}
int main()
{
    def();
    decrypto(s, orl);
    printf("flag={");
    for (int i = 0; i <= 23; i++)
    {
        putchar(orl[i]);
    }
    printf("}\n");
    return 0;
}
```

**打印出乱码**

```text
flag={劃m?{鎑PB趿嬉琳譜2悾(-}
```

这啥呀。。。

## 错误一：下标没真正反过来

**我只是简单地把他俩换了个位，实际上下标的对应不对。**

加密里写的是：

```text
output[j] = y[(j + 19) % 24];
```

我在解密里写成了：

```text
y[(j + 19) % 24] = s[j];
```

看上去像把等号两边调了个位置，但 `output` 的下标是 `j`、`y` 的下标是 `(j + 19) % 24`，两边根本不是同一个位置。正确的做法是先把下标解出来：记 `k = (j + 19) % 24`，那么 `j = (k + 5) % 24`，逆运算就是

```text
y[k] = s[(k + 5) % 24];
```

也就是代码里的 `y[j] = s[(j + 5) % 24]`。

## 错误二：密文没按小端展开

`s` 那串密文，在 IDA 里是按 qword 存的，每个 qword 8 个字节、小端排列。我一开始把 hex 从高位往低位直接抄成了一维数组：

```text
错的
 0x7B, 0xE0, 0x22, 0x01, 0x38, 0xD1, 0xEC, 0x01,
 0x27, 0x38, 0x85, 0xD7, 0xDC, 0xCD, 0x02, 0x28,
 0xF5, 0x90, 0x42, 0x73, 0x32, 0x01, 0x80, 0x9C
正确的
 0xC1, 0x1E, 0x8D, 0x13, 0x20, 0x02, 0xBE, 0x07,
 0x28, 0x02, 0xCD, 0xDC, 0xD7, 0x85, 0x38, 0x27,
 0x9C, 0x80, 0x01, 0x32, 0x73, 0x42, 0x90, 0xF5
```

正确做法是每 8 个字节一组倒过来写：`0x07BE0220_138D1EC1` 这组，内存里从低字节开始依次是 `C1 1E 8D 13 20 02 BE 07`。

## 错误三：char 的符号扩展

```text
原本 char y[24];
打印出：flag={m磏b0_鉧t_r躅s_at遙oot!!}

改成 unsigned char y[24];
打印出：flag={m4nb0_cat_runs_at_boot!!}
```

`char` 默认是有符号的，`y[i] >> 1` 会先做符号扩展，负数右移高位补 1，`(y[i] >> 1) | (y[i] << 7)` 得到的就不是循环右移了。把缓冲区换成 `unsigned char`，右移才是逻辑右移，结果才对。

## 改对之后

```c
#include <stdio.h>
#include <stdint.h>
__int64 orl[24];
unsigned __int8 s[24] =
{
 0xC1, 0x1E, 0x8D, 0x13, 0x20, 0x02, 0xBE, 0x07,
 0x28, 0x02, 0xCD, 0xDC, 0xD7, 0x85, 0x38, 0x27,
 0x9C, 0x80, 0x01, 0x32, 0x73, 0x42, 0x90, 0xF5
};
unsigned __int8 b40[32] =
{
  0x17, 0x29, 0x43, 0x61, 0x83, 0xA7, 0xC1, 0xE3,
  0x35, 0x72, 0x19, 0xB4, 0x5D, 0x90, 0xEE, 0x08,
  0x6A, 0x2C, 0xF1, 0x47, 0x9B, 0xD0, 0x54, 0x7E,
  0x11, 0x88, 0xCD, 0x3F, 0xA2, 0x65, 0x0B, 0xDA
};
unsigned __int8 b60[32] =
{
  0x52, 0x31, 0x77, 0x18, 0xD2, 0x44, 0x9A, 0x0F,
  0xBC, 0x26, 0x63, 0xE8, 0x05, 0x91, 0x4A, 0xD7,
  0x39, 0xAF, 0x10, 0x6C, 0xF5, 0x82, 0x2D, 0xC0,
  0x74, 0x1B, 0x98, 0x56, 0xE1, 0x03, 0xBD, 0x49
};
unsigned __int8 b4020[24];
__int64 def()
{
    int v0;
    __int64 x;
    unsigned int y;
    unsigned int z;
    int i;
    int j;
    y = -1056969199;
    for (i = 0; i <= 31; ++i)
    {
        v0 = y ^ (b40[i] << (8 * (i & 3)));
        x = v0 + (unsigned int)b60[31 - i] - 1640531527;
        y = v0 + b60[31 - i] - 1640531527;
    }
    for (j = 0; j <= 23; ++j)
    {
        z = (((y << 13) ^ y) >> 17) ^ (y << 13) ^ y;
        y = (32 * z) ^ z;
        x = j;
        b4020[j] = (61 * j)
            ^ b60[((char)j + (((unsigned __int8)y ^ (unsigned __int8)(11 * j)) & 0x1F) + 7) & 0x1F]
            ^ b40[((unsigned __int8)y ^ (unsigned __int8)(11 * j)) & 0x1F]
            ^ (y >> (8 * (j & 3)));
    }
    return x;
}
unsigned __int64 encrypto(__int64* input, char* output)
{
    int i;
    int j;
    char y[24];
    unsigned __int64 v7 = 0x28u;
    for (i = 0; i <= 23; ++i)
    {
        uint8_t x = input[i] ^ b4020[i];
        y[i] = (2 * x) | (x >> 7);
    }
    for (int j = 0; j <= 23; ++j)
        output[j] = y[(j + 19) % 24];
    return v7 - 0x28u;
}
unsigned __int64 decrypto(unsigned __int8* s, __int64* orl)
{
    int i;
    int j;
    unsigned char y[24];
    for (int j = 0; j <= 23; ++j)
    {
        y[j] = s[(j + 5) % 24];
    }
    for (i = 0; i <= 23; ++i)
    {
        uint8_t x;

        x = (y[i] >> 1) | (y[i] << 7);
        orl[i] = x ^ b4020[i];
    }
    return 0;
}
int main()
{
    def();
    decrypto(s, orl);
    printf("flag={");
    for (int i = 0; i <= 23; i++)
    {
        putchar(orl[i]);
    }
    printf("}\n");
    return 0;
}
```

```text
flag={m4nb0_cat_runs_at_boot!!}
```

## 总结

1. **下标映射要真解方程，不能"换个位置"**。加密是 `output[j] = y[(j + 19) % 24]`，逆运算要先设 `k = (j + 19) % 24`、解出 `j = (k + 5) % 24`，才有 `y[k] = s[(k + 5) % 24]`。直接把等号两边调过来，看着像逆操作，实际把密文的第 `j` 位放到了错误的位置。
2. **大小端问题**。`s2` 是 3 个 qword，每个 qword 在内存里小端排列，转字节数组要从低字节往高字节写；按 hex 字符串从左往右抄，每组 8 字节正好全反。
3. **`char` 默认是 signed**。有符号字节右移是算术右移，高位补 1，`(y[i] >> 1) | (y[i] << 7)` 就不再是循环右移。换成 `unsigned char`，才是逻辑右移。
4. **循环移位**：加密 `(2 * x) | (x >> 7)` 是 8 位循环左移 1 位，解密 `(y >> 1) | (y << 7)` 是循环右移 1 位，两边都必须按无符号字节算。
