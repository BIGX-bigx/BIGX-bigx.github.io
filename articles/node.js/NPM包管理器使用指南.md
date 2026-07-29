---
title: "NPM包管理器使用指南"
date: 2026-03-06 14:29:48 +0800
categories: [WEB_Note]
tags: ["WEB", "node.js"]
web_folder: "node.js"
source_note: "node.js/NPM包管理器使用指南.md"
permalink: /web_note/nodejs/01/
render_with_liquid: false
---
# 1NPM 是什么
## 1.1 NPM 的定位与作用
NPM（Node Package Manager）是 Node.js 的官方包管理工具。它同时扮演三个角色：

- **包管理器**：负责安装、卸载、更新项目所依赖的第三方代码库
- **注册表**：维护着全球最大的开源软件仓库（registry），托管超过 200 万个包
- **命令行工具**：提供一系列命令，贯穿项目从初始化到发布的整个生命周期

在 CTF 中，NPM 的用途不仅仅是"装包"，更是：

- 快速搭建漏洞复现环境
- 查询目标系统的依赖版本，定位已知 CVE
- 分析供应链安全风险
## 1.2 NPM 与 Node.js 的关系
NPM 随 Node.js 一起安装，无需单独安装。二者的关系类似于 Python 和 pip——Node.js 是运行时，NPM 是配套的包管理工具。
```
安装 Node.js → NPM 自动随附安装
```
## 1.3 NPM 生态简介

|概念|说明|
|---|---|
|**registry**|包的远程仓库，默认为 [https://registry.npmjs.org](https://registry.npmjs.org)|
|**包（package）**|可复用的代码单元，含 package.json 描述文件|
|**模块（module）**|可以被 require() 加载的文件或目录|
|**作用域包（scoped）**|以 `@` 开头的包，如 `@babel/core`，用于命名空间隔离|
# 2 核心概念

## 2.1 package.json —— 项目的身份证
`package.json` 是每个 Node.js 项目的核心配置文件，记录了项目的元数据和依赖关系。所有 npm 操作都围绕这个文件展开。
### 2.1.1 关键字段详解
```JSON
{
  "name": "my-project",          // 包名，发布时必须全局唯一
  "version": "1.0.0",            // 当前版本号，遵循 SemVer 规范
  "description": "项目描述",
  "main": "index.js",            // 包的入口文件
  "scripts": {                   // 自定义命令，用 npm run 执行
    "start": "node app.js",
    "test": "jest",
    "build": "webpack"
  },
  "dependencies": {              // 生产依赖：项目运行时必需
    "express": "^4.18.2",
    "lodash": "~4.17.21"
  },
  "devDependencies": {           // 开发依赖：仅开发时需要，生产环境不安装
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  },
  "author": "yourname",
  "license": "MIT"
}
```
### 2.1.2 dependencies 与 devDependencies 的区别

| 字段 | 安装命令 | 使用场景 | 生产环境是否安装 |
|---|---|---|---|
| `dependencies` | `npm install <pkg>` | 运行时必需的库，如 express、lodash | ✅ 是 |
| `devDependencies` | `npm install <pkg> --save-dev` | 开发工具，如测试框架、打包工具 | ❌ 否（npm install --production 时跳过）|
> **CTF 提示**：分析目标项目时，`dependencies` 里的包版本是寻找已知漏洞的第一入口。
---
## 2.2 package-lock.json 与 node_modules

- **package-lock.json**
npm 自动生成的锁文件，精确记录每个依赖包的版本号、下载地址和完整性哈希（integrity）。作用是确保团队所有成员、所有机器安装的依赖版本完全一致。

- **node_modules**
实际安装的所有包文件存放目录。通常体积庞大，不提交到 git（通过 `.gitignore` 排除）。
```
项目根目录/
  package.json          ← 声明依赖（人工维护）
  package-lock.json     ← 锁定精确版本（自动生成）
  node_modules/         ← 实际安装的包文件（自动生成）
````
---
## 2.3 语义化版本 SemVer
>NPM 使用语义化版本规范（Semantic Versioning），格式为 `MAJOR.MINOR.PATCH`。
### 2.3.1 三位数字的含义

|位置|名称|何时升级|示例|
|---|---|---|---|
|第一位|MAJOR（主版本）|有不兼容的 API 变更|1.0.0 → 2.0.0|
|第二位|MINOR（次版本）|新增了向后兼容的功能|1.0.0 → 1.1.0|
|第三位|PATCH（补丁版本）|向后兼容的 bug 修复|1.0.0 → 1.0.1|
### 2.3.2 版本符号详解
`package.json` 中的版本号前缀符号控制 npm 安装时允许的版本范围：

|符号|示例|允许升级的范围|等价写法|
|---|---|---|---|
|`^`|`^1.2.3`|MINOR 和 PATCH 可升级，MAJOR 锁死|`>=1.2.3 <2.0.0`|
|`~`|`~1.2.3`|只允许 PATCH 升级|`>=1.2.3 <1.3.0`|
|无符号|`1.2.3`|精确锁定，不允许任何升级|`1.2.3`|
|`>=`|`>=1.2.3`|大于等于该版本的所有版本|—|
|`*`|`*`|任意版本（危险，安装最新）|—|
|`latest`|`latest`|当前标记为 latest 的版本|—|
### 2.3.3 CTF 复现中的版本锁定问题

在复现历史漏洞时，版本符号是最容易踩的坑
```json
// package.json 中这样写：
"vm2": "^3.9.14"

// 实际上 npm install 可能会安装 3.9.15 或更高版本
// 漏洞已被修复，复现失败！

// 正确做法：精确指定版本
"vm2": "3.9.14"
// 或安装时直接指定：
npm install vm2@3.9.14
```
---
# 3 环境准备与配置
## 3.1 安装验证
```bash
node -v          # 查看 Node.js 版本，如 v18.16.0
npm -v           # 查看 NPM 版本，如 9.5.1
npm doctor       # 全面检查 NPM 环境健康状态（权限/网络/缓存等）
which node       # 查看 Node.js 安装路径（Linux/Mac）
where node       # 查看 Node.js 安装路径（Windows）
```

`npm doctor` 会逐项检查：npm/node 版本是否满足要求、registry 是否可访问、缓存是否完整、全局目录权限是否正确等。

## 3.2 国内镜像加速

由于网络限制，默认官方源 `https://registry.npmjs.org` 在国内访问很慢甚至超时，需要配置镜像。

### 3.2.1 cnpm 安装与使用

cnpm 是淘宝维护的 npm 客户端，内置指向国内镜像源
```bash
# 安装 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com

# 之后所有安装命令用 cnpm 替代 npm
cnpm install express
cnpm install vm2@3.9.14
```

### 3.2.2 直接切换 npm 源（推荐）

不需要安装额外工具，直接让 npm 本身使用国内源
```bash
# 临时使用（仅本次命令生效）
npm install express --registry=https://registry.npmmirror.com

# 永久切换（修改全局配置）
npm config set registry https://registry.npmmirror.com

# 查看当前使用的源
npm config get registry

# 恢复官方源
npm config set registry https://registry.npmjs.org

# 设置代理（特殊网络环境）
npm config set proxy http://proxy-server:port
npm config set https-proxy http://proxy-server:port
```
> 常用镜像源：淘宝 `https://registry.npmmirror.com`，腾讯 `https://mirrors.cloud.tencent.com/npm/`

## 3.3 配置管理

npm 的配置存储在 `.npmrc` 文件中（用户级在 `~/.npmrc`，项目级在项目根目录）
```bash
npm config list              # 查看当前生效的所有配置
npm config list -l           # 查看全部配置（含内置默认值）
npm config get registry      # 获取某个配置项的值
npm config set key value     # 设置某个配置项
npm config delete key        # 删除某个配置项
npm config edit              # 用默认编辑器直接打开 .npmrc 文件编辑
npm get registry             # 等同于 npm config get registry
npm set registry <url>       # 等同于 npm config set registry
```
---
# 4 项目初始化

在开始开发或搭建漏洞复现环境之前，第一步通常是初始化项目(生成 `package.json`)
## 4.1 npm init 交互式创建

```bash
npm init
```

执行后会逐步询问项目名称、版本、描述、入口文件、作者、许可证等信息，根据回答生成 `package.json`。每一步都可以直接回车使用括号中的默认值。

## 4.2 npm init -y 快速创建

```bash
npm init -y
# 等价写法
npm init --yes
```

跳过所有交互问答，用默认值直接生成 `package.json`。在 CTF 或临时测试场景中最常用，几乎所有字段都无关紧要，快速进入下一步即可
```bash
# CTF 复现环境标准起手式
mkdir cve-test && cd cve-test
npm init -y
npm install vm2@3.9.14
node poc.js
```
---
# 5 依赖安装与管理

## 5.1 本地安装
>本地安装将包下载到当前项目的 `node_modules` 目录下，只对当前项目有效。

### 5.1.1 基础安装
```bash
npm install <package-name>
npm i <package-name>           # 简写，完全等价

# 同时安装多个包
npm install express lodash axios

# 示例
npm install express
```

安装完成后，包信息会自动写入 `package.json` 的 `dependencies` 字段，并更新 `package-lock.json`。

### 5.1.2 生产依赖 vs 开发依赖

```bash
# 安装到 dependencies（生产依赖，默认行为）
npm install express
npm install express --save        # 旧版写法，现在默认就会 save

# 安装到 devDependencies（开发依赖）
npm install jest --save-dev
npm install jest -D               # 简写
```

### 5.1.3 指定版本安装*

```bash
npm install <package>@<version>

# 示例：复现特定 CVE 时安装漏洞版本
npm install vm2@3.9.14        # CVE-2023-29017
npm install vm2@3.9.10        # CVE-2022-36067
npm install vm2@3.9.3         # CVE-2021-23449
npm install vm2@3.6.10        # CVE-2019-10761

# 安装特定版本范围
npm install lodash@">=4.0.0 <4.17.0"

# 安装 tag（如 beta 版）
npm install vue@next
npm install webpack@beta
```
> **关键流程**：先用 `npm view <pkg> versions` 查看所有历史版本，再按需安装对应版本。

### 5.1.4 按配置文件全量安装

```bash
# 安装 package.json 中声明的所有依赖
npm install
npm i                  # 简写
```

拿到一个项目（比如 CTF 题目源码）后，直接运行 `npm install` 即可还原完整依赖环境。

### 5.1.5 严格模式安装 npm ci

```bash
npm ci
```

与 `npm install` 的区别：

|对比项|npm install|npm ci|
|---|---|---|
|依据文件|package.json（版本范围）|package-lock.json（精确版本）|
|版本偏差|可能安装更新的兼容版本|严格按锁文件，一字不差|
|若无锁文件|正常运行|直接报错|
|速度|较慢|更快（跳过版本解析）|
|典型场景|日常开发|CI/CD 流水线、漏洞复现|

漏洞复现时推荐使用 `npm ci`，确保环境与漏洞发现时完全一致。

## 5.2 全局安装

全局安装将包安装到系统目录，安装后可在任意路径直接作为命令使用。

### 5.2.1 全局安装命令与场景

```bash
npm install -g <package-name>
npm install -g nodemon           # 代码热重载工具
npm install -g create-react-app  # React 脚手架
npm install -g http-server       # 快速起一个静态文件服务

# 卸载全局包
npm uninstall -g <package-name>

# 查看所有全局安装的包（只看顶层）
npm list -g --depth=0
```

### 5.2.2 查看全局安装路径

```bash
npm root -g          # 查看全局 node_modules 路径
npm bin -g           # 查看全局可执行文件路径
npm prefix -g        # 查看全局安装根目录
```

## 5.3 依赖维护

### 5.3.1 卸载包

```bash
npm uninstall <package-name>           # 卸载本地包（同步更新 package.json）
npm uninstall <package-name> --save    # 明确从 dependencies 移除
npm uninstall <package-name> -D        # 从 devDependencies 移除
npm uninstall -g <package-name>        # 卸载全局包

# 简写
npm un <package-name>
npm remove <package-name>
npm rm <package-name>
```

### 5.3.2 更新包

```bash
npm update <package-name>      # 更新指定包到允许范围内的最新版
npm update                     # 更新所有依赖到允许范围内的最新版

# 注意：update 受 package.json 中版本符号的限制
# ^ 允许 minor 升级，~ 只允许 patch 升级，无符号不会升级
```

### 5.3.3 清理

```bash
# 移除 node_modules 中存在但未在 package.json 声明的多余包
npm prune

# 减少依赖树中的重复安装（将重复包提升到更高层级）
npm dedupe

# 强制清理 npm 缓存（解决莫名报错的万能方法）
npm cache clean --force

# 查看缓存目录位置
npm cache dir

# 验证缓存完整性
npm cache verify
```
---
# 6 信息收集与安全审计

## 6.1 安全漏洞扫描

````bash
# 扫描当前项目依赖中的已知漏洞（查询 npm 安全数据库）
npm audit

# 以 JSON 格式输出（便于脚本解析或导出报告）
npm audit --json

# 尝试自动修复漏洞（升级到修复版本）
npm audit fix

# 强制修复（可能有破坏性变更，谨慎使用）
npm audit fix --force
```

`npm audit` 输出示例解读：
```
found 3 vulnerabilities (1 moderate, 2 high)
# 找到 3 个漏洞：1 个中危，2 个高危
# 会显示：包名 / CVE 编号 / 漏洞描述 / 影响版本 / 修复版本
````

## 6.2 依赖树查看

```bash
npm ls                         # 列出完整依赖树（含间接依赖）
npm list                       # 同上

npm ls --depth=0               # 只看直接依赖（顶层）
npm list -g --depth=0          # 查看全局安装的顶层包

npm ls <package-name>          # 查找某个包是否安装及其位置
npm find-dupes                 # 在依赖树中查找重复安装的包
```

## 6.3 包信息查询

```bash
# 查看包在注册表中的完整信息（版本/依赖/作者/发布时间等）
npm view <package-name>
npm info <package-name>        # 同上

# 查看包的所有历史版本（CTF 核心技能）
npm view <package-name> versions
npm view vm2 versions          # 示例：查看 vm2 所有版本

# 查看包的最新版本号
npm view <package-name> version

# 查看包的直接依赖
npm view <package-name> dependencies

# 在浏览器中打开相关页面
npm docs <package-name>        # 打开文档页面
npm repo <package-name>        # 打开 GitHub 仓库
npm home <package-name>        # 打开包的主页
npm bugs <package-name>        # 打开 Issue 页面
```

**CTF 常用组合**：
```bash
# 第一步：查看目标包所有历史版本
npm view vm2 versions

# 第二步：对比 CVE 影响范围，确定漏洞版本
# 第三步：安装目标版本
npm install vm2@3.9.14
```

## 6.4 版本监控

```bash
# 检查当前项目中哪些包有可用更新
npm outdated

# 输出示例：
# Package  Current  Wanted  Latest  Location
# express  4.17.1   4.18.2  4.18.2  node_modules/express
# Current: 已安装版本
# Wanted:  package.json 版本符号允许的最新版
# Latest:  npm 上发布的绝对最新版
```

## 6.5 SBOM 软件物料清单生成

```bash
# 生成当前项目的软件物料清单（Software Bill of Materials）
npm sbom
```

SBOM 列出了项目中所有直接和间接依赖的完整清单（包名、版本、许可证、来源等）。在企业安全场景中，SBOM 是识别供应链风险、追踪投毒包的基础工具。

### 6.6 CTF 中的信息收集思路

拿到一个 Node.js 题目或目标系统时，信息收集顺序建议如下：
```
1. 查看 package.json → 确认依赖库和版本
2. 查看 package-lock.json → 获取精确版本号（比 package.json 更可靠）
3. npm view <pkg> versions → 对照版本确认是否存在已知 CVE
4. 搜索 CVE/GitHub Issues → 找对应版本的漏洞利用方式
5. npm audit → 快速扫描已知漏洞（需要有网络）
````
---
# 7 脚本执行与工程化

## 7.1 scripts 字段的定义与作用

`package.json` 中的 `scripts` 字段允许定义任意命令的快捷方式，通过 `npm run <script-name>` 执行：

```json
{
  "scripts": {
    "start":   "node app.js",
    "dev":     "nodemon app.js",
    "test":    "jest --coverage",
    "build":   "webpack --mode production",
    "lint":    "eslint src/",
    "clean":   "rm -rf dist node_modules"
  }
}
```

scripts 中的命令会在一个特殊的 shell 环境中执行，该环境的 `PATH` 中自动包含了 `node_modules/.bin`，因此可以直接调用本地安装的命令行工具（如 `jest`、`webpack`），无需全局安装。

## 7.2 npm run / npm start / npm test

```bash
npm run <script-name>     # 运行任意自定义脚本
npm run                   # 不加参数，列出所有可用脚本

# 内置快捷命令（这几个不需要加 run）
npm start                 # 等价于 npm run start
npm test                  # 等价于 npm run test（可简写 npm t）
npm stop                  # 等价于 npm run stop
npm restart               # 等价于 npm run restart
```

## 7.3 生命周期钩子（pre / post）及供应链攻击风险

npm 支持在脚本名称前加 `pre` 或 `post` 前缀，作为该脚本执行前/后的自动钩子
```json
{
  "scripts": {
    "preinstall":  "echo 安装前执行",
    "install":     "node setup.js",
    "postinstall": "echo 安装后执行",

    "prebuild":    "npm run lint",
    "build":       "webpack",
    "postbuild":   "npm run test"
  }
}
```

执行顺序：`preinstall` → `install` → `postinstall`

> ⚠️ **供应链攻击风险**：`postinstall` 钩子在 `npm install` 完成后自动运行，是供应链投毒攻击最常用的手法。2021 年的 `ua-parser-js` 投毒事件就在 `postinstall` 中植入了挖矿程序和密码窃取器。审计第三方包时，务必检查其 `scripts.postinstall` 字段。

常见内置生命周期钩子（按触发顺序）：
```
preinstall → install → postinstall
prepublish → prepare → prepublishOnly → publish → postpublish
pretest → test → posttest
prestart → start → poststart
````

## 7.4 npx —— 免安装执行神器

### 7.4.1 npx 工作原理

`npx` 随 npm 5.2+ 一同安装。执行 `npx <command>` 时，它按以下顺序查找命令：

1. 当前项目的 `node_modules/.bin` 目录
2. 系统全局安装的命令
3. 以上都没有 → **临时下载该包，执行后自动删除**

这意味着你可以直接运行任何 npm 包，而不需要事先安装。

### 7.4.2 常用场景与示例

```bash
# 运行脚手架，无需全局安装
npx create-react-app my-app
npx @vue/cli create my-project

# 指定版本执行
npx node@16 -e "console.log(process.version)"

# 临时执行漏洞检测工具，不污染全局环境
npx retire                      # 检测前端 JS 依赖的已知漏洞
npx snyk test                   # Snyk 漏洞扫描

# 强制从网络重新下载（忽略本地缓存）
npx --ignore-existing <package>

# 执行本地 node_modules 中的命令
npx jest                        # 等价于 ./node_modules/.bin/jest
npx webpack --version
```
---
# 8 包的发布与管理

了解包的发布流程有助于理解供应链攻击的完整链路，也是开源贡献的必要知识。

## 8.1 账号管理
```bash
npm adduser                    # 注册新账号并登录（交互式）
npm login                      # 登录已有账号
npm whoami                     # 查看当前登录的用户名
npm logout                     # 登出

npm token list                 # 查看账号的 Access Token 列表
npm token create               # 创建新的 Access Token
npm token revoke <id>          # 撤销 Token
```

## 8.2 版本控制

发布前需要更新版本号，npm 提供了自动更新并打 git tag 的命令
```bash
npm version patch     # 补丁升级：1.0.0 → 1.0.1（修 bug）
npm version minor     # 次版本升级：1.0.0 → 1.1.0（新功能）
npm version major     # 主版本升级：1.0.0 → 2.0.0（破坏性变更）

npm version <x.y.z>   # 直接设置为指定版本号
npm version prerelease # 预发布版本：1.0.0 → 1.0.1-0
```

执行后会自动修改 `package.json` 中的版本号并创建对应的 git commit 和 tag。

## 8.3 发布与撤回
```bash
npm publish                          # 发布到公开 npm 注册表
npm publish --tag beta               # 以 beta 标签发布（不影响 latest）
npm publish --access public          # 发布公开的 scoped 包（@scope/pkg）

npm deprecate <pkg@version> "<msg>"  # 废弃指定版本，安装时显示警告
npm unpublish <pkg@version>          # 删除指定版本（发布后 72 小时内有效）
npm unpublish <pkg> --force          # 强制删除整个包
```

> ⚠️ `unpublish` 有严格限制：发布超过 72 小时后无法删除，且删除后包名在 24 小时内无法重新发布。这是 npm 为防止"left-pad 事件"（某开发者删包导致大量项目构建失败）而设定的规则。

## 8.4 供应链攻击视角：理解发布流程的风险

从攻击者角度看，npm 发布机制存在以下攻击面：

|攻击方式|说明|典型案例|
|---|---|---|
|**账号劫持**|盗取开发者 npm 账号，发布恶意版本|ua-parser-js（2021）|
|**依赖混淆**|发布与内网私有包同名的公开包|多家大企业受害（2021）|
|**typosquatting**|注册拼写相似的包名（如 `lodahs`）|持续存在|
|**postinstall 投毒**|在安装钩子中植入恶意代码|event-stream（2018）|
|**恶意依赖传递**|污染被广泛依赖的底层包|colors.js / faker.js（2022）|

---
# 9 避坑指南

## 9.1 权限报错处理

**报错**：`EACCES: permission denied` 出现在全局安装时

```bash
# 方案一：使用 sudo（不推荐，有安全风险）
sudo npm install -g <package>

# 方案二（推荐）：修改全局安装目录到用户目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# 然后将 ~/.npm-global/bin 加入 PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 方案三：使用 nvm 管理 Node 版本（根本解决方案）
# nvm 安装的 Node.js 天然在用户目录，无权限问题
```

Windows 用户：以**管理员身份**运行 PowerShell 或 CMD。

## 9.2 版本符号陷阱

```bash
# 坑：package.json 里写的是 ^3.9.14
# npm install 实际安装了 3.9.16（已修复漏洞版本）
# 复现失败！

# 解决：安装时不要依赖 package.json，直接精确指定
npm install vm2@3.9.14          # 精确版本
npm ci                          # 结合 package-lock.json 严格安装
```

## 9.3 网络问题处理

```bash
# 超时报错：切换镜像源
npm config set registry https://registry.npmmirror.com

# 查看详细网络日志
npm install <pkg> --verbose

# 完全离线安装（使用本地缓存）
npm install --prefer-offline
```
## 9.4 其他常见报错速查

|报错信息|原因|解决方法|
|---|---|---|
|`ENOENT: no such file`|缺少 `package.json`|先执行 `npm init -y`|
|`ERESOLVE unable to resolve`|依赖版本冲突|`npm install --legacy-peer-deps`|
|`npm ERR! code ETIMEDOUT`|网络超时|切换镜像源|
|莫名其妙的安装失败|缓存损坏|`npm cache clean --force` 后重试|
|`Cannot find module 'xxx'`|包未安装或路径错误|`npm install` 重新安装依赖|

---
# 10 CTF 实战速查

## 10.1 漏洞复现标准流程

```bash
# 第一步：查看目标包的所有历史版本
npm view <package-name> versions

# 第二步：对照 CVE 确认漏洞版本号

# 第三步：新建隔离环境
mkdir cve-xxxx && cd cve-xxxx
npm init -y

# 第四步：精确安装漏洞版本
npm install <package-name>@<version>

# 第五步：确认安装版本
npm ls <package-name>

# 第六步：编写并运行 POC
node poc.js
```

**vm2 各 CVE 对应安装命令**：

```bash
npm install vm2@3.6.10    # CVE-2019-10761
npm install vm2@3.9.3     # CVE-2021-23449
npm install vm2@3.9.10    # CVE-2022-36067
npm install vm2@3.9.14    # CVE-2023-29017
npm install vm2@3.10.0    # CVE-2026-22709
```

## 10.2 信息收集常用命令

```bash
# 查看包所有历史版本
npm view <pkg> versions

# 查看某个包的详细信息（含发布时间、依赖等）
npm view <pkg>

# 快速扫描已知漏洞
npm audit

# 查看项目直接依赖
npm ls --depth=0

# 查找某个包在依赖树中的位置
npm ls <package-name>
```

## 10.3 全命令速查表

| 命令                              | 作用             |
| ------------------------------- | -------------- |
| `npm init -y`                   | 快速初始化项目        |
| `npm i <pkg>`                   | 安装包            |
| `npm i <pkg>@<ver>`             | 安装指定版本（复现漏洞必用） |
| `npm i -g <pkg>`                | 全局安装           |
| `npm i -D <pkg>`                | 安装为开发依赖        |
| `npm ci`                        | 严格按锁文件安装       |
| `npm un <pkg>`                  | 卸载包            |
| `npm update <pkg>`              | 更新包            |
| `npm run <script>`              | 运行脚本           |
| `npm start / test`              | 启动 / 测试        |
| `npx <pkg>`                     | 免安装临时执行        |
| `npm ls --depth=0`              | 查看直接依赖         |
| `npm view <pkg> versions`       | 查看所有历史版本       |
| `npm audit`                     | 漏洞扫描           |
| `npm audit fix`                 | 自动修复漏洞         |
| `npm outdated`                  | 检查过时的包         |
| `npm cache clean --force`       | 清理缓存           |
| `npm config get registry`       | 查看当前源          |
| `npm config set registry <url>` | 切换源            |
| `npm whoami`                    | 查看当前登录用户       |
| `npm publish`                   | 发布包            |
| `npm version patch/minor/major` | 升级版本号          |
