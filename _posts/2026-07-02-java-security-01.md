---
title: "Java语言学习"
date: 2026-07-02 16:41:03 +0800
categories: [WEB_Note]
tags: ["WEB", "JAVA安全", "Java"]
web_folder: "JAVA安全"
source_note: "JAVA安全/1.Java语言学习.md"
permalink: /web_note/java-security/01/
render_with_liquid: false
---
# 目录

```
1  核心概念与程序结构
2  数据类型
3  运算符
4  控制流
5  数组
6  对象与类
7  方法详解
8  继承与多态
9  接口与抽象类
10 异常处理
11 常用类与集合框架
12 JVM 运行机制

```

------

# 1 核心概念与程序结构

## 1.1 四个前置核心概念

- **类**：一系列具有共同属性的事物的集合，描述一类对象的行为和状态
- **对象**：类的一个实例，有状态和行为
  - 对象：狗；状态：颜色、名字、品种；行为：摇尾巴、叫、吃
- **方法**：方法就是行为，一个类可以有很多方法，逻辑运算、数据修改以及所有动作都在方法中完成
- **实例变量**：每个对象都有独特的实例变量，对象的状态由这些实例变量的值决定

## 1.2 基础程序结构

```java
public class Welcome {
    public static void main(String[] args) {
        System.out.println("Hello Java");
    }
}

```

逐行拆解：

```java
访问修饰符  类  类的名称
  ↓       ↓    ↓
public class Welcome {
                        方法名  String数组类型
                          ↓       ↓
    public static void main(String[] args) {
             ↑       ↑                  ↑
         关键字(静态) 返回类型(无返回值)   参数名
        System.out.println("Hello Java");
          ↑     ↑         ↑
        系统类 标准输出   打印方法
    }
}

```

## 1.3 注意点

- **大小写敏感**：`Hello` 与 `hello` 是不同的标识符
- **类名**：首字母大写，多个单词每个首字母大写（大驼峰），如 `MyFirstClass`
- **方法名**：首字母小写，后续单词首字母大写（小驼峰），如 `myMethod`
- **源文件名**：必须与类名完全一致，后缀 `.java`，否则编译报错
- **主方法入口**：固定签名 `public static void main(String[] args)`，JVM 从这里开始执行

## 1.4 注释

- **单行注释**

```
//

```

- **多行注释**

```
/* ... */

```

- **文档注释**

```
/** ... */

```

## 1.5 标识

Java 所有组成部分（类名、变量名、方法名）都需要名字，统称标识符。

- 以字母（A-Z / a-z）、美元符 `$`、下划线 `_` 开头
- 后续可接字母、数字、`$`、`_`
- 关键字不能用作标识符
- 大小写敏感

```
合法：age  $salary  _value  __1_value
非法：123abc  -salary  class（关键字）

```

## 1.6 访问修饰符

**访问控制修饰符**（控制可见范围）：

| 修饰符            | 同类 | 同包 | 子类 | 其他包 |
| ----------------- | ---- | ---- | ---- | ------ |
| `private`         | ✅    | ❌    | ❌    | ❌      |
| `default`（不写） | ✅    | ✅    | ❌    | ❌      |
| `protected`       | ✅    | ✅    | ✅    | ❌      |
| `public`          | ✅    | ✅    | ✅    | ✅      |

**非访问控制修饰符**（控制行为特性）：

| 修饰符         | 作用                                             |
| -------------- | ------------------------------------------------ |
| `static`       | 静态成员，属于类本身而非对象                     |
| `final`        | 最终值，变量不可修改 / 方法不可重写 / 类不可继承 |
| `abstract`     | 抽象，方法无实现 / 类不可实例化                  |
| `synchronized` | 线程同步锁                                       |
| `transient`    | 序列化时跳过该字段（与 Java 反序列化安全强相关） |
| `volatile`     | 保证变量的内存可见性（多线程）                   |

> **安全关注点**：`transient` 修饰的字段在序列化时被忽略，反序列化漏洞分析时需要特别注意哪些字段是 transient 的。

## 1.7 Java 关键字

| 类别       | 关键字                                                       | 说明         |
| ---------- | ------------------------------------------------------------ | ------------ |
| 访问控制   | `private` `protected` `public` `default`                     | 可见性控制   |
| 类与修饰符 | `abstract` `class` `extends` `final` `implements` `interface` `native` `new` `static` `synchronized` `transient` `volatile` | 类结构与行为 |
| 程序控制   | `break` `case` `continue` `do` `else` `for` `if` `instanceof` `return` `switch` `while` | 流程控制     |
| 错误处理   | `assert` `catch` `finally` `throw` `throws` `try`            | 异常机制     |
| 包相关     | `import` `package`                                           | 包管理       |
| 基本类型   | `boolean` `byte` `char` `double` `float` `int` `long` `short` | 原始类型     |
| 引用       | `super` `this` `void`                                        | 对象引用     |
| 保留       | `goto` `const`                                               | 保留但不可用 |

> `null`、`true`、`false` 不是关键字，是字面常量，不可用作标识符。

上面是按类来的，下面再单独列出来

| 类别                 | 关键字                         | 说明                 |
| :------------------- | :----------------------------- | :------------------- |
| 访问控制             | private                        | 私有的               |
| protected            | 受保护的                       |                      |
| public               | 公共的                         |                      |
| default              | 默认                           |                      |
| 类、方法和变量修饰符 | abstract                       | 声明抽象             |
| class                | 类                             |                      |
| extends              | 扩充、继承                     |                      |
| final                | 最终值、不可改变的             |                      |
| implements           | 实现（接口）                   |                      |
| interface            | 接口                           |                      |
| native               | 本地、原生方法（非 Java 实现） |                      |
| new                  | 创建                           |                      |
| static               | 静态                           |                      |
| strictfp             | 严格浮点、精准浮点             |                      |
| synchronized         | 线程、同步                     |                      |
| transient            | 短暂                           |                      |
| volatile             | 易失                           |                      |
| 程序控制语句         | break                          | 跳出循环             |
| case                 | 定义一个值以供 switch 选择     |                      |
| continue             | 继续                           |                      |
| do                   | 运行                           |                      |
| else                 | 否则                           |                      |
| for                  | 循环                           |                      |
| if                   | 如果                           |                      |
| instanceof           | 实例                           |                      |
| return               | 返回                           |                      |
| switch               | 根据值选择执行                 |                      |
| while                | 循环                           |                      |
| 错误处理             | assert                         | 断言表达式是否为真   |
| catch                | 捕捉异常                       |                      |
| finally              | 有没有异常都执行               |                      |
| throw                | 抛出一个异常对象               |                      |
| throws               | 声明一个异常可能被抛出         |                      |
| try                  | 捕获异常                       |                      |
| 包相关               | import                         | 引入                 |
| package              | 包                             |                      |
| 基本类型             | boolean                        | 布尔型               |
| byte                 | 字节型                         |                      |
| char                 | 字符型                         |                      |
| double               | 双精度浮点                     |                      |
| float                | 单精度浮点                     |                      |
| int                  | 整型                           |                      |
| long                 | 长整型                         |                      |
| short                | 短整型                         |                      |
| 变量引用             | super                          | 父类、超类           |
| this                 | 本类                           |                      |
| void                 | 无返回值                       |                      |
| 保留关键字           | goto                           | 是关键字，但不能使用 |
| const                | 是关键字，但不能使用           |                      |

## 1.8 Java 源程序与编译型运行区别

```
纯编译型（C/C++）：
源代码 → 编译器 → 机器码 → 直接在 OS 上运行
缺点：不同平台需要重新编译

Java（编译+解释）：
源代码（.java）
    ↓ javac 编译器
字节码（.class）← 平台无关的中间代码
    ↓ JVM（Java 虚拟机）
机器码 → 在当前 OS 上运行

优势："一次编写，到处运行"（Write Once, Run Anywhere）
安全关注：.class 文件可以被反编译（javap / jadx / cfr）还原为接近源代码的形式

```

<img src="/assets/images/web-note/web-note-008.png" alt="JAVA区别" style="zoom:150%;" />

# 2 数据类型

## 2.1 基本类型（Primitive Type）

Java 有 8 种基本类型，直接存储值，存放在**栈**内存中。

| 类型      | 大小   | 范围                 | 默认值   | 示例                   |
| --------- | ------ | -------------------- | -------- | ---------------------- |
| `byte`    | 1 字节 | -128 ~ 127           | 0        | `byte b = 10;`         |
| `short`   | 2 字节 | -32768 ~ 32767       | 0        | `short s = 200;`       |
| `int`     | 4 字节 | -2^31 ~ 2^31-1       | 0        | `int i = 100;`         |
| `long`    | 8 字节 | -2^63 ~ 2^63-1       | 0L       | `long l = 100L;`       |
| `float`   | 4 字节 | 约 ±3.4×10^38        | 0.0f     | `float f = 3.14f;`     |
| `double`  | 8 字节 | 约 ±1.8×10^308       | 0.0      | `double d = 3.14;`     |
| `char`    | 2 字节 | 0 ~ 65535（Unicode） | `\u0000` | `char c = 'A';`        |
| `boolean` | 1 位   | true / false         | false    | `boolean flag = true;` |

```java
// 注意事项
long l = 100L;      // long 字面量需要加 L
float f = 3.14f;    // float 字面量需要加 f，否则默认是 double
int hex = 0xFF;     // 十六进制字面量
int bin = 0b1010;   // 二进制字面量（Java 7+）
int big = 1_000_000; // 下划线分隔数字（Java 7+，提高可读性）

```

## 2.2 引用类型（Reference Type）

引用类型存储的是对象的**内存地址**（引用），对象本身存放在**堆**内存中。

```
引用类型包括：
- 类（Class）         → String、Scanner、自定义类
- 接口（Interface）   → List、Map
- 数组（Array）       → int[]、String[]
- 枚举（Enum）
// 引用类型示例
String str = "Hello";   // str 存的是 "Hello" 对象在堆中的地址
int[] arr = new int[5]; // arr 存的是数组在堆中的地址

// 基本类型 vs 引用类型的赋值行为
int a = 10;
int b = a;   // 复制值，a 和 b 互不影响
b = 20;
System.out.println(a); // 10，不受影响

int[] arr1 = {1, 2, 3};
int[] arr2 = arr1;     // 复制引用（地址），arr1 和 arr2 指向同一个数组
arr2[0] = 99;
System.out.println(arr1[0]); // 99，受影响（同一个堆对象）

```

## 2.3 类型转换

### 自动类型转换（隐式，小转大）

```java
// 转换方向：byte → short → int → long → float → double
int i = 100;
long l = i;      // 自动转换，安全
double d = i;    // 自动转换，安全

char c = 'A';
int ascii = c;   // char 自动转为 int，得到 65

```

### 强制类型转换（显式，大转小，可能丢失精度）

```java
double d = 3.99;
int i = (int) d;    // 强制转换，结果为 3（截断小数，不四舍五入）

int big = 300;
byte b = (byte) big; // 强制转换，300 超出 byte 范围，结果为 44（截断高位）

```

### 字符串转换

```java
// 其他类型 → String
int i = 100;
String s1 = String.valueOf(i);  // "100"
String s2 = i + "";             // "100"（利用字符串拼接）
String s3 = Integer.toString(i);// "100"

// String → 其他类型
String s = "123";
int n = Integer.parseInt(s);      // 123
double d = Double.parseDouble(s); // 123.0
boolean b = Boolean.parseBoolean("true"); // true

// 注意：parseXxx 方法在字符串格式不正确时抛出 NumberFormatException
// 这是 Web 应用中常见的异常，与输入验证相关

```

------

# 3 运算符

## 3.1 算术运算符

```java
int a = 10, b = 3;
System.out.println(a + b);  // 13
System.out.println(a - b);  // 7
System.out.println(a * b);  // 30
System.out.println(a / b);  // 3（整数除法，截断）
System.out.println(a % b);  // 1（取余）

// 自增自减
int x = 5;
x++;   // x = 6（后置：先使用再自增）
++x;   // x = 7（前置：先自增再使用）
int y = x++;  // y = 7，x = 8（先把 x 赋给 y，再 x 自增）
int z = ++x;  // z = 9，x = 9（先 x 自增，再赋给 z）

```

## 3.2 比较与逻辑运算符

```java
// 比较运算符（返回 boolean）
==  !=  >  <  >=  <=

// 逻辑运算符
&&   // 短路与：左边为 false 时不计算右边

||   // 短路或：左边为 true 时不计算右边
!    // 非

// 短路特性示例（与安全代码有关）
String s = null;
if (s != null && s.equals("admin")) { }   // 安全：s 为 null 时短路，不会 NullPointerException
if (s.equals("admin") && s != null) { }   // 危险：s 为 null 时先调用 equals，NPE

```

## 3.3 位运算符

```java
&    // 按位与

|    // 按位或
^    // 按位异或（相同为 0，不同为 1）
~    // 按位取反
<<   // 左移（乘以 2 的幂）

>>   // 右移（除以 2 的幂，保留符号位）
>>>  // 无符号右移（高位补 0）

// 示例
int a = 0b1010;  // 10
int b = 0b1100;  // 12
System.out.println(a & b);   // 0b1000 = 8
System.out.println(a | b);   // 0b1110 = 14
System.out.println(a ^ b);   // 0b0110 = 6
System.out.println(a << 1);  // 0b10100 = 20（左移1位 = ×2）

// 安全关注：加密算法、哈希计算中大量使用位运算
// 理解位运算有助于分析 Java 中的加密实现

```

## 3.4 三元运算符与 instanceof

```java
// 三元运算符
int max = (a > b) ? a : b;  // 如果 a > b 则取 a，否则取 b

// instanceof：判断对象是否是某个类的实例
Object obj = "Hello";
if (obj instanceof String) {
    String s = (String) obj;  // 安全地强制转换
    System.out.println(s.length());
}

// 安全关注：instanceof 在反序列化漏洞分析中非常重要
// 很多反序列化利用链中会用 instanceof 检查对象类型

```

------

# 4 控制流

## 4.1 条件语句

```java
// if-else
int score = 85;
if (score >= 90) {
    System.out.println("优秀");
} else if (score >= 75) {
    System.out.println("良好");
} else if (score >= 60) {
    System.out.println("及格");
} else {
    System.out.println("不及格");
}

// switch（Java 14+ 支持箭头表达式）
String day = "MONDAY";
switch (day) {
    case "MONDAY":
    case "TUESDAY":
        System.out.println("工作日");
        break;          // 必须有 break，否则会穿透到下一个 case
    case "SATURDAY":
    case "SUNDAY":
        System.out.println("周末");
        break;
    default:
        System.out.println("其他");
}

// switch 支持的类型：byte short int char String enum（注意：不支持 long double）

```

## 4.2 循环语句

```java
// for 循环
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}

// while 循环（先判断再执行）
int i = 0;
while (i < 5) {
    System.out.println(i);
    i++;
}

// do-while 循环（先执行再判断，至少执行一次）
int j = 0;
do {
    System.out.println(j);
    j++;
} while (j < 5);

// 增强 for 循环（for-each，遍历数组和集合）
int[] arr = {1, 2, 3, 4, 5};
for (int num : arr) {
    System.out.println(num);
}

// 跳转
break;      // 跳出当前循环
continue;   // 跳过本次循环，继续下一次

// 带标签的 break（跳出多层循环）
outer:
for (int x = 0; x < 3; x++) {
    for (int y = 0; y < 3; y++) {
        if (x == 1 && y == 1) break outer;  // 直接跳出外层循环
        System.out.println(x + "," + y);
    }
}

```

------

# 5 数组

## 5.1 一维数组

```java
// 声明和初始化
int[] arr1 = new int[5];           // 声明并分配空间（默认值 0）
int[] arr2 = {1, 2, 3, 4, 5};     // 声明并初始化
int[] arr3 = new int[]{1, 2, 3};  // 另一种初始化方式

// 访问元素（下标从 0 开始）
arr1[0] = 10;
System.out.println(arr2[2]);  // 3

// 数组长度
System.out.println(arr2.length);  // 5（注意是属性，不是方法，没有括号）

// 越界访问会抛出 ArrayIndexOutOfBoundsException
// 这是 Java 代码审计中需要关注的异常类型

```

## 5.2 多维数组

```java
// 二维数组（本质是数组的数组）
int[][] matrix = new int[3][4];   // 3行4列
int[][] matrix2 = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

// 访问
System.out.println(matrix2[1][2]);  // 6（第2行第3列）

// 遍历
for (int r = 0; r < matrix2.length; r++) {
    for (int c = 0; c < matrix2[r].length; c++) {
        System.out.print(matrix2[r][c] + " ");
    }
    System.out.println();
}

```

## 5.3 Arrays 工具类

```java
import java.util.Arrays;

int[] arr = {5, 2, 8, 1, 9};

Arrays.sort(arr);                    // 排序（原地修改）
System.out.println(Arrays.toString(arr)); // 打印：[1, 2, 5, 8, 9]
int idx = Arrays.binarySearch(arr, 5);   // 二分查找（前提已排序）
int[] copy = Arrays.copyOf(arr, 3);      // 复制前3个元素
int[] copy2 = Arrays.copyOfRange(arr, 1, 4); // 复制下标1~3
Arrays.fill(arr, 0);                     // 全部填充为0
boolean eq = Arrays.equals(arr, copy);  // 比较两个数组是否相等

```

------

# 6 对象与类

## 6.1 类的定义

```java
// 类是对象的模板/蓝图
public class Dog {
    // 实例变量（成员变量）：描述状态
    String name;       // 访问修饰符默认 default
    private int age;   // private：只在类内部访问
    String breed;

    // 静态变量（类变量）：属于类本身，所有对象共享
    static int count = 0;

    // 常量
    static final String SPECIES = "Canis lupus familiaris";
}

```

## 6.2 构造方法

```java
public class Dog {
    String name;
    private int age;

    // 无参构造方法
    public Dog() {
        this.name = "Unknown";
        this.age = 0;
        Dog.count++;
    }

    // 有参构造方法
    public Dog(String name, int age) {
        this.name = name;    // this 指向当前对象，区分同名的参数和成员变量
        this.age = age;
        Dog.count++;
    }

    // 构造方法重载（方法名相同，参数不同）
    public Dog(String name) {
        this(name, 0);  // 调用同类的另一个构造方法（必须是第一行）
    }
}

```

**构造方法特点**：

- 方法名与类名完全相同
- 没有返回值类型（连 `void` 都不写）
- 如果没有手动定义构造方法，编译器自动提供无参构造
- 一旦手动定义了有参构造，编译器**不再**自动提供无参构造
- 不可被继承，不可被 `static`、`final`、`abstract` 修饰

## 6.3 对象的创建与使用

```java
public class Main {
    public static void main(String[] args) {
        // 创建对象（实例化）
        Dog d1 = new Dog("Tom", 3);
        Dog d2 = new Dog("Max");
        Dog d3 = new Dog();

        // 访问成员变量
        System.out.println(d1.name);     // Tom
        // d1.age 报错，age 是 private

        // 调用方法
        d1.bark();
        d1.setAge(5);
        System.out.println(d1.getAge()); // 5

        // 访问静态成员（通过类名访问，不推荐通过对象访问）
        System.out.println(Dog.count);   // 3
        System.out.println(Dog.SPECIES);
    }
}

```

## 6.4 封装（Getter / Setter）

封装是面向对象的三大特性之一，核心思想：**隐藏内部实现，对外提供接口**。

```java
public class Dog {
    private String name;
    private int age;

    // Getter：获取私有变量
    public String getName() {
        return name;
    }

    // Setter：设置私有变量（可加校验逻辑）
    public void setAge(int age) {
        if (age < 0 || age > 30) {
            throw new IllegalArgumentException("年龄不合法: " + age);
        }
        this.age = age;
    }

    public int getAge() {
        return age;
    }

    // 实例方法
    public void bark() {
        System.out.println(name + " 汪汪叫！");
    }

    // 静态方法（属于类，不需要创建对象就能调用）
    public static int getCount() {
        return count;  // 静态方法只能访问静态成员
    }

    @Override
    public String toString() {
        return "Dog{name='" + name + "', age=" + age + "}";
    }
}

```

## 6.5 this 关键字

```java
public class Dog {
    String name;
    int age;

    // ① 区分成员变量和局部变量（同名时）
    public Dog(String name, int age) {
        this.name = name;  // this.name 是成员变量，name 是参数
        this.age = age;
    }

    // ② 调用本类的另一个构造方法（必须在第一行）
    public Dog(String name) {
        this(name, 0);
    }

    // ③ 将当前对象作为参数传给其他方法
    public void register(DogRegistry registry) {
        registry.add(this);  // 把当前 Dog 对象传进去
    }
}

```

## 6.6 static 关键字

```java
public class Counter {
    // 静态变量：属于类，所有实例共享同一份
    private static int count = 0;

    // 实例变量：每个对象独有一份
    private String name;

    public Counter(String name) {
        this.name = name;
        count++;  // 每创建一个对象，计数加一
    }

    // 静态方法：不需要创建对象即可调用
    // 静态方法内部不能使用 this，不能访问实例变量
    public static int getCount() {
        return count;
    }

    // 静态代码块：类加载时执行一次，早于构造方法
    static {
        System.out.println("Counter 类被加载了");
        count = 0;
    }
}

// 使用
Counter c1 = new Counter("A");
Counter c2 = new Counter("B");
System.out.println(Counter.getCount());  // 2

```

> **安全关注**：静态代码块在类加载时自动执行，这是 Java 反序列化利用链中的重要执行点。

------

# 7 方法详解

## 7.1 方法定义

```java
// 格式：访问修饰符 [static] 返回类型 方法名(参数列表) [throws 异常] { 方法体 }
public static int add(int a, int b) {
    return a + b;
}

// 无返回值
public void printInfo(String msg) {
    System.out.println(msg);
    // void 方法可以有空的 return; 语句，也可以没有
}

```

## 7.2 方法重载（Overload）

同一个类中，**方法名相同，参数列表不同**（参数类型、数量、顺序不同），与返回值无关。

```java
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public double add(double a, double b) {  // 参数类型不同
        return a + b;
    }

    public int add(int a, int b, int c) {    // 参数数量不同
        return a + b + c;
    }

    // 错误示例：仅返回值不同不构成重载，编译报错
    // public double add(int a, int b) { return a + b; }
}

```

## 7.3 参数传递机制（值传递）

Java **只有值传递**，没有引用传递。

```java
// 基本类型：传递值的副本，不影响原变量
public static void change(int x) {
    x = 100;
}
int a = 10;
change(a);
System.out.println(a); // 仍然是 10

// 引用类型：传递引用（地址）的副本，可以修改对象内容，但不能改变原引用指向
public static void modify(int[] arr) {
    arr[0] = 99;   // 修改数组内容，有效（通过副本引用访问同一对象）
}
public static void replace(int[] arr) {
    arr = new int[]{1, 2, 3};  // 改变局部副本指向，无效（原引用不变）
}
int[] nums = {1, 2, 3};
modify(nums);
System.out.println(nums[0]);  // 99，受影响
replace(nums);
System.out.println(nums[0]);  // 99，不受影响

```

## 7.4 可变参数（Varargs）

```java
// 方法可以接收任意数量的同类型参数
public static int sum(int... numbers) {
    int total = 0;
    for (int n : numbers) {
        total += n;
    }
    return total;
}

System.out.println(sum(1, 2, 3));       // 6
System.out.println(sum(1, 2, 3, 4, 5)); // 15
System.out.println(sum());              // 0

// 可变参数本质是数组，必须是方法参数列表的最后一个

```

## 7.5 递归

```java
// 经典递归：计算阶乘
public static long factorial(int n) {
    if (n <= 1) return 1;  // 递归终止条件（基础情况）
    return n * factorial(n - 1);  // 递归调用
}

// 递归必须有终止条件，否则导致 StackOverflowError
// 安全关注：恶意输入导致深度递归 → 消耗大量栈空间 → 栈溢出 → DoS

```

------

# 8 继承与多态

## 8.1 继承（extends）

继承让子类获得父类的属性和方法，实现代码复用。Java 只支持**单继承**（一个类只能有一个直接父类），但支持多层继承。

```java
// 父类（超类）
public class Animal {
    String name;
    int age;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void eat() {
        System.out.println(name + " 在吃东西");
    }

    public void sleep() {
        System.out.println(name + " 在睡觉");
    }
}

// 子类（派生类）
public class Dog extends Animal {
    String breed;

    // 子类构造方法
    public Dog(String name, int age, String breed) {
        super(name, age);  // 调用父类构造方法（必须是第一行）
        this.breed = breed;
    }

    // 子类特有的方法
    public void bark() {
        System.out.println(name + " 汪汪叫！");
    }
}

Dog dog = new Dog("Tom", 3, "拉布拉多");
dog.eat();    // 继承自 Animal
dog.sleep();  // 继承自 Animal
dog.bark();   // Dog 自己的方法

```

## 8.2 super 关键字

```java
public class Dog extends Animal {
    // ① 调用父类构造方法（必须在子类构造方法第一行）
    public Dog(String name, int age) {
        super(name, age);
    }

    // ② 调用父类的被覆盖的方法
    @Override
    public void eat() {
        super.eat();              // 先调用父类的 eat
        System.out.println("Dog 还在找骨头");  // 再追加子类的逻辑
    }

    // ③ 访问父类的成员变量（当父类和子类有同名变量时）
    // super.name 访问父类的 name
}

```

## 8.3 方法重写（Override）

子类对父类方法进行重新实现，方法签名（方法名 + 参数列表）必须相同。

```java
public class Cat extends Animal {
    public Cat(String name, int age) {
        super(name, age);
    }

    // @Override 注解：标明这是重写，编译器会检查是否真的重写了父类方法
    @Override
    public void eat() {
        System.out.println(name + " 优雅地吃猫粮");
    }
}

```

**重载 vs 重写**：

| 对比点     | 重载（Overload）       | 重写（Override）         |
| ---------- | ---------------------- | ------------------------ |
| 发生位置   | 同一个类中             | 子类与父类之间           |
| 方法名     | 相同                   | 相同                     |
| 参数列表   | 必须不同               | 必须相同                 |
| 返回类型   | 无关                   | 必须兼容（相同或子类型） |
| 访问修饰符 | 无关                   | 子类不能比父类更严格     |
| 多态       | 编译时确定（静态多态） | 运行时确定（动态多态）   |

## 8.4 多态

多态是面向对象的核心特性：**同一类型的引用，在运行时表现出不同的行为**。

```java
// 父类引用指向子类对象
Animal a1 = new Dog("Tom", 3, "拉布拉多");
Animal a2 = new Cat("Mimi", 2);

// 调用 eat 方法，运行时根据实际类型决定执行哪个版本
a1.eat();  // 执行 Animal 的 eat（Dog 没有重写）
a2.eat();  // 执行 Cat 重写后的 eat

// 多态的前提：
// 1. 继承关系
// 2. 子类重写了父类方法
// 3. 父类引用指向子类对象

// 向下转型（父类引用 → 子类引用），需要 instanceof 检查
if (a1 instanceof Dog) {
    Dog dog = (Dog) a1;
    dog.bark();  // 调用 Dog 特有的方法
}

// 注意：直接强转不安全，若实际类型不匹配则抛出 ClassCastException
// 这是代码审计中的一个关注点

```

## 8.5 final 类与 final 方法

```java
// final 类：不可被继承
public final class String { }  // String 类就是 final 的
// public class MyString extends String { }  // 编译报错

// final 方法：不可被子类重写
public class Animal {
    public final void breathe() {
        System.out.println("呼吸");  // 所有动物都一样，不允许重写
    }
}

```

------

# 9 接口与抽象类

## 9.1 抽象类（abstract class）

```java
// 抽象类：有抽象方法的类，或被 abstract 修饰的类
// 不能被直接实例化（new），必须由子类继承并实现抽象方法
public abstract class Shape {
    String color;

    // 普通方法（有实现）
    public void setColor(String color) {
        this.color = color;
    }

    // 抽象方法（没有实现，子类必须重写）
    public abstract double getArea();
    public abstract double getPerimeter();

    // 抽象类可以有构造方法（供子类 super() 调用）
    public Shape(String color) {
        this.color = color;
    }
}

// 子类必须实现所有抽象方法
public class Circle extends Shape {
    double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }

    @Override
    public double getPerimeter() {
        return 2 * Math.PI * radius;
    }
}

```

## 9.2 接口（interface）

接口是一种**完全抽象的规范**，定义行为契约，不关心实现。

```java
// 接口定义
public interface Flyable {
    // 接口中的变量默认是 public static final
    double MAX_SPEED = 1000.0;  // 等价于 public static final double MAX_SPEED = 1000.0

    // 接口中的方法默认是 public abstract
    void fly();
    void land();

    // Java 8+ 允许接口有默认方法（有实现）
    default void takeOff() {
        System.out.println("准备起飞...");
    }

    // Java 8+ 允许接口有静态方法
    static void checkWeather() {
        System.out.println("检查天气...");
    }
}

// 实现接口（用 implements）
public class Bird implements Flyable {
    @Override
    public void fly() {
        System.out.println("鸟扑翅飞翔");
    }

    @Override
    public void land() {
        System.out.println("鸟落地");
    }
}

// 一个类可以实现多个接口（弥补 Java 单继承的限制）
public class FlyingFish extends Fish implements Flyable, Swimmable {
    // 必须实现所有接口的所有抽象方法
}

```

## 9.3 抽象类 vs 接口

| 对比点    | 抽象类                 | 接口                                          |
| --------- | ---------------------- | --------------------------------------------- |
| 关键字    | `abstract class`       | `interface`                                   |
| 继承/实现 | `extends`（单继承）    | `implements`（多实现）                        |
| 成员变量  | 任意类型               | 只能是 `public static final`（常量）          |
| 方法      | 可有普通方法和抽象方法 | 默认 abstract，可有 default/static（Java 8+） |
| 构造方法  | 可以有                 | 没有                                          |
| 适用场景  | 有共同代码的"is-a"关系 | 定义行为规范的"can-do"关系                    |

**安全关注**：Java 安全领域中大量使用接口和抽象类（如 `Serializable`、`Externalizable`、`InvocationHandler`），理解它们是分析 Java 反序列化利用链的基础。

------

# 10 异常处理

## 10.1 异常体系

```
Throwable（所有异常和错误的根类）
├── Error（严重错误，程序无法处理）
│   ├── StackOverflowError  → 递归太深，栈溢出
│   ├── OutOfMemoryError    → 堆内存耗尽
│   └── VirtualMachineError
└── Exception（程序可以处理的异常）
    ├── RuntimeException（运行时异常，非受检异常，不强制处理）
    │   ├── NullPointerException       → 空指针
    │   ├── ArrayIndexOutOfBoundsException → 数组越界
    │   ├── ClassCastException         → 类型转换错误
    │   ├── NumberFormatException      → 数字格式错误
    │   ├── ArithmeticException        → 算术错误（如除以0）
    │   └── IllegalArgumentException  → 非法参数
    └── 受检异常（编译器强制要求处理）
        ├── IOException               → I/O 错误
        ├── FileNotFoundException     → 文件不存在
        ├── ClassNotFoundException    → 类未找到（反序列化相关）
        └── SQLException              → 数据库错误

```

## 10.2 try-catch-finally

```java
try {
    // 可能抛出异常的代码
    int result = 10 / 0;
    String s = null;
    s.length();
} catch (ArithmeticException e) {
    // 捕获特定异常（按从具体到抽象的顺序排列）
    System.out.println("除法错误: " + e.getMessage());
} catch (NullPointerException e) {
    System.out.println("空指针: " + e.getMessage());
} catch (Exception e) {
    // 捕获所有 Exception（兜底，放最后）
    System.out.println("其他异常: " + e.getMessage());
    e.printStackTrace();  // 打印完整堆栈信息（调试用）
} finally {
    // 无论是否发生异常，finally 块必定执行
    // 通常用于资源释放（关闭文件、数据库连接等）
    System.out.println("finally 一定执行");
}

```

## 10.3 throw 与 throws

```java
// throw：手动抛出一个异常对象（在方法体内）
public void setAge(int age) {
    if (age < 0) {
        throw new IllegalArgumentException("年龄不能为负数: " + age);
    }
    this.age = age;
}

// throws：声明方法可能抛出的受检异常（在方法签名上）
// 调用者必须处理这个异常
public void readFile(String path) throws IOException, FileNotFoundException {
    // 可能抛出 IOException 的代码
    FileReader fr = new FileReader(path);
}

// 调用时必须处理
try {
    readFile("/etc/passwd");
} catch (IOException e) {
    e.printStackTrace();
}

```

## 10.4 自定义异常

```java
// 继承 Exception（受检）或 RuntimeException（非受检）
public class AuthException extends RuntimeException {
    private int errorCode;

    public AuthException(String message, int errorCode) {
        super(message);  // 调用父类构造，设置异常信息
        this.errorCode = errorCode;
    }

    public int getErrorCode() {
        return errorCode;
    }
}

// 使用
throw new AuthException("认证失败，用户不存在", 401);

```

## 10.5 try-with-resources（Java 7+）

```java
// 自动关闭资源（实现了 AutoCloseable 接口的对象）
// 无需手动在 finally 中关闭
try (FileReader fr = new FileReader("/path/to/file");
     BufferedReader br = new BufferedReader(fr)) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    e.printStackTrace();
}
// 离开 try 块后，br 和 fr 自动调用 close() 方法

```

------

# 11 常用类与集合框架

## 11.1 String 类

```java
// String 是不可变的（immutable），每次操作都产生新对象
String s1 = "Hello";
String s2 = "World";
String s3 = s1 + " " + s2;  // 创建了新的 String 对象

// 常用方法
String s = "Hello, Java!";
s.length()              // 12
s.charAt(0)             // 'H'
s.indexOf("Java")       // 7
s.substring(7)          // "Java!"
s.substring(7, 11)      // "Java"
s.toLowerCase()         // "hello, java!"
s.toUpperCase()         // "HELLO, JAVA!"
s.trim()                // 去除两端空白
s.replace("Java", "World")  // "Hello, World!"
s.split(", ")           // ["Hello", "Java!"]
s.contains("Java")      // true
s.startsWith("Hello")   // true
s.endsWith("!")         // true
s.equals("Hello, Java!") // true（内容比较）
s.equalsIgnoreCase("HELLO, JAVA!")  // true（忽略大小写）

// 重要：== 比较的是引用（地址），equals 比较的是内容
String a = new String("hello");
String b = new String("hello");
System.out.println(a == b);      // false（两个不同对象）
System.out.println(a.equals(b)); // true（内容相同）

// 字符串格式化
String msg = String.format("Name: %s, Age: %d", "Tom", 25);

// 字符串与字节数组转换（与编码/加密相关）
byte[] bytes = s.getBytes("UTF-8");     // 字符串 → 字节数组
String str = new String(bytes, "UTF-8"); // 字节数组 → 字符串

```

## 11.2 StringBuilder 与 StringBuffer

```java
// String 不可变，大量拼接时性能差
// StringBuilder：可变，非线程安全，单线程下推荐使用
StringBuilder sb = new StringBuilder();
sb.append("Hello");
sb.append(", ");
sb.append("Java");
sb.insert(5, "!");        // 在索引5处插入
sb.delete(5, 6);          // 删除索引5~5
sb.reverse();             // 反转
sb.replace(0, 5, "Hi");   // 替换
String result = sb.toString();

// StringBuffer：可变，线程安全（方法都是 synchronized），多线程用
StringBuffer sbf = new StringBuffer("Hello");

```

## 11.3 集合框架

```java
import java.util.*;

// List：有序、可重复
// ArrayList：基于动态数组，查询快，增删慢
List<String> list = new ArrayList<>();
list.add("Apple");
list.add("Banana");
list.add(0, "Cherry");    // 在索引0处插入
list.get(1);              // "Apple"
list.remove(0);           // 按索引删除
list.remove("Banana");    // 按值删除
list.size();              // 元素数量
list.contains("Apple");   // 是否包含
Collections.sort(list);   // 排序

// LinkedList：基于链表，增删快，查询慢，也可作队列/栈使用
LinkedList<Integer> linked = new LinkedList<>();
linked.addFirst(1);
linked.addLast(2);
linked.poll();     // 取出并删除第一个元素（队列操作）

// Set：无序、不可重复
// HashSet：基于哈希表，最常用
Set<String> set = new HashSet<>();
set.add("Apple");
set.add("Apple");  // 重复添加，忽略
set.size();        // 1

// TreeSet：有序 Set（自然排序或自定义排序）
Set<Integer> treeSet = new TreeSet<>();

// Map：键值对，键不可重复
// HashMap：基于哈希表，最常用
Map<String, Integer> map = new HashMap<>();
map.put("Alice", 25);
map.put("Bob", 30);
map.get("Alice");         // 25
map.containsKey("Alice"); // true
map.remove("Bob");
map.size();               // 1

// 遍历 Map
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

// TreeMap：有序 Map（按键排序）
Map<String, Integer> treeMap = new TreeMap<>();

```

## 11.4 泛型

```java
// 泛型：让类/方法支持多种类型，同时保持类型安全
// <T> 是类型参数，使用时指定具体类型

// 泛型类
public class Box<T> {
    private T value;

    public Box(T value) {
        this.value = value;
    }

    public T getValue() {
        return value;
    }
}

Box<String> strBox = new Box<>("Hello");
Box<Integer> intBox = new Box<>(42);

// 泛型方法
public <T> T getFirst(T[] arr) {
    return arr[0];
}

// 通配符
List<?> unknownList         // 任意类型
List<? extends Number>      // Number 及其子类（上界通配符）
List<? super Integer>       // Integer 及其父类（下界通配符）

```

------

# 12 JVM 运行机制

## 12.1 JVM 整体架构

```
Java 源码（.java）
    ↓ javac 编译
字节码（.class）
    ↓ 类加载器（ClassLoader）
JVM 内存结构
    ├── 方法区（Method Area）← 存储类信息、静态变量、常量
    ├── 堆（Heap）          ← 存储所有对象和数组
    ├── 栈（JVM Stack）     ← 每个线程独有，存储方法调用帧
    ├── 本地方法栈          ← native 方法使用
    └── 程序计数器          ← 记录当前线程执行的字节码行号
    ↓ 执行引擎（解释器 + JIT编译器）
机器码执行

```

## 12.2 类加载机制（安全重点）

```
类加载过程：
加载（Loading）→ 验证（Verification）→ 准备（Preparation）→ 解析（Resolution）→ 初始化（Initialization）

加载：找到 .class 文件，读入字节数据，在内存中生成 Class 对象
验证：检查字节码格式是否合法（防止恶意字节码破坏 JVM）
准备：为静态变量分配内存，赋默认值（0 / null / false）
解析：将符号引用替换为直接引用（内存地址）
初始化：执行静态代码块和静态变量赋值（static {}）

```

**双亲委派模型**（安全关注点）：

```
类加载器层级：
BootstrapClassLoader（启动类加载器）← 加载 JDK 核心库（rt.jar）
    ↑ 委派
ExtClassLoader（扩展类加载器）← 加载 JDK 扩展库
    ↑ 委派
AppClassLoader（应用类加载器）← 加载用户的 classpath 下的类
    ↑ 委派
自定义类加载器

工作原理：
收到加载请求 → 先委托给父加载器 → 父加载器找不到才自己加载

安全意义：
防止用户伪造核心类（如伪造 java.lang.String）破坏 JVM
Java 类隔离漏洞（ClassLoader 隔离失效）是一类安全问题
反序列化中的类查找依赖 ClassLoader，理解类加载是分析漏洞的基础

```

## 12.3 JVM 内存区域（与安全的关系）

```java
// 方法区（Method Area / Metaspace）
// 存储：类的字节码、静态变量、常量池、方法信息
// 安全关注：类注入（将恶意类的字节码加载到方法区）

// 堆（Heap）
// 存储：所有 new 出来的对象和数组
// 安全关注：
// 1. OOM（OutOfMemoryError）→ 可被用于 DoS 攻击
// 2. 反序列化时，readObject 创建的对象在堆中

// 栈（JVM Stack）
// 每个方法调用对应一个栈帧，存储局部变量、操作数栈
// 安全关注：StackOverflowError（递归过深）→ DoS 攻击

```

## 12.4 垃圾回收（GC）

```java
// Java 自动管理内存，不需要手动 free
// GC 的判断标准：对象是否还有引用指向它

// 引用类型（与反序列化/内存泄露相关）
// 强引用（Strong Reference）：普通引用，GC 不回收
Object obj = new Object();

// 软引用（Soft Reference）：内存不足时回收
SoftReference<Object> softRef = new SoftReference<>(new Object());

// 弱引用（Weak Reference）：下次 GC 必定回收
WeakReference<Object> weakRef = new WeakReference<>(new Object());

// 虚引用（Phantom Reference）：仅用于跟踪 GC 活动

```

## 12.5 序列化与反序列化基础（安全核心）

```java
import java.io.*;

// 序列化：对象 → 字节流（持久化或网络传输）
// 反序列化：字节流 → 对象（恢复）

// 实现 Serializable 接口的类才能被序列化
public class User implements Serializable {
    // serialVersionUID：序列化版本标识
    // 反序列化时会检查 UID 是否匹配，不匹配则抛出 InvalidClassException
    private static final long serialVersionUID = 1L;

    private String username;
    private transient String password;  // transient：不参与序列化

    // getters and setters...
}

// 序列化过程
User user = new User("admin", "secret");
// ObjectOutputStream 负责序列化
ByteArrayOutputStream baos = new ByteArrayOutputStream();
ObjectOutputStream oos = new ObjectOutputStream(baos);
oos.writeObject(user);    // 将 user 对象序列化为字节流
byte[] data = baos.toByteArray();

// 反序列化过程
// ObjectInputStream 负责反序列化
ByteArrayInputStream bais = new ByteArrayInputStream(data);
ObjectInputStream ois = new ObjectInputStream(bais);
User restored = (User) ois.readObject();  // 字节流还原为对象
// password 为 null（transient 不序列化）

```

**安全关注**：

```
反序列化漏洞的根本原因：
readObject() 会自动调用被反序列化对象的 readObject 方法（如果定义了的话）
攻击者可以构造恶意的序列化字节流，使 readObject 执行任意代码

与已有知识的衔接：
- 序列化数据以 0xACED 0x0005 开头（JAVA 序列化魔数）
- Base64 编码后以 rO0AB 开头
- 这是 Java 反序列化漏洞的入口特征

```

## 12.6 反射机制（安全核心）

```java
import java.lang.reflect.*;

// 反射：在运行时动态获取类的信息、创建对象、调用方法
// 这是 Java 反序列化利用链的核心机制

// 获取 Class 对象的三种方式
Class<?> c1 = String.class;               // 方式一：类字面量
Class<?> c2 = "hello".getClass();          // 方式二：对象的 getClass()
Class<?> c3 = Class.forName("java.lang.String"); // 方式三：全限定类名（常用于动态加载）

// 反射创建对象
Class<?> clazz = Class.forName("com.example.User");
Object obj = clazz.getDeclaredConstructor().newInstance();

// 反射获取和调用方法
Method method = clazz.getDeclaredMethod("setName", String.class);
method.setAccessible(true);   // 绕过访问控制（即使是 private 方法也能调用）
method.invoke(obj, "admin");  // 调用方法

// 反射获取和修改字段
Field field = clazz.getDeclaredField("password");
field.setAccessible(true);     // 绕过 private
field.set(obj, "hacked");      // 修改 private 字段的值
Object value = field.get(obj); // 读取 private 字段的值

// 反射获取类信息
Method[] methods = clazz.getDeclaredMethods();  // 所有方法
Field[] fields = clazz.getDeclaredFields();      // 所有字段
Constructor[] ctors = clazz.getDeclaredConstructors(); // 所有构造方法

// 安全关注：
// setAccessible(true) 可以绕过 Java 的访问控制
// 反序列化利用链中大量使用反射调用 private 方法和修改 private 字段
// Runtime.exec() 通过反射调用是 Java RCE 的常见方式
Class<?> runtime = Class.forName("java.lang.Runtime");
Method getRuntime = runtime.getMethod("getRuntime");
Object rt = getRuntime.invoke(null);
Method exec = runtime.getMethod("exec", String.class);
exec.invoke(rt, "calc.exe");  // 通过反射执行命令

```

------

# 附录：与 Java 安全的衔接速查

| Java 基础知识               | 对应的安全场景                         |
| --------------------------- | -------------------------------------- |
| 序列化 / Serializable       | Java 反序列化漏洞（CC链、CB链等）      |
| transient 关键字            | 分析哪些字段不参与序列化               |
| 反射（Reflection）          | 反序列化利用链的核心手段、绕过访问控制 |
| 类加载器（ClassLoader）     | 类注入、动态加载恶意类                 |
| 静态代码块 `static {}`      | 类加载时自动执行，是利用链的触发点     |
| 接口 Serializable           | 判断一个类是否可以被序列化             |
| 接口 InvocationHandler      | 动态代理，CC1 等利用链的核心           |
| 异常 ClassNotFoundException | 反序列化时目标类不存在的错误           |
| 访问修饰符 private          | 通过反射 setAccessible(true) 绕过      |
| 继承 / 多态                 | 理解利用链中各类之间的继承关系         |
| 集合框架（HashMap/HashSet） | 触发 hashCode/equals 的利用链节点      |
| Runtime.exec()              | Java RCE 的常见最终执行点              |
| JNDI（后续章节）            | Log4Shell 等 JNDI 注入漏洞             |

# 附录：JAVA考试记录

```
Math.sqrt(a * a )

```

平方差

```
Math.PI

```

代替Π（圆的pai）

```java
    public static int fact(int num){
        int res = 1;
        for(int i=1; i<=num; i++){
            res *= i;
        }
        return res;
    }

```

计算阶乘的工具方法

```
Math.tan

```

求tan

```
(""%.nf",a)

```

a保留n位小数

```
Math.pow(2,3)

```

求2的三次方

```
s.substring(0,1).toUpperCase()

```

将字符串s的首字母大写

```
s.substring(0,1).toUpperCase().charAt(0);

```

将字符串s的首字母大写，并将第一个字符取出来（类型从String变成char）

```
char[] arr = value.toCharArray();
String result = "";

for(int i = 0; i < arr.length; i++){
    result += "\\u" + Integer.toHexString(arr[i]);
}

value = result;

```

把原来的字符串，变成每个字符对应的 Unicode 码字符串


