---
title: "TypeScript 中 is 类型保护"
date: 2021-09-12T16:17:05+08:00
draft: false
tags: ["TypeScript"]
keywords: ["is", "类型保护"]
---

## 前言
在阅读 [utility-types](https://github.com/piotrwitek/utility-types) 源码中发现了一段代码：
```ts
// export type Falsy = false | '' | 0 | null | undefined;
export const isFalsy = (val: unknown): val is Falsy => !val;
```
这里的返回类型不应该是 `boolean` 吗？ 为什么要使用 `val is Falsy`？

## type guard 
看到网上有这样一个例子：
```ts
function isString(test: any): boolean {
    return typeof test === "string";
}
function example(foo: any){
    if(isString(foo)){
        console.log("it is a string" + foo);
        console.log(foo.length); // string function
    }
}
example("hello world");
```
在这种情况下，返回类型定义为 `boolean` 和 `test is string` 其实没有区别。但是如果这个时候不小心在 `if` 中调用了一个不存在的方法会怎么样呢？例如：
```ts
function isString(test: any): boolean {
    return typeof test === "string";
}
function example(foo: any){
    if(isString(foo)){
        foo.toExponential(2)
    }
}
example("hello world");
```

很明显在编译的时候不会有任何错误提示，因为 `foo` 的类型为 `any`，但是在代码运行阶段可能会导致程序崩溃。
![](/images/typescript-is/ig4o3hj3jgo.png)

如果想要提前发现的话就需要用到 `is` 类型保护了，将上面的代码改成：
```ts
function isString(test: any): test is string {
    return typeof test === "string";
}
function example(foo: any){
    if (isString(foo)){
        foo.toExponential(2)
    }
    foo.toExponential(2)
}
example("hello world");
```
在编辑器或编译过程中中就会提示类型错误，从而避免了隐藏的 bug。
![](/images/typescript-is/e8j69bhr5s.png)

在 `isString()` 被调用后，如果函数返回 `true`，TypeScript 会在被保护的代码块中将类型由 `any` 缩小到 `string`，同时我们我们也可以发现没被保护的代码块依然可以正常编译。


## 参考文档：
[What does the is keyword do in typescript?](https://stackoverflow.com/questions/40081332/what-does-the-is-keyword-do-in-typescript)

[Using type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
