---
title: "反射"
date: 2026-07-02 16:39:50 +0800
categories: [WEB_Note]
tags: ["WEB", "JAVA安全", "Java"]
web_folder: "JAVA安全"
source_note: "JAVA安全\2.反射.md"
permalink: /web_note/java-security/02/
render_with_liquid: false
---
# 1. 概念

> 可以将Java这种静态语言附上"**动态特性**"的机制

**动态特性**———"<u>一段代码，改变其中的变量，将会导致这段代码产生功能性的变化</u>"

​               这种随着变量的改变，代码的功能会发生变化的性质即为动态特性（狭义上理解）

​               运行时可以动态地加载、修改、调用 类/方法/对象（广义的定义）

eg_code:

```java
public class ReflectionDemo {
    public static void main(String[] args) throws Exception {

        // 1. 运行时才确定要操作的类
        Class clazz = Class.forName("User");  //clazz对象的类型是class

        // 2. 运行时创建对象
        Object obj = clazz.getDeclaredConstructor().newInstance();
        //通过Class对象，获取类中声明的构造方法，调用获取到的构造方法，创建类的实例对象

        // 3. 运行时获取并修改私有属性
        Field field = clazz.getDeclaredField("name");
        field.setAccessible(true);
        field.set(obj, "BIGX");

        // 4. 运行时获取并调用方法
        Method method = clazz.getMethod("hello");
        method.invoke(obj);
    }
}
```

- 获取类的方法：**`forName`**
- 实例化对象的方法：**`newInstance`**
- 获取函数的方法：**`getMethod`**
- 执行函数的放啊：**`invoke`**

这里提到了获取类的方法 `forName` ，但是这样的方法还有很多

# 2. 获取Class对象

## 2.1 获取类的三种方法

> **`java.lang.Class`** 对象

- **`obj.getClass()`**

如果上下文中存在某个类的实例 `obj` ，那么可以直接通过改方法获取它的类

- **`Test.class`**

如果已经加载了某个类，若只是想获取其 `java.lang.Class` 对象，那么直接拿它的 `class` 属性就行（严格讲该方法不属于反射）

- **`Class.forName`**

若知晓了某个类的名字，想获取这个类，可以使用 `forName` 来获取

---

**forName** 对于攻击者来说是最有利的———正常情况下，除了系统类，如果要拿到一个类，需要先 `import`。而使用 `forName` 就不需要，因此可以在运行时动态加载任意类，这在沙盒绕过和漏洞利用中极为关键

```java
# 绕沙盒示例
// 上下文中只有一个 Integer 类型的数字
// 如何拿到可以执行命令的 Runtime 类？
getClass().forName("java.lang.Runtime") 
```

---

这里提了forName是一个重点，接着详细讲一下

## 2.2 forName的两个重载

- **`class<?> forName(String name)`**
- **`class<?> forName(String name, **boolean** initialize, ClassLoader loader)`**

---

第一个是最为常见的class获取方式，也可理解为第二个的一种封装

```java
Class.forName(className)
        ||
Class.forName(className, true, currentLoader)
```

---

三个参数的含义

| 参数             | 说明                                          |
| ---------------- | --------------------------------------------- |
| **`name`**       | 类名/类完整路径                               |
| **`initialize`** | 是否初始化                                    |
| **`loader`**     | ClassLoader（类加载器，Java默认根据类名加载） |



再重点讲一下第二个参数 **`initialize`**

P神文章此处引用的一篇文章说到：`构造函数，初始化时执行`，但实际上该参数 `initialize=true` 并不会执行构造函数，至于为什么，需要了解 **三种"初始化"** 调用顺序

```java
public class TrainPrint {
    // ① 实例初始化块：放在构造函数 super() 后面、构造函数内容前面
    {
        System.out.printf("Empty block initial %s\n", this.getClass());
    }

    // ② 静态初始化块：在"类初始化"时调用（forName initialize=true 触发的就是这里）
    static {
        System.out.printf("Static initial %s\n", TrainPrint.class);
    }

    // ③ 构造函数：new 对象或 newInstance() 时调用
    public TrainPrint() {
        System.out.printf("Initial %s\n", this.getClass());
    }
}
```

**执行顺序**：`static {}` → `{}` → `构造函数`

**结论**：`forName` 中 `initialize=true`，触发的是 **`static{}静态代码块`**，也就是说，这个 `=true` ，就是在告诉Java虚拟机是否执行 "类初始化"

## 2.3 引申利用

既然 `initialize=true` 会触发 `static{}`，那么我们就可以在一段代码有一个参数可控的情况下，在可控参数这里利用java的动态特性，使用forName获取类，如此一来，我们就可以手动编写一个恶意类，其中有 `static{}` ，再将恶意代码放入 `static{}` ，完成利用链。

eg_code:

```java
public void ref(String name) throws Exception {
    Class.forName(name);  // name 参数可控
}
```

其中name参数可控—>手动编写恶意类，恶意代码放入其中 `static{}`，等待forName加载这个类

```java
import java.lang.Runtime;
import java.lang.Process;

public class TouchFile {
    static {
        try {
            Runtime rt = Runtime.getRuntime();
            String[] commands = {"touch", "/tmp/success"};
            Process pc = rt.exec(commands);
            pc.waitFor();
        } catch (Exception e) {
            // do nothing
        }
    }
}
```

逻辑上就这样通了，具体关于恶意类如何传入，涉及ClassLoader，后续讲解

## 2.4 内部类

上面讲的引申利用是编写恶意普通类，但是如果普通类被黑名单拦截了，就可以用内部类的 `$` 语法，构造一个黑名单未覆盖的类。

Java的普通类 C1 中支持编写内部类 C2 ，而在编译的时候，会生成两个文件： **`C1.class`** 和 **`C1$C2.class`** ，我们可以把他们看作两个无关的类，通过 **`Class.forName("C1$C2")`** 即可加载这个内部类。

> [!NOTE]
>
> 但在实际情况下，内部类的方法也可能被拦截，例如：`fastjson` 在 `checkAutoType` 时会先将 **`$`** 替换成 **`.`**
>
> 即：`Class.forName("C1$C2")` 变成了 `Class.forName("C1.C2")` ，内部类就无法正常加载了

# 3. 实例化对象

上一大章节主要讲的是获取类，那么在获取类之后如何利用呢可以，便来到该章节，实例化类(3)、并调用方法(4)

## 基础

```java
Class clazz = Class.forName("com.example.Dog");
Object obj = clazz.newInstance();  // 调用无参构造函数
```

**`newInstance()`** 的作用就是调用这个类的**无参构造函数**

但是 `newInstance()` 经常会不成功（两点原因）：

- **使用的类没有无参构造函数**
- **使用的类构造函数是私有的**

最为常见的原因是类型二的一个例子——— **`java.lang.Runtime`**

该类直接用 `newInstance` 调用会报错，eg_code：

```java
Class clazz = Class.forName("java.lang.Runtime");
clazz.getMethod("exec", String.class).invoke(clazz.newInstance(), "id");
```

直接这样执行命令会报错

```
IllegalAccessException: Class can not access a member of class
java.lang.Runtime with modifiers "private"
```

原因就是说的类型二：Runtime 类的构造方法是私有的

### 单例模式

这是三级标题，也可看出是对基础问题的延申———Runtime类的构造方法是私有的，那用户怎么使用？给用户一个私有类使用？？这就涉及了常见的设计模式"**单例模式**"

很常见的设计模式，以数据库连接为例：数据库连接只需要建立一次，而不是每次用到时新建一个，所以把构造函数设为 `private`，通过静态方法统一获取：

```java
public class TrainDB {
    // 类初始化时创建唯一实例
    private static TrainDB instance = new TrainDB();

    // 对外提供获取实例的静态方法
    public static TrainDB getInstance() {
        return instance;
    }

    // 构造函数私有化，外部无法 new
    private TrainDB() {
        // 建立连接的代码...
    }
}
```

像这样，只有类初始化的时候会执行**一次**构造函数，后面只能通过 **`getInstance`** 获取这个对象，避免建立多个数据库连接

`Runtime`类就是这样的单例模式，只能通过 **`Runtime.getRuntime()`**来获取**`Runtime`** 对象：（Payload）

```java
Class clazz = Class.forName("java.lang.Runtime");
clazz.getMethod("exec",String.class).invoke(clazz.getMethod("getRuntime").invoke(clazz),"calc.exe");
```

---

- Payload分解版

这里建议看完第四部分调用方法之后再回来食用，该处补充是在 `getMethod` 和 `invoke` 的基础上对获取Runtime对象的Payload的拆解：

```java
Class clazz = Class.forName("java.lang.Runtime");  
Method execMethod = clazz.getMethod("exec", String.class);
Method getRuntimeMethod = clazz.getMethod("getRuntime");
Object runtime = getRuntimeMethod.invoke(clazz);
execMethod.invoke(runtime, "calc.exe");
```

分行讲解：

```java
// 第一步：获取 Runtime 类
Class clazz = Class.forName("java.lang.Runtime");

// 第二步：获取 getRuntime 静态方法
Method getRuntimeMethod = clazz.getMethod("getRuntime");

// 第三步：调用 getRuntime()，得到 Runtime 实例
// getRuntime 是静态方法，invoke 第一个参数传类本身
Object runtime = getRuntimeMethod.invoke(clazz);

// 第四步：获取 exec 方法
Method execMethod = clazz.getMethod("exec", String.class);

// 第五步：调用 exec，传入要执行的命令
// exec 是普通方法，invoke 第一个参数传实例对象
execMethod.invoke(runtime, "calc.exe");//calc.exe这里填写命令
```

---

# 4. 调用方法

2讲了获取对象，3讲了实例化对象，接下来利用继续———调用方法（<u>获取方法、执行方法</u>）

在文章最初示例反射机制的代码和单例模式的修改后Payload中都可以看到两个方法 **`getMethod`** 和 **`invoke`**

## getMethod

> 通过反射获取一个类的某个特定的**公有方法**

由于Java支持类的重载，所以我们不能仅通过函数名来确定一个函数，因此在调用该方法时必须传入要获取的**参数类型列表**

eg_code:

这里依照Payload的代码

```java
// 格式：getMethod(方法名, 参数类型1.class, 参数类型2.class, ...)
clazz.getMethod("exec", String.class)
// 表示：获取名为 exec，且参数类型是 String 的方法
```

`Runtime`是单例模式，提供了 `getRuntime()` 静态方法获取实例，所以说能拿到实例并调用 `exec()`，即可以用`Runtime.exec()`来执行命令

​                 **↓**

**Runtime.exec()**有6个重载版本：

| 重载方法签名                                       | 对应的 `getMethod` 写法                                      |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `exec(String command)`                             | `getMethod("exec", String.class)`                            |
| `exec(String[] cmdarray)`                          | `getMethod("exec", String[].class)`                          |
| `exec(String command, String[] envp)`              | `getMethod("exec", String.class, String[].class)`            |
| `exec(String[] cmdarray, String[] envp)`           | `getMethod("exec", String[].class, String[].class)`          |
| `exec(String command, String[] envp, File dir)`    | `getMethod("exec", String.class, String[].class, File.class)` |
| `exec(String[] cmdarray, String[] envp, File dir)` | `getMethod("exec", String[].class, String[].class, File.class)` |

## invoke

> 执行方法

**`invoke`** 第一个参数的规则：

- **普通方法**：第一个参数是**类的实例对象**
- **静态方法**：第一个参数是**类本身（clazz）**，或传 **`null`**

```
正常调用：
        对象.方法(参数1, 参数2, ...)
反射调用：
        方法.invoke(对象, 参数1, 参数2, ...)
```

eg_code:

```
obj.exec("id")
    ||
execMethod.invoke(obj, "id")
```

# 5. 调用构造方法

>⌈实例化补丁工具⌋———我个人对这一节所讲方法的理解

通过234节，可以对反射利用总结出一个利用链：<u>**`获取对象、实例化对象、调用方法（执行命令）`**</u>

但是在**实例化对象**时那两点常见不成功原因（使用的类没有无参构造函数，使用的类构造函数是私有的），经常会导致链条受阻，本节围绕 "使用的类没有无参构造函数" 展开，那么

若一个类：

- **没有无参构造函数**
- **没有像单例模式那样的静态方法**

正常来讲，同时具有这两点，链条在实例化对象这个节点就断了，而该节要讲的 "**调用构造方法**" ，则是解决这两个问题、重新连通链条的工具，因此我把该节叫做⌈实例化补丁工具⌋

> [!CAUTION]
>
> 这一节讲得方法无法解决类的构造函数是私有的问题，请看`6.`解决

## getConstructor

这便是该节新引入的反射方法，可用来<u>获取有参构造函数</u>，然后<u>用**`newInstance(参数)`**来实例化</u>

因为构造函数也支持重载，所以和 `getMethod` 类似，`getConstructor` 接收的参数是**构造函数的参数类型列表**

> [!NOTE]
>
> 这里多提一点内容防止混淆：
>
> 不要一看，欸，`newInstance(参数)`，怎么能接收参数了 ，实例化的时候不还是没有无参构造函数导致`newInstance()`失败吗，既然能，那还费劲搞这个新方法干嘛？没有无参又怎么成大问题了？———混淆后的常见疑惑
>
> NoNoNo！
>
> 这两个`newInstance()`完全不是一个东西！
>
> | 来源             | 写法                               | 功能                             | 参数                   |
> | ---------------- | ---------------------------------- | -------------------------------- | ---------------------- |
> | `Class` 类       | `clazz.newInstance()`              | 只能调用**无参构造方法**创建对象 | 无参数                 |
> | `Constructor` 类 | `constructor.newInstance(参数...)` | 可以调用**任意构造方法**创建对象 | 必须和构造方法参数匹配 |
>
> 也就是说，正常来情况只能调用无参，而这里正是因为`getConstructor`获取了构造函数，才有了`newInstance(参数)`，才能调用有参完成实例化
>
> 最后把来源单独拉出来说细一点
>
> | 方法                | 来源                                 |
> | ------------------- | ------------------------------------ |
> | `newInstance()`     | 来源于Class类，自带                  |
> | `newInstance(参数)` | 来源于`getConstructor`获得的构造方法 |

### ProcessBuilder

> **`ProcessBuilder`**是这节讲的只能通过`getConstructor`获取有参构造方法来实例化的类中的典型代表，在通过`getConstructor`实例化之后，需要调用 `start()` 来执行命令。也是执行命令的另一种方法

有两个**构造函数**：

```java
public ProcessBuilder(List<String> command)

public ProcessBuilder(String... command)
```

- **使用构造函数一(List参数)**

```java
// 方式一：强制类型转换写法（需要上下文支持类型转换语法）
Class clazz = Class.forName("java.lang.ProcessBuilder");
((ProcessBuilder)
    clazz.getConstructor(List.class).newInstance(Arrays.asList("calc.exe"))
).start();

// 方式二：完全反射写法（不需要类型转换，漏洞利用中更通用）
Class clazz = Class.forName("java.lang.ProcessBuilder");
clazz.getMethod("start").invoke(clazz.getConstructor(List.class)
      .newInstance(Arrays.asList("calc.exe")));
```

- **使用构造函数二(可变参数)**

**可变长参数(varargs)的本质**：

Java 编译时将可变<u>参数</u>编译成一个<u>数组</u>，以下两种写法在底层等价（因此不能重载）

```java
public void hello(String[] names) {}
public void hello(String... names) {}
// 二者底层完全相同，是同一个方法，不构成重载
```

**对反射的影响**：

如果要获取的目标函数里包含可变长参数，把<u>可变长参数</u>当作**数组**处理即可

```java
// 向getConstructor传入 String[].class（字符串数组的类），获取构造函数二
Class clazz = Class.forName("java.lang.ProcessBuilder");
clazz.getConstructor(String[].class);


# 完整 Payload
// 在调用newInstance时，这个函数本身接收可变参数
// ProcessBuilder的构造函数也是可变参数
// 两者叠加 → 需要传**二维数组**
Class clazz = Class.forName("java.lang.ProcessBuilder");
((ProcessBuilder)
    clazz.getConstructor(String[].class)
         .newInstance(new String[][]{{"calc.exe"}})
).start();
```

# 6. 私有方法和构造方法的调用

上一节我们已经解决了实例化的第一个问题，学会了用 `getConstructor` 去调用公有的有参构造函数解决没有无参构造函数的问题，再往前的一节学会了在实例化之后用 `getMethod` 获取一个类的某个特定的公有方法。

但是实际情况中：

- **构造函数可能是私有的**
  - 对应了实例化的第二个问题
- **类的方法也可能是私有的**
  - 对应了调用方法的局限

关于如何解决这两种情况，普通的 `getConstructor` 和 `getMethod` 是行不通的，这俩针对于公有的构造函数或方法，那么就需要引入 **`getDeclared`** 系列的反射

## 6.1 区别

| 方法                     | 获取范围                                             | 能否获取私有 |
| ------------------------ | ---------------------------------------------------- | ------------ |
| `getMethod`              | 当前类的所有**公有**方法，包含从父类继承的           | ❌            |
| `getDeclaredMethod`      | 当前类中**声明**的所有方法，包含私有，但不含继承来的 | ✅            |
| `getConstructor`         | 当前类的所有**公有**构造方法                         | ❌            |
| `getDeclaredConstructor` | 当前类中**声明**的所有构造方法，包含私有             | ✅            |
| `getField`               | 当前类的所有**公有**字段，包含继承的                 | ❌            |
| `getDeclaredField`       | 当前类中**声明**的所有字段，包含私有，但不含继承的   | ✅            |

获取的范围不一样，但是在**用法**上，`getMethod` 跟 `getDeclaredMethod` 、`getConstructor` 跟 `getDeclaredConstructor` 是十分类似的

## setAccessible

> 绕过访问控制

首先介绍一个本节很重要的一个**方法**

通过 `getDeclared` 系列拿到<u>私有方法/构造方法/字段</u>后，必须用 **`setAccessible(true)`** 修改作用域才能调用，否则仍然会报 **`IllegalAccessException`**，即不可调用

```java
method.setAccessible(true);       // 私有方法解锁
constructor.setAccessible(true);  // 私有构造方法解锁
field.setAccessible(true);        // 私有字段解锁
```

## 6.2 示例

前面讲过一个特殊的类 **`Runtime`** ，第二类原因`类的构造函数是私有的` 中的典例，由于单例模式，需要用`Runtime.getRuntime()` 来获取对象。学习到现在，便可以再加一种方法，也算是绕过了单例模式构造方法私有的局限———直接用 **`getDeclaredConstructor`** 来获取这个<u>私有的构造方法</u>来实例化对象，进行调用方法，执行命令

```java
Class clazz = Class.forName("java.lang.Runtime");
Constructor m = clazz.getDeclaredConstructor();
m.setAccessible(true);
clazz.getMethod("exec", String.class).invoke(m.newInstance(), "calc.exe");
```

详细解释一下

```java
Class clazz = Class.forName("java.lang.Runtime");

// 获取私有无参构造方法
Constructor m = clazz.getDeclaredConstructor();

// 解除访问限制（必须）
m.setAccessible(true);

// 实例化 Runtime 对象
Object runtime = m.newInstance();

// 调用 exec 执行命令
clazz.getMethod("exec", String.class).invoke(runtime, "calc.exe");
```

这样就绕过了单例模式的限制，不需要通过 `getRuntime()` 就能直接获得 `Runtime` 实例

---

# 7.补充

到第六节，其实关于反射的内容就全部学完了，第七节是对于反射内容的一点补充和总结

## Payload总结

- **Runtime.exec（通过 getRuntime 静态方法）**

```java
// 推荐方式：利用单例模式的 getRuntime 获取实例
Class clazz = Class.forName("java.lang.Runtime");
clazz.getMethod("exec", String.class)
     .invoke(clazz.getMethod("getRuntime").invoke(clazz), "calc.exe");
```

- **Runtime.exec（通过私有构造方法）**

```java
// 绕过单例限制，直接实例化
Class clazz = Class.forName("java.lang.Runtime");
Constructor c = clazz.getDeclaredConstructor();
c.setAccessible(true);
clazz.getMethod("exec", String.class).invoke(c.newInstance(), "calc.exe");
```

- **ProcessBuilder（List 参数构造函数，完全反射）**

```java
// 不使用强制类型转换，完全通过反射调用
Class clazz = Class.forName("java.lang.ProcessBuilder");
clazz.getMethod("start")
     .invoke(
         clazz.getConstructor(List.class)
              .newInstance(Arrays.asList("calc.exe"))
     );
```

- **ProcessBuilder（String[] 可变参数构造函数）**

```java
Class clazz = Class.forName("java.lang.ProcessBuilder");
((ProcessBuilder)
    clazz.getConstructor(String[].class)
         .newInstance(new String[][]{{"calc.exe"}})
).start();
```

## 利用点

| 知识点                            | 对应的利用点                                               |
| --------------------------------- | ---------------------------------------------------------- |
| `Class.forName` 参数可控          | 可加载任意类，触发目标类的 `static {}` 执行恶意代码        |
| `static {}` 静态代码块            | 类加载时自动执行，反序列化利用链的重要触发点（无需实例化） |
| `setAccessible(true)`             | 绕过 `private` 访问控制，调用私有方法/构造/字段            |
| `getDeclaredMethod`               | 获取并调用私有方法，绕过封装                               |
| `invoke` 调用任意方法             | 反序列化利用链中动态调用目标方法的核心手段                 |
| `newInstance`                     | 动态实例化任意类                                           |
| `Runtime.exec` / `ProcessBuilder` | Java RCE 的最终执行点                                      |
| 内部类 `$` 符号                   | `forName("C1$C2")` 加载内部类，可绕过部分黑名单            |

## 利用链

其实就是我大纲的章节顺序：**`获取类 → 实例化 → 调用方法、执行命令`**

```java
反序列化触发点（readObject）
    ↓
【第一步：动态加载类】
Class<?> clazz = Class.forName("java.lang.Runtime");

    ↓
【第二步：获取并实例化对象（突破私有构造）】
Constructor<?> constructor = clazz.getDeclaredConstructor();
constructor.setAccessible(true);
Runtime runtime = (Runtime) constructor.newInstance();

    ↓
【第三步：获取并调用执行方法】
Method execMethod = clazz.getDeclaredMethod("exec", String.class);
execMethod.setAccessible(true);
execMethod.invoke(runtime, "calc.exe");

    ↓
【最终执行点：命令执行】
Runtime.exec("calc.exe") / ProcessBuilder.start()
```

## 防御

```
1. 不要将外部可控的字符串直接传入 Class.forName()
2. 对 forName 的参数做白名单校验
3. 反序列化场景中使用 ObjectInputFilter（Java 9+）限制可反序列化的类
4. 注意 static {} 的执行时机，避免在静态代码块中执行危险操作
5. setAccessible 可以绕过所有访问控制，代码审计时重点关注
```

















