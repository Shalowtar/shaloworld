---
title: 'SparkCTF week3 · asala'
summary: 'UPX 壳头 UPX! 被改成 UPY!，改回后脱壳；IDA 里是 24 字节置换加 XXTEA，动调绕置换失败，最后写脚本逆解并回填。'
category: Reverse
subcategories: ['SparkCTF2026', 'week3']
event: SparkCTF
tags: ['逆向', 'C语言', 'SparkCTF2026']
tools: ['IDA', 'UPX', 'DIE']
publishedAt: 2026-11-22T09:30:00+08:00
---

来复现一下这道题。

## 文件侦察

先用 DIE 看一下：

```text
(Heur) Protection: Generic [Section #0 ("UPX0") has RWX + IAT directory empty]
(Heur) Packer: UPX (3.91+) [Suspicion only]
(Heur) Packer: Generic [EntryPoint + Structure and IAT like UPX + Imports like UPX (v3.91+) + Sections like UPX + Sections collision ("UPX") + Section #1 ("UPX1") compressed + Section #0 ("UPX0") has wrong size + Section #0 ("UPX0") and #1 ("UPX1") have one offset + High entropy]
```

看来是加壳了，而且壳头还被魔改了。

![UPX 壳头里的 UPX! 被改成 UPY!](/images/sparkctf-week3-asala-upy.png)

可以看到壳头的 `UPX!` 被魔改成了 `UPY!`，改回来即可。

```bash
upx -d challenge.exe
```

```text
                       Ultimate Packer for eXecutables
                          Copyright (C) 1996 - 2024
UPX 4.2.4       Markus Oberhumer, Laszlo Molnar & John Reiser    May 9th 2024

        File size         Ratio      Format      Name
   --------------------   ------   -----------   -----------
     89600 <-     30720   34.29%    win64/pe     challenge.exe

Unpacked 1 file.
```

然后 IDA 打开分析。

逻辑很简单，一个格式判定，一个内容判定：

- 格式要求 `flag{24字节}`
- 内容要求：加密后的输入和标准数组一致

逆向思路：逆加密算法，通过标准数组逆解出正确输入。

## 静态分析

看了一下加密，和之前做过的一道题很像，区别只有密钥生成这里：

```c
for ( j = 0; j <= 3; ++j )
    *((_DWORD *)v2 + j) = dword_140014080[j] ^ 0xA5A5A5A5;
```

也是 XXTEA。

先列一下加密相关的代码。

打乱：

```c
for ( i = 0; i <= 23; ++i )
    *((_BYTE *)Buf1_1 + i) = *(_BYTE *)(byte_140014060[i] + a1);
```

密钥生成：

```c
for ( j = 0; j <= 3; ++j )
    *((_DWORD *)v2 + j) = dword_140014080[j] ^ 0xA5A5A5A5;
```

加密：

```c
n14 = 14;
v7 = 0;
for ( i = *((_DWORD *)Buf1 + 5); ; i = *((_DWORD *)Buf1 + 5) )
{
  result = n14--;
  if ( (_DWORD)result == 0 )
    break;
  v7 -= 1640531527;
  v5 = (v7 >> 2) & 3;
  for ( j = 0; j < 5; ++j )
  {
    v2 = sub_140001892(i, a2: *((_DWORD *)Buf1 + j + 1), a3: v7, a4: a2, j, a6: v5);
    v3 = (unsigned int *)Buf1 + j;
    *v3 += v2;
    i = *v3;
  }
  *((_DWORD *)Buf1 + 5) += sub_140001892(i, a2: *(_DWORD *)Buf1, a3: v7, a4: a2, j, a6: v5);
}
return result;
```

宏：

```c
return (((4 * a2) ^ (i >> 5)) + ((a2 >> 3) ^ (16 * i))) ^ ((a2 ^ a3) + (i ^ *(_DWORD *)(4LL * (a6 ^ j & 3u) + a4)));
```

数据（Hex）：

```text
byte_140014060  01 06 0B 10 15 02 07 0C
                11 16 03 08 0D 12 17 04
                09 0E 13 00 05 0A 0F 14
dword_140014080 C8FF99B2 344711A2
                AABB8899 0013627D
Buf2_           DA BE 03 32 82 9E 9E 30
                81 C8 97 DA 0B 30 24 AF
                FB C6 E3 EA 46 AA 84 62
```

## 动调尝试

这边不太想写解密代码，想用动调拿打乱后的明文，再置换回来就行。

所以我想设置 EIP 在这里，跳过置换：

```c
for ( j = 0; j <= 3; ++j )
    *((_DWORD *)v2 + j) = dword_140014080[j] ^ 0xA5A5A5A5;
  sub_1400018F4(Buf1, a2: (int)v2);
```

然后在 `Buf1` 传入加密之前，将 `Buf1` 的内存数据换成 `Buf2`。

加密完后，看 `Buf1` 的内存地址，就能看到置换后的明文了。

动调：

```text
7FF608281A94//EIP
```

```text
7FF608281ADE lea     rax, [rbp-64]//Buf1的地址
```

```text
7FF608281AE2 mov     rcx, rax//下断点，修改
```

```text
7FF608281AEA lea     rax, [rbp-64]//下断点，看内存
```

开始：

```text
00000006699FE9A9  23 24 5F 4A A7 B0 21 6B 0C 99 4F D7 45 AD A3 8A  #$_J§°!k..O×E.£.
00000006699FE9B9  18 36 06 29 A5 F7 C9 1F 00 80 00 00 00 00 00 80  .6.)¥÷É.........
```

怎么是乱码，再试试：

```text
000000256ABFE499  DE 9F 77 41 F0 0D 89 4F D6 E6 E1 77 E1 C1 55 7F  Þ.wAð..OÖæáwáÁU.
000000256ABFE4A9  28 A3 F8 58 12 15 0B 6B 00 80 00 00 00 00 00 80  (£øX...k.........
```

哪里出问题了呢？

额啊，搜了一下，XXTEA 不能直接通过加密代码再过一次得到明文，还是需要写解密代码才能解。

创建文件时才发现，我之前写过，直接贴：

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>

int calc(unsigned int i, unsigned int a2, int a3, const uint32_t* a4, char j, int a6)//计算mz
{
	return (((a2 << 2) ^ (i >> 5)) + ((a2 >> 3) ^ (i << 4))) ^ ((a2 ^ a3) + (i ^ a4[a6 ^ (j & 3u)]));
}
int encrypto(uint32_t* v, const uint32_t* key)
{
	uint32_t mz;
	unsigned int sum = 0;
	unsigned int i, j;
	uint32_t e;
	i = v[5];
	for (int r = 0;r < 14;++r)//外循环，循环14轮
	{
		sum -= 1640531527u;
		e = (sum >> 2) & 3;
		for (j = 0; j < 5; ++j)//内循环，循环6轮，生成新v[0-5]
		{
			mz = calc(i, v[j + 1], sum, key, j, e);//用v[i-1]和v[i+1]得到mz
			v[j] += mz;//用mz来给v[i]赋新值
			i = v[j];//将新的v[i]存值，便于下一轮
		}
		v[5] += calc(i, v[0], sum, key, j, e);
		i = v[5];
	}
	return 0;
}
int decrypto(uint32_t* v, const uint32_t* key)
{
	int r, j;
	uint32_t delta = 0x9E3779B9u;
	uint32_t sum = delta * 14u;
	for (r = 0;r < 14;++r)//外循环，循环14轮
	{
		uint32_t  e = (sum >> 2) & 3;//依旧得到e，用于生成mz
		v[5] -= calc(v[4], v[0], sum, key, 5, e);//得到旧v[5]，保持每轮v[5]是旧值
		for (j = 4;j >= 0;--j) //内循环，循环5轮，用于还原v[0-4]
		{
			uint32_t prev = (j == 0) ? v[5] : v[j - 1];//取前一个值
			uint32_t next = v[j + 1];//取后一个值
			v[j] -= calc(prev, next, sum, key, (unsigned)j, e);//用前后两个值来生成mz，再将v[i]还原为旧值
		}
		sum -= delta;//每轮循环递减
	}
	return 0;
}
int main()
{
	int i, j;
	char b60[24] =
	{ 0x01, 0x06, 0x0B, 0x10,
	  0x15, 0x02, 0x07, 0x0C,
	  0x11, 0x16, 0x03, 0x08,
	  0x0D, 0x12, 0x17, 0x04,
	  0x09, 0x0E, 0x13, 0x00,
	  0x05, 0x0A, 0x0F, 0x14 };//标准表
	uint32_t b80[4] = { 0xC8FF99B2 ,0x344711A2 ,0xAABB8899 ,0x13627D };//标准数组
	uint32_t v[6] = {
	   0x829E9E30u, 0xDABE0332u,
	   0x0B3024AFu, 0x81C897DAu,
	   0x46AA8462u, 0xFBC6E3EAu };//密文
	uint32_t key[4];
	for (j = 0;j <= 3;++j)
		key[j] = b80[j] ^ 0xA5A5A5A5;//生成密钥
	decrypto(v, key);//传入密文密钥进行解密
	unsigned char plain[24];
	memcpy(plain, v, 24);//将解密后的v赋值给plain

	int inv[24];
	for (i = 0; i < 24; ++i)
		inv[(unsigned char)b60[i]] = i;//建立逆表

	unsigned char input[24];
	for (j = 0; j < 24; ++j)
		input[j] = plain[inv[j]];//回填

	printf("flag{");
	for (i = 0; i < 24; ++i)
		putchar(input[i]);
	printf("}");
	putchar('\n');

	return 0;
}
```

## 复盘

想起来了，之前就是这个逆表的问题卡了，还有什么问题记不得了，先这样吧。

---

就这样吧。
