---
title: "HTTP请求结构"
date: 2026-04-23 22:46:47 +0800
categories: [WEB_Note]
tags: ["WEB", "HTTP"]
web_folder: "HTTP"
source_note: "HTTP/HTTP请求结构.md"
permalink: /web_note/http/01/
render_with_liquid: false
---
# **请求行**
>由三部分组成：`方法 + 空格 + URI + 空格 + HTTP版本 + \r\n`

**所有请求方法及含义：**

| 方法      | 含义            | 有无请求体 |
| ------- | ------------- | ----- |
| GET     | 获取资源，参数在 URL  | 无     |
| POST    | 提交数据，参数在 Body | 有     |
| PUT     | 上传/更新资源       | 有     |
| DELETE  | 删除资源          | 可有可无  |
| HEAD    | 只返回响应头，无响应体   | 无     |
| OPTIONS | 查询服务器支持的方法    | 无     |
| TRACE   | 回显请求，用于调试     | 无     |
| PATCH   | 部分修改资源        | 有     |
# HTTP 请求头部字段完整详解

## 一、通用/基础类

### Host

```
Host: www.example.com:8080
```

HTTP/1.1 **唯一必须携带**的请求头。指定目标服务器的域名和端口（80/443 时可省略端口）。服务器用它来区分同一 IP 上部署的多个虚拟主机。

CTF 场景：修改 Host 为内网地址可能触发 SSRF；部分题目只允许特定 Host 访问。

---

### Connection

```
Connection: keep-alive
Connection: close
```

控制本次请求后是否保持 TCP 连接。`keep-alive` 复用连接提升性能（HTTP/1.1 默认），`close` 请求结束后立即断开。HTTP/2 中此字段已被废弃（多路复用本身解决了这个问题）。

---

### Content-Type

```
Content-Type: application/x-www-form-urlencoded
Content-Type: application/json
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxk
Content-Type: text/xml
Content-Type: application/octet-stream
```

声明**请求体的数据格式**，服务器按此解析 Body。只有有请求体的方法（POST/PUT/PATCH）才需要携带。

|值|用途|CTF 关注点|
|---|---|---|
|`application/x-www-form-urlencoded`|普通表单，键值对 URL 编码|最常见注入点|
|`application/json`|JSON 格式数据|参数类型绕过、JSON 注入|
|`multipart/form-data`|文件上传，含 boundary 分隔符|文件上传漏洞|
|`text/xml` / `application/xml`|XML 数据|XXE 注入|
|`application/octet-stream`|二进制流，任意文件|文件上传绕过|

CTF 场景：服务端有时只按 Content-Type 判断数据类型，修改此字段可能绕过格式校验，或将 JSON 改为 xml 触发 XXE。

---

### Content-Length

```
Content-Length: 26
```

声明请求体的**精确字节数**，服务器读取请求体时以此为准。

CTF 场景：这是 **HTTP 请求走私（HTTP Request Smuggling）** 的核心字段。当前端代理和后端服务器对 `Content-Length` 与 `Transfer-Encoding` 的解析优先级不一致时，可以通过精心构造的请求让服务器错误地将一个请求的内容当作下一个请求的开头。

---

### Transfer-Encoding

```
Transfer-Encoding: chunked
```

分块传输编码，发送方将数据分成若干块，每块前附上十六进制的块大小，以大小为 0 的块结束。存在时**优先级高于 Content-Length**（RFC 规定，但不同服务器实现不同，这是走私漏洞的根源）。

分块格式示例：

```
POST /path HTTP/1.1\r\n
Transfer-Encoding: chunked\r\n
\r\n
5\r\n          ← 第一块，5字节
hello\r\n
6\r\n          ← 第二块，6字节
 world\r\n
0\r\n          ← 结束标志
\r\n
```

---

## 二、身份与认证类

### Cookie

```
Cookie: session=abc123; token=xyz789; username=admin
```

携带服务器之前通过 `Set-Cookie` 写入的数据，多个 Cookie 之间用 `;` 分隔。浏览器会自动携带对应域名下的所有 Cookie。

CTF 场景（最高频）：

- **越权**：修改 Cookie 中的 userid、role、isadmin 等字段
- **Session 伪造**：若 session 是可预测的（如时间戳、简单哈希），尝试伪造
- **Base64 解码**：Cookie 值若像 Base64，解码后可能是 JSON，可篡改后重新编码
- **Flask Session 伪造**：Flask 的 session 是签名的 JWT-like 结构，若密钥弱可伪造

---

### Authorization

```
Authorization: Basic YWRtaW46cGFzc3dvcmQ=
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Digest username="admin", realm="...", nonce="...", response="..."
```

HTTP 标准认证头，格式为 `认证方案 + 空格 + 凭据`。

|认证方案|格式|说明|
|---|---|---|
|Basic|Base64(用户名:密码)|明文编码，不是加密，极不安全|
|Bearer|JWT Token|现代 API 常用，携带签名的声明|
|Digest|多字段摘要|比 Basic 安全，但已较少见|

CTF 场景：Basic 认证直接 Base64 解码即可得到明文密码；Bearer Token 通常是 JWT，需要分析其结构和签名算法，常见攻击有修改 `alg` 为 `none`、弱密钥爆破等。

---

### Token / X-Auth-Token / X-API-Key

```
X-Auth-Token: abc123def456
X-API-Key: sk-xxxxxxxxxxxxxxxx
```

非标准自定义认证头，各系统有不同的命名，功能与 Authorization Bearer 类似，用于 API 认证。CTF 中可能需要从源码或其他地方找到这个 key。

---

## 三、内容协商类

### Accept

```
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
```

告知服务器客户端**能处理的响应内容类型**，`q` 值（0~1）表示优先级，默认为 1。服务器根据此字段返回最合适的格式（内容协商）。

CTF 场景：修改 Accept 为 `application/json` 有时能让服务器返回 JSON 格式数据，暴露更多接口信息。

---

### Accept-Language

```
Accept-Language: zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7
```

告知服务器客户端**偏好的语言**，服务器据此返回对应语言的内容。

---

### Accept-Encoding

```
Accept-Encoding: gzip, deflate, br
```

告知服务器客户端**支持的压缩算法**，服务器可压缩响应体后传输以节省带宽，响应头中用 `Content-Encoding` 标明实际使用的压缩方式。

|值|说明|
|---|---|
|gzip|最常用|
|deflate|zlib 压缩|
|br|Brotli，压缩率更高，现代浏览器支持|
|identity|不压缩|

---

### Accept-Charset

```
Accept-Charset: utf-8, iso-8859-1;q=0.5
```

告知服务器客户端支持的字符集，现代浏览器一般不再发送此头（默认支持所有编码）。

---

## 四、信息与环境类

### User-Agent

```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

标识发起请求的**客户端软件信息**，包含浏览器类型、版本、操作系统等。

CTF 场景：

- 题目要求必须是特定浏览器（如只允许 `curl` 或特定爬虫）
- 题目要求必须是移动端（`Mobile` 关键字）
- 简单改为 `sqlmap` 有时能触发不同的响应路径

---

### Referer

```
Referer: https://www.example.com/login.html
```

说明当前请求**从哪个页面跳转来的**，服务器用于防盗链、来源校验、埋点统计。注意这个单词本身是历史拼写错误（正确应为 Referrer），但已成为标准。

CTF 场景：服务器校验 Referer 是否来自本站，直接伪造即可绕过；部分题目要求 Referer 为特定页面才能访问敏感功能。

---

### Origin

```
Origin: https://www.example.com
```

与 Referer 类似，但**只包含源（协议+域名+端口），不含路径**，主要用于 CORS（跨域资源共享）和 CSRF 防护校验。浏览器在跨域请求和 POST 请求时自动添加。

CTF 场景：CORS 配置错误漏洞中，服务器若直接反射 Origin 到 `Access-Control-Allow-Origin`，可造成任意跨域读取。

---

### Cache-Control / Pragma

```
Cache-Control: no-cache
Cache-Control: max-age=3600
Pragma: no-cache
```

控制缓存行为，`no-cache` 要求不使用缓存直接向服务器请求；`Pragma: no-cache` 是 HTTP/1.0 的等价写法，现在基本只为兼容旧服务器。

---

### If-Modified-Since / If-None-Match

```
If-Modified-Since: Tue, 01 Jan 2025 00:00:00 GMT
If-None-Match: "abc123etag"
```

条件请求头，配合缓存使用。若资源未修改，服务器返回 304 Not Modified 而不返回响应体，节省带宽。`If-None-Match` 基于 ETag（资源唯一标识符）判断。

---

### Upgrade-Insecure-Requests

```
Upgrade-Insecure-Requests: 1
```

浏览器告知服务器，自己能处理 HTTPS，希望被重定向到 HTTPS 版本。值为 1 表示支持。

---

## 五、代理与转发类

### X-Forwarded-For

```
X-Forwarded-For: 客户端IP, 代理1IP, 代理2IP
X-Forwarded-For: 192.168.1.100, 10.0.0.1, 172.16.0.1
```

经过反向代理/CDN 时，记录请求经过的所有 IP 地址，**最左边是原始客户端 IP**，每经过一层代理追加一个。

这是**自定义头，服务器无法验证其真实性**，客户端可以任意伪造。

CTF 场景：服务器用它获取真实 IP 做白名单校验（如"只允许 127.0.0.1 访问"），直接添加 `X-Forwarded-For: 127.0.0.1` 即可绕过。

---

### X-Real-IP

```
X-Real-IP: 192.168.1.100
```

通常由 Nginx 设置，只传递**最原始的客户端 IP**（单个值，不是列表）。与 X-Forwarded-For 的区别在于不记录中间代理链路。同样可被客户端伪造。

---

### X-Forwarded-Host / X-Forwarded-Proto

```
X-Forwarded-Host: www.example.com
X-Forwarded-Proto: https
```

`X-Forwarded-Host` 传递原始请求的 Host；`X-Forwarded-Proto` 传递原始请求使用的协议（http 或 https），因为请求到达后端时可能已经被代理转为 http。

CTF 场景：部分框架信任这些头来生成绝对 URL，伪造可导致 Host 头注入，进而引发密码重置链接劫持等漏洞。

---

### Via

```
Via: 1.1 proxy.example.com, 1.0 another-proxy.com
```

HTTP 标准头（非自定义），记录请求经过的代理节点，格式为 `HTTP版本 代理标识`。与 X-Forwarded-For 不同，它是标准字段，由代理自动添加。

---

## 六、Range 请求类

### Range

```
Range: bytes=0-1023
Range: bytes=1024-2047
Range: bytes=-500
```

请求资源的**某个字节范围**，用于断点续传和分片下载。服务器支持的话会返回 206 Partial Content 和对应的 `Content-Range` 响应头。

CTF 场景：可用于读取文件的特定部分，某些场景下可以绕过对完整文件的检测逻辑。

---

### If-Range

```
If-Range: "etag-value"
If-Range: Wed, 01 Jan 2025 00:00:00 GMT
```

配合 Range 使用，若资源未发生变化则使用 Range 请求，若已变化则返回完整资源。

---

## 七、WebSocket 升级类

### Upgrade / Connection（升级场景）

```
GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

这几个头部一起出现，表示客户端请求将 HTTP 连接**升级为 WebSocket 协议**。

|字段|说明|
|---|---|
|`Upgrade: websocket`|指定要升级到的协议|
|`Connection: Upgrade`|告知这是一个升级请求|
|`Sec-WebSocket-Key`|随机 Base64 值，服务器用它计算响应 key 完成握手验证|
|`Sec-WebSocket-Version`|WebSocket 协议版本，目前固定为 13|

服务器同意后返回 101 Switching Protocols，后续通信不再是 HTTP 报文格式。CTF 中 WebSocket 接口有时存在与普通 HTTP 接口不同的鉴权逻辑漏洞。

---

## 八、自定义与框架相关类

这类头部没有统一标准，由各框架或应用自行定义，CTF 题目中常出现：

```
X-Requested-With: XMLHttpRequest
```

标识这是一个 **AJAX 请求**，由 jQuery 等库自动添加，服务器用来区分普通请求和异步请求。CTF 中有些接口只响应 AJAX 请求，加上此头即可访问。

```
X-CSRF-Token: abc123
X-CSRFToken: abc123
```

携带 CSRF Token 用于服务器验证请求合法性，防止跨站请求伪造。CTF 中若要伪造请求，有时需要先获取这个 Token。

```
X-Forwarded-Server: internal.server.com
X-Custom-Header: arbitrary-value
```

应用自定义头，需要结合具体题目分析，有时是解题的关键线索。

---

## 九、字段汇总速查表

|字段名|核心作用|
|---|---|
|Host|指定目标主机|
|Content-Type|请求体格式|
|Content-Length|请求体长度|
|Transfer-Encoding|分块传输|
|Connection|连接控制|
|Cookie|会话凭据|
|Authorization|认证凭据|
|X-Auth-Token|自定义认证|
|Accept|接受的响应类型|
|Accept-Encoding|接受的压缩方式|
|User-Agent|客户端标识|
|Referer|来源页面|
|Origin|来源源|
|X-Forwarded-For|原始客户端 IP|
|X-Real-IP|真实 IP|
|X-Forwarded-Proto|原始协议|
|X-Forwarded-Host|原始 Host|
|Via|代理节点|
|Range|请求部分内容|
|Upgrade|协议升级|
|X-Requested-With|AJAX 标识|
|X-CSRF-Token|CSRF 防护|