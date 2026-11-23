---
title: 'R3CTF2025 · Neon Deceit'
summary: '程序表面只打印 hello world，真正的逻辑藏在没被 IDA 识别成函数的代码里；argc 必须为 7 才进入 ncurses 迷宫，输入十六进制路径，BFS 求最短路拿 flag。'
category: Reverse
subcategories: ['其他']
event: R3CTF2025
tags: ['逆向', 'R3CTF2025']
tools: ['IDA', 'Python']
publishedAt: 2026-11-24T01:05:00+08:00
---

我并非解决了此题，但我确实从中了解到了新的东西，也算是有收获

解决不了的原因之一是我还看不了汇编，而此题需要看汇编来解（我认为）

还有个人能力的低下。然后此题一开始让我摸不着头脑

之后能力足够了再进行复现，现在仅作学习了解

---

## 题目信息

```text
Description
In the neon-lit underbelly of the city, even your tools are programmed to betray you. Trust nothing... the lies are embedded in the code.
```

这提示我们，我们看到的都是假的

---

## 初步侦察

![题目描述与程序信息](/images/r3ctf2025-neon-deceit-01.png)

运行

![运行后只输出 hello world](/images/r3ctf2025-neon-deceit-02.png)

"hello world",hello world?!没错，就是这个，运行就只有这个

当时看到运行只有hello world时就有点疑惑，由于最近看到了一个花指令藏东西的文章，不由自主想到是花指令把真实逻辑藏起来了，于是进入ida看反汇编。而且，文件有300多kb，不可能就一个hallo world就完了。

进入后直接在字符串里面搜这个hallo world，也看到了一些关键的东西

![IDA 字符串窗口里的关键字符串](/images/r3ctf2025-neon-deceit-03.png)

可以看到“Access Denied”，”[%-30s]"，"Enter..."，“R3CTF”这些看着就像是关键信息的字符串，可是交叉引用过去

![关键字符串的交叉引用指向未构建成函数的代码](/images/r3ctf2025-neon-deceit-04.png)

可以看到，这个是没有被构建成函数的

又找到了打印“hello world”的函数

![打印 hello world 的函数与 argc 比较](/images/r3ctf2025-neon-deceit-05.png)

下面有一个

```asm
.text:0000000000059700 83 7D FC 07                       cmp     dword ptr [rbp-4], 7
.text:0000000000059704 75 0C                             jnz     short loc_59712
.text:0000000000059704
.text:0000000000059706 B8 00 00 00 00                    mov     eax, 0
.text:000000000005970B E8 87 EE FB FF                    call    loc_18597
```

可以看到，这里比较了一个7，然后跳转两个分支

loc_59712

```asm
.text:0000000000059712                                   loc_59712:                              ; CODE XREF: .text:0000000000059704↑j
.text:0000000000059712 48 8D 05 6F 6B 00 00              lea     rax, s                          ; "hello world"
.text:0000000000059719 48 89 C7                          mov     rdi, rax
.text:000000000005971C E8 7F C7 FB FF                    call    _realloc
.text:000000000005971C
.text:0000000000059721 BF 00 00 00 00                    mov     edi, 0
.text:0000000000059726 E8 B5 BB FB FF                    call    _pututxline
```

这里也有一个传字符串“hello world“的行为，但是程序运行没有打印两个”hello world“，可见有一个肯定是假的，结合题目，猜测前面那个明摆着的put和exit是假的，后面这个是真的。如果前面那个是真的，那么程序就只会运行那个main，我们可以根据其他条件再补充判断

然后看另一个分支

内容很多，往下翻，就能看到我们最开始在字符串里面看到的关键词

显然，这里才应该是真正的程序位置

我们再返回去看条件

```asm
cmp     dword ptr [rbp-4], 7
```

比较的是[rbp-4]和7

而前面将edi传入了[rbp-4]

```asm
mov     [rbp-4], edi
```

这个edi是什么呢，我们反向找调用main的start

```asm
.text:0000000000016D80                                   public start
.text:0000000000016D80                                   start proc near                         ; DATA XREF: LOAD:0000000000000018↑o
.text:0000000000016D80                                   ; __unwind {
.text:0000000000016D80 000 F3 0F 1E FA                   endbr64
.text:0000000000016D84 000 31 ED                         xor     ebp, ebp
.text:0000000000016D86 000 49 89 D1                      mov     r9, rdx                         ; rtld_fini
.text:0000000000016D89 000 5E                            pop     rsi                             ; argc
.text:0000000000016D8A -08 48 89 E2                      mov     rdx, rsp                        ; ubp_av
.text:0000000000016D8D -08 48 83 E4 F0                   and     rsp, 0FFFFFFFFFFFFFFF0h
.text:0000000000016D91 -08 50                            push    rax
.text:0000000000016D92 000 54                            push    rsp                             ; stack_end
.text:0000000000016D93 008 45 31 C0                      xor     r8d, r8d                        ; fini
.text:0000000000016D96 008 31 C9                         xor     ecx, ecx                        ; init
.text:0000000000016D98 008 48 8D 3D 39 29 04 00          lea     rdi, main                       ; main
.text:0000000000016D9F 008 FF 15 3B B2 04 00             call    cs:__libc_start_main_ptr
.text:0000000000016D9F
.text:0000000000016DA5 008 F4                            hlt
.text:0000000000016DA5                                   ; } // starts at 16D80
.text:0000000000016DA5
.text:0000000000016DA5                                   start endp
```

```asm
 pop     rsi                             ; argc
```

可以看到，没有push，直接将argc参数pop到rsi

然后`__libc_start_main` 里会走到 `__libc_start_call_main`，那里按 `main(argc, argv, envp)` 重新排寄存器

```asm
call    cs:__libc_start_main_ptr
```

也就是，argc最后会传到edi，然后实际于7比较的是argc参数数

然后我们重新运行程序，带上6个参数（程序本身有一个）

输入./Neon\ Deceit a b c d e f，于是

![带 6 个参数运行后进入另一段逻辑](/images/r3ctf2025-neon-deceit-06.png)

可以看到，运行了另一个程序，说明之前的判断是正确的。

![另一段逻辑里出现的输入与 R3CTF 字符串](/images/r3ctf2025-neon-deceit-07.png)

而这里的字符串，刚好就是那几个，所以真正的程序代码应该就是后面那些没有被划分成函数的

于是找到对应位置

wrong

```asm
lea     rax, aAccessDenied              ; "Access Denied."
```

correct

```asm
lea     rax, aR3ctfS                    ; "R3CTF{%s}\n"
```

那么大概是我们输入符合要求的字符串，然后成功时就输出后者了

现在需要找约束输入的部分

然后是一大堆我没办法去反编译的汇编

但是我看不懂这些汇编，于是交给AI了

---

## AI 如是说

这段汇编就是 `main` 的完整函数体（`0x18597` 到 `0x196B8`），没有任何外部逻辑：一个 ncurses 界面点亮起来，跑 1.5 秒假进度条，让你输入一串十六进制，然后按这串十六进制在 21×51 的图上逐格走一遍，走对了就 `printf("R3CTF{%s}\n", key)`。

**逻辑分段**

**1. `0x18597`–`0x185C8`　函数头** `push rbp; mov rbp,rsp`；`lea r11,[rsp-0x6000]`，循环 `sub rsp,0x1000; or [rsp],0` 直到 `rsp==r11`；再 `sub rsp,0xA50`。**结论：栈帧共 0x6A50，函数内不调用 alloca。**

**2. `0x185BF`　金丝雀** `mov rax, fs:28h; mov [rbp-8], rax`。**结论：栈保护开启，结尾必然有对应校验。**

**3. `0x185CE`–`0x18605`　第一次外部调用 + 失败退出** `edi=0, esi=0, edx=1, ecx=0` → 调用（伪名 `_vfwprintf`）；`test rax,rax; jns` 跳过；失败分支 `edi=&dirp, esi=2` 再调用（伪名 `_cimag`）。**结论：返回值按有符号判负，负值走 "错误码 2" 的终止出口。** 从 4 个参数形态和后面全程使用 `cs:stdscr` 看，这是 `initscr()`。

**4. `0x18606`–`0x1886E`　进程名检查（第 1 处，共 3 处同构）** `rbp-0x5C70` 起 1024 字节清零 → 零参调用（`getpid`，结果存 `rbp-0x6A34`）→ `snprintf(buf, 0x1000, "/proc/%d/comm", pid)` → `fopen(path,"r")` 存 `rbp-0x6A08`，NULL 直接跳到 `0x1886E` → `fgets(buf,0x3FF,fp)` → `fclose(fp)` → 在 `rbp-0x6920` 摆 7 个 `{指针,长度}` = 3/4/3/6/6/7/2（指针依次 `unk_63F78`、`63F7B`、`63F7F`、`63F82`、`63F88`、`63F8E`、`63F95`）→ 循环 7 次：逐字节 `xor 0x5A` 写到 `rbp-0x5EF0`、补 `\0`、`strstr(comm, 解出串)`（`rdi=comm, rsi=plain`），命中则 `esi=3` 走终止出口。 **结论：读 `getpid()` 自己的 comm，命中所解串即带错误码 3 终止；读不到文件则整段跳过、不终止。**

**5. `0x1886E`–`0x189DD`　自映像扫描（第 2 块，与上面共用同一批缓冲）** `realpath("/proc/self/exe", 0)` → `rbp-0x69E8`，NULL 则错误码 1 终止 → `fopen("/proc/self/maps","r")` → `rbp-0x69E0`，NULL 则先 `free(exe)` 再错误码 1 终止 → 循环 `fgets(line,0x1064,fp)`，`sscanf(line,"%lx-%lx %4s %*x %*x:%*x %*d %s", &start, &end, perm, name)`（返回不足 3 跳过）→ `strstr(name, exe)` 不中跳过 → 要求 `perm[0]=='r' && perm[1]=='-'` → `memcpy(rbp-0x68B0, (void*)start, end-start)`；循环直到 `fgets` 返回 NULL。**结论：把本 exe 的 `r-` 映射整段拷进栈。**

**6. `0x189E6`–`0x18A53`　取映像里的一个 dword 并调用** `fclose(fp)`；`free(...)`；`memcpy(rbp-0x5ED0, rbp-0x68B0, …)`；`memcpy(&v, rbp-0x5ED0 + 0x1C, 4)`；`mov eax,[rbp-0x6930]; mov [rbp-0x6A40],eax`；`edi = 该值` 单参调用（伪名 `_cfsetispeed`），返回值丢弃。 **结论：只有一个 int 入参、调用方不使用返回值，效果仅可能是副作用；入参来自刚拷进来的映像偏移 `+0x1C`。**

**7. `0x18A58`–`0x18A83`　两次内部调用 + 两处写字节** `rdi=&map`（`rbp-0x6760`）→ `call sub_17712`，**返回值未使用**；`rdi=&map` → `call sub_17A5F`，返回值存 `rbp-0x6A48`；`mov byte [rbp-0x6760+51], 0x20`；`mov byte [rbp-0x6760+19*51+50], 0x20`。 **结论：`map` 这 1071 字节由 `sub_17712` 写定；`rbp-0x6A48` 由 `sub_17A5F` 写定；(1,0) 与 (19,50) 被置为空格。**

**8. `0x18A8A`–`0x18AD3`　五个连排调用 + 拒绝分支** `0x18A8A call`（无参数装填）→ `0x18A8F call`（无装填）→ `0x18A94 call`（无装填）→ `0x18A99 mov edi,0; call` → `0x18AAA lea rax,dirp; mov rdi,rax; call`；`0x18AB2 endbr64`；`0x18AB6 test eax,eax`；`0x18AB8 74 1E jz 0x18AD8`（放行）。 **结论：只有第 5 个调用的返回值被使用；非 0 就打印 `Access Denied.`、`eax=1` 并直接跳出函数。**

**9. `0x18AD8`–`0x18B63`　屏幕尺寸 + 一行提示 + 记时** `LINES = stdscr ? (int16)stdscr->_maxy+1 : -1`（`+4`）；`COLS = stdscr ? (int16)stdscr->_maxx+1 : -1`（`+6`）；`mvprintw(LINES/2-2, (COLS-30)/2, "Synchronizing with Quantum Relay...")`；`sub_16E69()` 结果存 `cs:qword_64088`。 **结论：全局 `qword_64088` = 起始时间戳。**

**10. `0x18B75`–`0x18E67`　31 帧 + 超时判断** `for (i=0; i<=0x1E; i++)`：每帧先做第 4 节那套进程名检查（`0x18B84`，全部内联重来一遍）→ `mvprintw(LINES/2, (COLS-32)/2, "[%-30s]", "=============================="+(30-i))`（串在 `0x60240`）→ `refresh()` → `usleep(0xC350)`。 循环后 `sub_16E69()` 再取一次，与 `qword_64088` 相减，`cmp …,0x2540BE400`，`jbe` 跳过 → 否则错误码 4 终止。 **结论：31 帧、每帧 50000 微秒；从 `0x18B6D` 计时点起超过 10 秒即退出。**

**11. `0x18ECC`–`0x18FA3`　提示 + 读输入 + 第 3 处进程名检查** `mvprintw(LINES/2+2, (COLS-30)/2, "Enter Encryption Key:")` → `key[512]`（`rbp-0x5E70`）清零（`qword*2` + `rep stosq 0x3E`）→ `curs_set(1)` → `refresh()` → `wmove(stdscr, LINES/2+2, (COLS-30)/2+23)` → `wgetnstr(stdscr, key, 0x1FF)` → `refresh()` → `curs_set(0)` → 第 3 处同构进程名检查（`0x18FA8`）。 **结论：`key` 最多 511 字符，读完后仍要过同一套 comm 检查。**

**12. `0x19211`–`0x192DC`　长度约束（对 key 的第一道硬约束）** `[rbp-0x6980]=&map`；`[rbp-0x6978]=key`；`[rbp-0x6A28]=[rbp-0x6A48]`。 `strlen(key)` → `len`：`len==0` → 错误码 1；`len & 1` 非 0 → 错误码 1。 `n = len>>1`；`4n = n<<2`；`cmp 4n, limit`，`jb` → 错误码 1；`rdx = 4n-4`；`cmp limit, rdx`，`ja` 才继续（否则错误码 1）。 **结论：`len` 必须为正偶数；且必须 `4n ≥ limit` 同时 `limit > 4n-4`，即 `limit ∈ [4n-3, 4n]`，`n` 只能是 `ceil(limit/4)`。**

**13. `0x192DC`–`0x19398`　分配 + hex 解码** `malloc(n)`（伪名 `_nextafterl`）→ `rbp-0x6958`，NULL → 错误码 1。 `for (i=0; i<n; i++) sscanf(key+2*i, "%2hhx", &path[i])`；返回不等于 1 → `free(path)` + 错误码 1。 **结论：key 必须是 `n` 组两位十六进制，逐组转成 `path[i]`。**

**14. `0x1939A`–`0x19644`　走格校验** `visited`（`rbp-0x6330`）清 1071 字节；`x=1, y=0`；`visited[51*1+0]=1`；`moves=0`。 外层 `for (i=0; i<n; i++)`；内层 `for (j=0; j<=3; j++)`，每步： `if (moves >= limit) break`（`0x19438`）→ `dir = (path[i] >> 2*(3-j)) & 3`（`sar` + `and 3`）→ `nx=x, ny=y`；`dir==0→nx-=1`、`1→nx+=1`、`2→ny-=1`、`3→ny+=1` → `nx<0 || nx>0x14` → 错误码 1 → `ny<0 || ny>0x32` → 错误码 1 → `map[51*nx+ny]=='#'` → 错误码 1 → `visited[51*nx+ny]!=0` → 错误码 1 → 提交 `x=nx, y=ny`、`visited[x][y]=1`、`moves++`。 **结论：四个方向是 上 / 下 / 左 / 右；行范围 0–20、列范围 0–50；不许撞 `map` 的 `#`、不许重访、到 `limit` 步必须停。**

**15. `0x19660`–`0x196B8`　收尾** `free(path)` → `x==0x13 && y==0x32` 否则错误码 1 → `endwin()` → `printf("R3CTF{%s}\n", key)`。 **结论：必须停在 (19,50)；打印的是 `key` 原文，不含任何派生字节。**

---

然后需要

1. sub_17712，决定所有可走格

2. sub_17A5F，决定 key 长度

3. 0x15C60 / 0x13660 / 0x15100 / 0x14610 / 0x15B90 —— 门的判据

4. `.data:0x63F78` 那 31 字节 —— 7 个 comm 比对串的具体内容(黑名单)

---

```c
double __fastcall sub_17712(__int64 a1, double x)
{
  long double v2; // fst7
  __int64 v3; // rax
  char n32; // cl
  int v5; // eax
  _DWORD *v6; // rax
  int v7; // eax
  _DWORD *v8; // rax
  __int64 v9; // rax
  int v10; // ebx
  double v11; // st7
  long double x_1; // [rsp+0h] [rbp-60h]
  long double x_2; // [rsp+0h] [rbp-60h]
  __int64 v15; // [rsp+8h] [rbp-58h]
  long double y; // [rsp+10h] [rbp-50h]
  long double y_1; // [rsp+10h] [rbp-50h]
  int k_1; // [rsp+18h] [rbp-48h]
  int i; // [rsp+20h] [rbp-40h]
  int j; // [rsp+24h] [rbp-3Ch]
  int k; // [rsp+28h] [rbp-38h]
  unsigned int v22; // [rsp+2Ch] [rbp-34h]
  unsigned int v23; // [rsp+30h] [rbp-30h]
  int v24; // [rsp+38h] [rbp-28h]
  int v25; // [rsp+3Ch] [rbp-24h]
  int fd[2]; // [rsp+40h] [rbp-20h]
  __int64 v27; // [rsp+48h] [rbp-18h]

  *((_QWORD *)&x_1 + 1) = a1;
  logb(x);
  v2 = nextafterl(x: x_1, y);
  *(_QWORD *)fd = v3;
  *((_QWORD *)&y_1 + 1) = 0x100000000LL;
  while ( SHIDWORD(y_1) <= 19 )
  {
    for ( i = 1; i <= 49; ++i )
    {
      if ( (i & 1) != 0 && (BYTE12(y_1) & 1) != 0 )
        n32 = 32;
      else
        n32 = 35;
      *(_BYTE *)(*((_QWORD *)&x_2 + 1) + 51LL * SHIDWORD(y_1) + i) = n32;
      if ( (i & 1) == 0 && SHIDWORD(y_1) % 2 == 1 )
      {
        v5 = DWORD2(y_1)++;
        v6 = (_DWORD *)(8LL * v5 + *(_QWORD *)fd);
        *v6 = HIDWORD(y_1);
        v6[1] = i;
      }
      if ( (BYTE12(y_1) & 1) == 0 && i % 2 == 1 )
      {
        v7 = DWORD2(y_1)++;
        v8 = (_DWORD *)(8LL * v7 + *(_QWORD *)fd);
        *v8 = HIDWORD(y_1);
        v8[1] = i;
      }
    }
    ++HIDWORD(y_1);
  }
  tcsendbreak(fd: fd[0], duration: SDWORD2(y_1));
  nextafterl(x: x_2, y: y_1);
  v27 = v9;
  for ( j = 0; j < 250; ++j )
    *(_DWORD *)(v9 + 4LL * j) = j;
  for ( k = 0; k < k_1; ++k )
  {
    v24 = *(_DWORD *)(8LL * k + *(_QWORD *)fd);
    v25 = *(_DWORD *)(8LL * k + *(_QWORD *)fd + 4);
    if ( (v25 & 1) != 0 )
    {
      v22 = 25 * ((v24 - 1) / 2) + v25 / 2;
      v23 = 25 * ((v24 + 1) / 2) + v25 / 2;
    }
    else
    {
      v22 = 25 * (v24 / 2) + (v25 - 1) / 2;
      v23 = 25 * (v24 / 2) + (v25 + 1) / 2;
    }
    v10 = sub_175FB(a1: v22, a2: v27);
    if ( v10 != (unsigned int)sub_175FB(a1: v23, a2: v27) )
    {
      sub_17673(a1: v22, a2: v23, a3: v27);
      *(_BYTE *)(v15 + 51LL * v24 + v25) = 32;
    }
  }
  nextup(a1: *(_QWORD *)fd, a2: *(double *)&v2);
  return nextup(a1: v27, a2: v11);
}
```

---

```c
__int64 __fastcall sub_17A5F(__int64 a1, __int64 a2)
{
  long double v2; // fst7
  _QWORD *v3; // rax
  double v4; // st7
  long double v5; // fst7
  _QWORD *v6; // rax
  DIR *dirp_1; // rdi
  double v8; // st7
  __int64 result; // rax
  int v10; // eax
  long double x; // [rsp+0h] [rbp-2630h]
  long double x_1; // [rsp+0h] [rbp-2630h]
  long double y; // [rsp+10h] [rbp-2620h]
  long double y_1; // [rsp+10h] [rbp-2620h]
  int j_1; // [rsp+20h] [rbp-2610h]
  int j; // [rsp+24h] [rbp-260Ch]
  _DWORD *i_1; // [rsp+28h] [rbp-2608h]
  _DWORD *i; // [rsp+30h] [rbp-2600h]
  _QWORD *v19; // [rsp+38h] [rbp-25F8h]
  _DWORD *i_2; // [rsp+48h] [rbp-25E8h]
  __int64 n0x14; // [rsp+68h] [rbp-25C8h]
  _DWORD v22[270]; // [rsp+70h] [rbp-25C0h] BYREF
  _BYTE s[7]; // [rsp+4A8h] [rbp-2188h] BYREF
  char v24; // [rsp+4AFh] [rbp-2181h] BYREF
  DIR *dirp; // [rsp+4B0h] [rbp-2180h]
  int v26; // [rsp+4B8h] [rbp-2178h]
  int v27; // [rsp+4BCh] [rbp-2174h]
  unsigned __int64 v28; // [rsp+2628h] [rbp-8h]
  __int64 savedregs; // [rsp+2630h] [rbp+0h] BYREF

  *((_QWORD *)&x + 1) = a1;
  v28 = __readfsqword(0x28u);
  memset(&v22[4], 0, 0x428u);
  memset(s, 0, sizeof(s));
  v19 = (_QWORD *)sub_174CA(a1: s, a2, a3: &v24);
  v2 = nextafterl(x, y);
  *v3 = 0x100000001LL;
  v3[1] = 0;
  sub_17505(a1: v19, a2: v3, a3: *(double *)&v2);
  LOBYTE(v22[17]) = 1;
  i_1 = nullptr;
  while ( *v19 != 0 )
  {
    i_2 = (_DWORD *)sub_17586(a1: v19);
    if ( *i_2 == 19 && i_2[1] == 49 )
    {
      i_1 = i_2;
      break;
    }
    v22[0] = -1;
    v22[1] = 1;
    v22[2] = 0;
    v22[3] = 0;
    dirp = nullptr;
    v26 = -1;
    v27 = 1;
    HIDWORD(y_1) = 0;
    while ( SHIDWORD(y_1) <= 3 )
    {
      LODWORD(n0x14) = *i_2 + v22[SHIDWORD(y_1)];
      HIDWORD(n0x14) = i_2[1] + *((_DWORD *)&dirp + SHIDWORD(y_1));
      if ( (unsigned int)n0x14 <= 0x14
        && HIDWORD(n0x14) <= 0x32
        && *(_BYTE *)(*((_QWORD *)&x_1 + 1) + 51LL * (int)n0x14 + SHIDWORD(n0x14)) == 32
        && *((_BYTE *)&savedregs + 51 * (int)n0x14 + SHIDWORD(n0x14) - 9648) != 1 )
      {
        *((_BYTE *)&savedregs + 51 * (int)n0x14 + SHIDWORD(n0x14) - 9648) = 1;
        v5 = nextafterl(x: x_1, y: y_1);
        *v6 = n0x14;
        v6[1] = i_2;
        sub_17505(a1: v19, a2: v6, a3: *(double *)&v5);
      }
      ++HIDWORD(y_1);
    }
  }
  while ( *v19 != 0 )
    sub_17586(a1: v19);
  nextup(a1: v19, a2: v4);
  if ( i_1 != nullptr )
  {
    j_1 = 0;
    for ( i = i_1; i != nullptr; i = *((_DWORD **)i + 1) )
    {
      v10 = j_1++;
      *(&dirp + v10) = (DIR *)i;
    }
    for ( j = 0; j < j_1; ++j )
      nextup(a1: *(&dirp + j), a2: v8);
    result = (unsigned int)(j_1 + 1);
  }
  else
  {
    result = 0xFFFFFFFFLL;
  }
  if ( v28 != __readfsqword(0x28u) )
    return telldir(dirp: dirp_1);
  return result;
}
```

---

然后需要动态获取`map` 的 1071 字节和`step_limit`

```text
.dynsym[111]:  name='argz_insert'  bind=GLOBAL  type=FUNC
               st_shndx=0（SHN_UNDEF）  st_value=0x0  st_size=0
GOT 0x62370 的文件初值 = 0xF6E0   （落在 .plt 的 0xF020–0x12ED0，是桩代码，不是函数）
.rela.plt 该项的 r_type = 7       （R_X86_64_JUMP_SLOT）

```

这三个字段合在一起说明：**文件中这个符号没有地址**。`st_value=0` 加上 `SHN_UNDEF`，代表 “本文件不定义它”；`JUMP_SLOT` 代表 “运行期由 `ld.so` 把地址写进 `r_offset`”；GOT 里的 `0xF6E0` 只是延迟绑定桩。

---

然后是黑名单

```text
0x18606:  memset(comm_buf, 0, 0x400)
0x18633:  call 159d0              ; 零参，返回值 → [rbp-0x6A34]，即 pid
          snprintf(path, 0x1000, "/proc/%d/comm", pid)
          fopen(path, "r") → fgets → fclose
          7 项表：{unk_63F78,3} {63F7B,4} {63F7F,3} {63F82,6}
                  {63F88,6} {63F8E,7} {63F95,2}
          逐项逐字节 ^0x5A → 明文 → strstr(comm, 明文)
          命中 → esi=3 → 终止

```

就是 `gdb`、`lldb`、`ida`、`strace`、`ltrace`、`radare2`、`r2`,它取的是**父进程**的 pid，如果动态分析，父进程正好是这些调试器，以此来阻断动态分析

伪造父进程comm，或者用其他方式（如把异或常量改掉）

（ai给了一个py的方法，根本没用调试器）

然后在内存里面提取

按结构特征扫描 1071 字节窗口

得到的数据，也就是迷宫的地图

```text
总长 1071 (0x42F) = 21 行 × 51 列，行距 51
'#'(0x23) = 570 个，' '(0x20) = 501 个
行 0  ：23 23 23 ... 23   （51 个 0x23，一条整行墙）
行 20 ：23 23 23 ... 23   （51 个 0x23，一条整行墙）
idx 48..53 = 23 23 23 | 20 20 20
                 ↑行0末  ↑idx51 = map[1][0] = 0x20（入口，被 main 改过）
map[19][50] = 0x20       （出口，也被 main 改过）

```

我们的输入会被解析成走迷宫方向和步数，需要最短路径走出迷宫

solve.py

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
r3CTF2025 / Neon Deceit —— 最终解答
用法：
  python3 solve.py                    # 自动找二进制并跑
  python3 solve.py /path/to/binary    # 指定二进制
  python3 solve.py --from map.txt     # 离线：用已 dump 的地图文本重算 key
"""
import os, sys, time, pty, select, struct
from collections import deque

ROWS, COLS = 21, 51
MAP_OFF = 0x6760            # map 相对 rbp（main 栈帧）
LIM_OFF = 0x6A48            # step_limit 相对 rbp
DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]   # 0上 1下 2左 3右（对应 main 里 nx-1/nx+1/ny-1/ny+1）
START, GOAL = (1, 0), (19, 50)
HASH, SPACE = 0x23, 0x20

CANDIDATES = [
    "/mnt/d/Amile/File/CTF/r3CTF2025/neon_deceit/Neon Deceit",
    "/mnt/f/A mine/doubaoworkshop/doubaoworkshop-ctf/Neon Deceit",
]


# ---------- 交互 ----------
def wait_for(fd, marker, timeout):
    buf, t0 = b"", time.time()
    while time.time() - t0 < timeout:
        r, _, _ = select.select([fd], [], [], 0.2)
        if not r:
            continue
        try:
            d = os.read(fd, 1 << 16)
        except OSError:
            break
        if not d:
            break
        buf += d
        if marker in buf:
            return buf
    return buf


# ---------- 数据结构 ----------
def looks_like_map(w):
    """1071 字节窗口是否满足迷宫布局的强特征"""
    if len(w) < ROWS * COLS:
        return False
    if any(b not in (HASH, SPACE) for b in w[:ROWS * COLS]):
        return False
    for c in range(COLS):                       # 第 0 / 20 行整行是墙
        if w[c] != HASH or w[20 * COLS + c] != HASH:
            return False
    for r in range(ROWS):                       # 第 0 / 50 列除两处入口外是墙
        i0, i1 = r * COLS, r * COLS + COLS - 1
        if i0 != COLS and w[i0] != HASH:
            return False
        if i1 != 19 * COLS + COLS - 1 and w[i1] != HASH:
            return False
    if w[COLS] != SPACE or w[19 * COLS + COLS - 1] != SPACE:   # 入口/出口被开成空格
        return False
    cells = sum(1 for r in range(1, 20, 2) for c in range(1, 50, 2)
                if w[r * COLS + c] == SPACE)
    return cells >= 200                          # 250 个格点里绝大多数是通路


def locate_map(stack):
    """返回 map 在 stack 缓冲内的偏移，找不到返回 None"""
    size = ROWS * COLS
    pos = stack.find(b"\x23" * COLS)             # 先按“整行墙”粗筛，够快
    while pos != -1:
        if looks_like_map(stack[pos:pos + size]):
            return pos
        pos = stack.find(b"\x23" * COLS, pos + 1)
    return None


def bfs(grid):
    """返回 (1,0)->(19,50) 的最短方向序列"""
    prev = {}
    seen = [[False] * COLS for _ in range(ROWS)]
    seen[START[0]][START[1]] = True
    q = deque([START])
    while q:
        x, y = q.popleft()
        if (x, y) == GOAL:
            break
        for d, (dx, dy) in enumerate(DIRS):
            nx, ny = x + dx, y + dy
            if 0 <= nx < ROWS and 0 <= ny < COLS and grid[nx][ny] != HASH and not seen[nx][ny]:
                seen[nx][ny] = True
                prev[(nx, ny)] = ((x, y), d)
                q.append((nx, ny))
    if GOAL not in prev:
        return None
    steps, cur = [], GOAL
    while cur != START:
        cur, d = prev[cur]
        steps.append(d)
    return steps[::-1]


def encode(steps, limit):
    """每字节 4 步、高位先；不足 4 的倍数用 0 补（那几个字节不会被执行）"""
    n = (limit + 3) // 4
    padded = steps + [0] * (4 * n - len(steps))
    return "".join("%02x" % ((padded[4 * i] << 6) | (padded[4 * i + 1] << 4) |
                             (padded[4 * i + 2] << 2) | padded[4 * i + 3])
                   for i in range(n))


def render(data):
    return "\n".join("".join(chr(b) for b in data[r * COLS:(r + 1) * COLS]) for r in range(ROWS))


# ---------- 离线模式 ----------
def offline(path):
    rows = [l for l in open(path, encoding="utf-8", errors="replace").read().split("\n") if l.strip()]
    assert len(rows) == ROWS and all(len(r) == COLS for r in rows), "地图文本必须是 21 行 × 51 列"
    grid = [[HASH if ch == "#" else SPACE for ch in r] for r in rows]
    steps = bfs(grid)
    if steps is None:
        print("[!] 地图不可达"); return
    limit = len(steps)                    # 离线时 limit 就等于最短路步数
    key = encode(steps, limit)
    print("[+] 步数(=limit) = %d, key(%d 字节) = %s" % (limit, len(key) // 2, key))
    print("[+] flag = R3CTF{%s}" % key)


# ---------- 在线模式 ----------
def solve(binpath):
    pid, fd = pty.fork()
    if pid == 0:
        os.environ["TERM"] = "xterm"
        os.execv(binpath, [binpath] + ["0"] * 6)      # 程序要求 argc == 7

    out = wait_for(fd, b"Enter Encryption Key:", 20)
    if b"Enter Encryption Key:" not in out:
        print("[!] 未进入输入界面，尾部输出：")
        print(out[-800:].decode("utf-8", "replace"))
        os.kill(pid, 9)
        sys.exit(1)
    print("[+] 程序停在输入框 (pid=%d, 父进程 comm=%s)" % (pid, open("/proc/self/comm").read().strip()))

    lo = hi = None
    for line in open("/proc/%d/maps" % pid):
        if "[stack]" in line:
            a, b = line.split()[0].split("-")
            lo, hi = int(a, 16), int(b, 16)
    if lo is None:
        print("[!] 找不到 [stack]"); os.kill(pid, 9); sys.exit(1)

    mem = open("/proc/%d/mem" % pid, "rb")
    mem.seek(lo)
    stack = mem.read(hi - lo)
    print("[+] [stack] 0x%x-0x%x (%d 字节)" % (lo, hi, hi - lo))

    off = locate_map(stack)
    if off is None:
        print("[!] 未定位到 map"); os.kill(pid, 9); sys.exit(1)
    addr = lo + off
    rbp = addr + MAP_OFF
    print("[+] map @ 0x%x  (段内 +0x%x)  =>  rbp = 0x%x" % (addr, off, rbp))

    mem.seek(rbp - LIM_OFF)
    limit = struct.unpack("<i", mem.read(4))[0]
    print("[+] step_limit = %d" % limit)

    data = stack[off:off + ROWS * COLS]
    grid = [[data[r * COLS + c] for c in range(COLS)] for r in range(ROWS)]
    print(render(data))

    steps = bfs(grid)
    if steps is None:
        print("[!] 地图不可达"); os.kill(pid, 9); sys.exit(1)
    print("[+] 最短路 = %d 步" % len(steps))
    if not (4 * ((len(steps) + 3) // 4) - 4 < limit <= 4 * ((len(steps) + 3) // 4)):
        print("[!] 步数与 limit 不自洽"); os.kill(pid, 9); sys.exit(1)

    key = encode(steps, limit)
    print("[+] key(%d 字节) = %s" % (len(key) // 2, key))

    os.write(fd, (key + "\r").encode())
    res = wait_for(fd, b"R3CTF{", 10)
    txt = res.decode("utf-8", "replace")
    i = txt.find("R3CTF{")
    print("[+] 程序输出: %s" % (txt[i:txt.find("}", i) + 1] if i >= 0 else txt[-200:]))
    os.kill(pid, 9)


def main():
    args = sys.argv[1:]
    if args and args[0] == "--from":
        offline(args[1]); return
    binpath = args[0] if args else next((p for p in CANDIDATES if os.path.exists(p)), None)
    if not binpath or not os.path.exists(binpath):
        print("[!] 找不到二进制，请把路径作为参数传入"); sys.exit(1)
    solve(binpath)


if __name__ == "__main__":
    main()

```

输出

```text
[+] 程序停在输入框 (pid=1755, 父进程 comm=python)
[+] [stack] 0x7ffc6cb9f000-0x7ffc6cbc2000 (143360 字节)
[+] map @ 0x7ffc6cbb8cb0  (段内 +0x19cb0)  =>  rbp = 0x7ffc6cbbf410
[+] step_limit = 80
###################################################
                          # #                 # # #
# ##### ### # # # ####### # # # ####### # ### # # #
#     # # # # # # #           # #     # #   #     #
# ### ### # # # ########### # # # # # ########### #
#   # #     # # # #   # # # # # # # #             #
# # # # # # # ### # # # # # ##### # # ### ##### # #
# # # # # # #       # # #   #   # # # #     #   # #
# # ### # # # # ##### # ### # ########### ####### #
# #   # # # # # #     #   # # # # # # # # # # # # #
######################### # # # # # # # # # # # # #
#                               #             # # #
####### ############# ##### # # # ### # ### ### # #
#             #         #   # # # #   #   #     # #
# # # # # ############# ###########################
# # # # # #                                       #
# ### # # # # ### # # # # # # # # # # ### ### ### #
#   # # # # #   # # # # # # # # # # #   #   # #   #
# # ##### # # # # ##### # # # # # ### # # # # # # #
# #     # # # # # #     # # # # #   # # # # # # #
###################################################
[+] 最短路 = 80 步
[+] key(20 字节) = ffffffffffffd7d5556aa97d7ffffffffffffd57
[+] 程序输出: R3CTF{ffffffffffffd7d5556aa97d7ffffffffffffd57}
```

---

解释：

后续汇编分析，信息需求，解key等由AI完成

我实在是解决不了

---

## 总结

### 我学到的

1. 一种新的题型

此题的表面是打印hello world，很好识别是藏东西了，但是，如果表面是类似正常逆向的样子呢。这就需要去整体分析，看表面是否合理，去看是否有代码数据等被隐藏或者没注意到

2. 对逆向的认识更深入了

有的程序看似如表面般，实则需要特定条件才能执行另一逻辑，这种隐藏程序，也是需要逆向分析去发掘的

3. 工具给出的不一定可信，需要去判定

本题采用的思路是**不让 IDA 加载失败，而是让 IDA 的每条结论都不可信**，并且同时封住动态验证。所以我们需要去判断和纠正

### 我需要练

1. 逆向思维

2. 代码审计

---

就先这样吧



