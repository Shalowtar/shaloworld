---
title: '一个解密代码'
summary: 'moectf 的一道逆向题：反编译出一段循环里做异或与移位的加密，自己写解密函数还原数据，再用 x64dbg 动调验证结果。'
category: Reverse
subcategories: ['其他']
tags: ['C语言学习', '逆向']
publishedAt: 2026-11-18T21:30:00+08:00
tools: ['IDA', 'x64dbg']
---

我要疯了，当然，这个动调很好解，不过我想练习自己写解密，顺便提高 C 语言能力，然后我有点无语。

## 题目原伪代码

```c
int __fastcall main_0(int argc, const char **argv, const char **envp)
{
  char *v3; // rdi
  __int64 i; // rcx
  char v6; // [rsp+20h] [rbp+0h] BYREF
  _BYTE v7[80]; // [rsp+28h] [rbp+8h] BYREF
  _DWORD v8[56]; // [rsp+78h] [rbp+58h] BYREF

  v3 = &v6;
  for ( i = 34; i != 0; --i )
  {
    *(_DWORD *)v3 = -858993460;
    v3 += 4;
  }
  j___CheckForDebuggerJustMyCode(a1: &unk_140022067, a2: argv, a3: envp);
  v7[0] = -94;
  v7[1] = 5;
  v7[2] = 105;
  v7[3] = -117;
  v7[4] = -38;
  v7[5] = 23;
  v7[6] = 5;
  v7[7] = -31;
  v7[8] = -36;
  v7[9] = -52;
  v7[10] = -52;
  v7[11] = -63;
  v7[12] = 100;
  v7[13] = 116;
  v7[14] = -6;
  v7[15] = 80;
  v7[16] = -43;
  v7[17] = -95;
  v7[18] = -102;
  v7[19] = -84;
  v7[20] = -36;
  v7[21] = -34;
  v7[22] = 100;
  v7[23] = -65;
  v7[24] = -108;
  v7[25] = 45;
  v7[26] = 35;
  v7[27] = -13;
  v7[28] = 1;
  v7[29] = -43;
  v7[30] = 98;
  v7[31] = -56;
  v7[32] = -22;
  v7[33] = -83;
  v7[34] = -46;
  v7[35] = -42;
  v7[36] = 42;
  v7[37] = 80;
  v7[38] = 94;
  v7[39] = 107;
  v7[40] = 115;
  v7[41] = 12;
  v7[42] = -3;
  v7[43] = -116;
  v7[44] = 61;
  v7[45] = 56;
  v7[46] = 61;
  v7[47] = -47;
  v8[0] = -889275714;
  v8[1] = -559038242;
  v8[2] = 866566;
  v8[3] = 1131796;
  sub_14001129E(a1: v7, a2: 4294967284LL, a3: v8);
  sub_1400113D4(a1: "What happened to my Flag?\n");
  sub_14001129E(a1: v7, a2: 12, a3: v8);
  sub_1400113D4(a1: "Your Flag has REencrypted.");
  return 0;
}
```

逻辑很简单，直接去看加密（中间有个跳转 thunk，直接跳过了）。

```c
__int64 __fastcall sub_140011820(int *a1, __int64 a2, __int64 a3)
{
  __int64 result; // rax
  unsigned int v4; // [rsp+24h] [rbp+4h]
  unsigned int v5; // [rsp+24h] [rbp+4h]
  unsigned int v6; // [rsp+44h] [rbp+24h]
  unsigned int v7; // [rsp+44h] [rbp+24h]
  unsigned int v8; // [rsp+44h] [rbp+24h]
  unsigned int v9; // [rsp+64h] [rbp+44h]
  unsigned int v10; // [rsp+64h] [rbp+44h]
  unsigned int j; // [rsp+84h] [rbp+64h]
  int i; // [rsp+84h] [rbp+64h]
  int v13; // [rsp+A4h] [rbp+84h]
  int v14; // [rsp+A4h] [rbp+84h]
  int v15; // [rsp+C4h] [rbp+A4h]
  unsigned int v16; // [rsp+C4h] [rbp+A4h]
  int v17; // [rsp+194h] [rbp+174h]
  int v18; // [rsp+194h] [rbp+174h]
  int v19; // [rsp+194h] [rbp+174h]
  int v20; // [rsp+194h] [rbp+174h]
  int v22; // [rsp+1C8h] [rbp+1A8h]
  int v23; // [rsp+1C8h] [rbp+1A8h]

  v22 = a2;
  result = j___CheckForDebuggerJustMyCode(a1: &unk_140022067, a2, a3);
  if ( v22 <= 1 )
  {
    if ( v22 < -1 )
    {
      v23 = -v22;
      v14 = 52 / v23 + 6;
      v10 = 1131796 * v14;
      v5 = *a1;
      do
      {
        v16 = (v10 >> 2) & 3;
        for ( i = v23 - 1; i != 0; --i )
        {
          v7 = a1[i - 1];
          v19 = a1[i]
              - (((v7 ^ *(_DWORD *)(a3 + 4LL * (v16 ^ i & 3))) + (v5 ^ v10))
               ^ (((16 * v7) ^ (v5 >> 3)) + ((4 * v5) ^ (v7 >> 5))));
          a1[i] = v19;
          v5 = v19;
        }
        v8 = a1[v23 - 1];
        v20 = *a1
            - (((v8 ^ *(_DWORD *)(a3 + 4LL * v16)) + (v5 ^ v10)) ^ (((16 * v8) ^ (v5 >> 3)) + ((4 * v5) ^ (v8 >> 5))));
        *a1 = v20;
        v5 = v20;
        v10 -= 1131796;
        result = (unsigned int)--v14;
      }
      while ( v14 != 0 );
    }
  }
  else
  {
    v13 = 52 / v22 + 6;
    v9 = 0;
    v6 = a1[v22 - 1];
    do
    {
      v9 += 1131796;
      v15 = (v9 >> 2) & 3;
      for ( j = 0; j < v22 - 1; ++j )
      {
        v4 = a1[j + 1];
        v17 = (((v6 ^ *(_DWORD *)(a3 + 4LL * (v15 ^ j & 3))) + (v4 ^ v9))
             ^ (((16 * v6) ^ (v4 >> 3)) + ((4 * v4) ^ (v6 >> 5))))
            + a1[j];
        a1[j] = v17;
        v6 = v17;
      }
      v18 = (((v6 ^ *(_DWORD *)(a3 + 4LL * (v15 ^ j & 3))) + (*a1 ^ v9))
           ^ (((16 * v6) ^ ((unsigned int)*a1 >> 3)) + ((4 * *a1) ^ (v6 >> 5))))
          + a1[v22 - 1];
      a1[v22 - 1] = v18;
      v6 = v18;
      result = (unsigned int)--v13;
    }
    while ( v13 != 0 );
  }
  return result;
}
```

这里面解密加密都写了，不过因为是要练习写解密，所以我将加密部分贴了过去。

---

## 解密代码

下面是写了改了，问 AI，再改，然后得到的代码。

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>
__int64 result;
uint32_t x;
uint32_t v5;
uint32_t z;
uint32_t v8;
uint32_t sum;
uint32_t v10;
int i;
int r;
int v14;
int e;
uint32_t v16;
uint32_t y;
uint32_t y_1;
int v19;
int v20;
int n;
int v23;
int delta;
__int64 encrypto(int* a1, __int64 a2, __int64 a3)
{
    unsigned int j;
    n = a2;//n=12
    delta = 1131796;
    r = 52 / n + 6;//r=10
    sum = 0;
    z = a1[n - 1];
    do
    {
        sum += 1131796;
        e = (sum >> 2) & 3;
        for (j = 0; j < n - 1; ++j)//0-10,共11轮
        {
            x = a1[j + 1];
            y = (((z ^ *(int*)(a3 + 4LL * (e ^ j & 3))) + (x ^ sum))
                ^ (((16 * z) ^ (x >> 3)) + ((4 * x) ^ (z >> 5))))
                + a1[j];
            a1[j] = y;
            z = y;
        }
        y_1 = (((z ^ *(int*)(a3 + 4LL * (e ^ j & 3))) + (*a1 ^ sum))
            ^ (((16 * z) ^ ((unsigned int)*a1 >> 3)) + ((4 * *a1) ^ (z >> 5))))
            + a1[n - 1];//最后处理a1[11]
        a1[n - 1] = y_1;
        z = y_1;
        result = (unsigned int)--r;//10-0，共11轮
    } while (r != 0);
    return result;
}
__int64 decrypto(int* a1, __int64 a2, int* a3)
{
    n = a2;
    r = 52 / n + 6;
    delta = 1131796;
    sum = r * delta;
    z = a1[n - 1];
    do
    {
        e = (sum >> 2) & 3;
        z = a1[10];
        y_1 = a1[11]//最先还原a1[11]
            - (((z ^ a3[(e ^ 11) & 3]) + (*a1 ^ sum))
                ^ (((16 * z) ^ ((unsigned int)*a1 >> 3)) + ((4 * *a1) ^ (z >> 5))));
        a1[11] = y_1;
        z = y_1;
        for (int j = 10;j > 0;--j)//倒序11轮
        {
            x = a1[j + 1];
            z = a1[j - 1];
            y = a1[j]
                - (((z ^ a3[(e ^ j) & 3]) + (x ^ sum))
                    ^ (((16 * z) ^ (x >> 3)) + ((4 * x) ^ (z >> 5))));
            a1[j] = y;
            z = y;
        }
        x = a1[1];
        z = a1[11];
        y = a1[0]
            - (((z ^ a3[(e ^ 0) & 3]) + (x ^ sum))
                ^ (((16 * z) ^ (x >> 3)) + ((4 * x) ^ (z >> 5))));
        a1[0] = y;
        sum -= delta;
        result = (unsigned int)--r;
    } while (r != 0);
    return 0;
}
int v7[] =
{   0x8B6905A2,0xE10517DA,0xC1CCCCDC,0x50FA7464,
    0xAC9AA1D5,0xBF64DEDC,0xF3232D94,0xC862D501,
    0xD6D2ADEA,0x6B5E502A,0x8CFD0C73,0xD13D383D };
int v48[] =
{ 0xCAFEBABE,0xDEADC0DE,0x000D3906,0x00114514 };
int main()
{
    decrypto(v7, 12, v48);
    unsigned char* p = (unsigned char*)v7;
    for (i = 0;i < 48;i++)
    {
        putchar(p[i]);
    }
    return 0;
}
```

最后，经过不知道多少折腾，终于输出正常东西了。

```text
moectf{18d4c944-947c-4808-9536-c7d34d6b3827}
```

好难写，，，啊啊啊。

---

## 动调

在 IDA 反汇编里面找到被修改的数组地址：

```text
rbp+8
```

然后找到解密分支，根据 if 判断里面走解密分支的条件，能定位解密位置。

```text
00007FF74F4A1EE6 178 E8 B3 F3 FF FF                call    sub_7FF74F4A129E
```

接着在 x64dbg 里面给这个地址下断点，F9 运行到断点处，F8 单步过去，在内存里面跳转到 rbp+8。

```text
000000B81A2FF578  6D 6F 65 63 74 66 7B 31 38 64 34 63 39 34 34 2D  moectf{18d4c944-
000000B81A2FF588  39 34 37 63 2D 34 38 30 38 2D 39 35 33 36 2D 63  947c-4808-9536-c
000000B81A2FF598  37 64 33 34 64 36 62 33 38 32 37 7D 00 00 00 00  7d34d6b3827}....
```

就得到了 flag。

---

## 总结

我 C 语言还不太行，还得练。

遇到一个反调试的题，给我搞无语了。

我逆向的能力太弱了，还得加油。

接下来还是主要以 C 语言为主，然后再去了解和学习一些其他的吧。
