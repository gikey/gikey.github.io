---
title: "AngularJS Directive 隔离 Scope 数据交互"
date: 2017-03-08T11:39:09+08:00
draft: false
---

## 什么是隔离 Scope
AngularJS 的 directive 默认能共享父 scope 中定义的属性，例如在模版中直接使用父 scope 中的对象和属性。通常使用这种直接共享的方式可以实现一些简单的 directive 功能。当你需要创建一个可重复使用的 directive，只是偶尔需要访问或者修改父 scope 的数据，就需要使用隔离 scope。当使用隔离 scope 的时候，directive 会创建一个没有依赖父 scope 的 scope，并提供一些访问父 scope 的方式。

## 为什么使用隔离 Scope
当你想要写一个可重复使用的 directive，不能再依赖父 scope，这时候就需要使用隔离 scope 代替。共享 scope 可以直接共享父 scope，而隔离 scope 无法共享父scope。下图解释共享 scope 和隔离 scope 的区别：

![](https://cdn.xieluping.cn/images/6502f268-800e-4874-8443-d7bebf1b12f0.png)

### 共享 scope

使用共享 scope 的时候，可以直接从父 scope 中共享属性。因此下面示例可以将那么属性的值输出出来。使用的是父 scope 中定义的值。

js代码：

```js
app.controller("myController", function ($scope) {
    $scope.name = "hello world";
}).directive("shareDirective", function () {
    return {
        template: 'Say:{{name}}'
    }
});
```
html代码:

```html
<div ng-controller="myController">
<div share-directive=""></div>
</div>
```
输出结果：

```
Say:hello world
```

### 隔离 scope

使用隔离 scope 的时候，无法从父 scope 中共享属性。因此下面示例无法输出父 scope 中定义的 name 属性值。

js代码：

```js
app.controller("myController", function ($scope) {
    $scope.name = "hello world";
}).directive("isolatedDirective", function () {
    return {
        scope: {},
        template: 'Say:{{name}}'
    }
});
```
html代码：

```html
<div ng-controller="myController">
<div isolated-directive=""></div>
</div>
```
输出结果：

```
Say:
```

从上图可以看出共享 scope 允许从父 scope 渗入到 directive 中，而隔离 scope 不能，在隔离 scope 下，给 directive 创造了一堵墙，使得父 scope 无法渗入到 directive 中。

具体文档可以参考：https://docs.angularjs.org/guide/directive#isolating-the-scope-of-a-directive

## 如何在 directive 中创建隔离 scope
在 Directive 中创建隔离 scope 很简单，只需要定义一个 scope 属性即可，这样，这个 directive 的 scope 将会创建一个新的 scope，如果多个 directive 定义在同一个元素上，只会创建一个新的 scope。

```js
angular.module('app').controller("myController", function ($scope) {
    $scope.user = {
        id:1,
        name:"hello world"
    };
}).directive('isolatedScope', function () {
    return {
        scope: {},
        template: 'Name: {{user.name}} Street: {{user.addr}}'
    };
});
```
现在 scope 是隔离的，user 对象将无法从父 scope 中访问，因此，在 directive 渲染的时候 user 对象的占位将不会输出内容。

## 隔离 scope 和父 scope 如何交互
directive 在使用隔离 scope 的时候，提供了三种方法同隔离之外的地方交互。这三种分别是:

* `@` 绑定一个局部 scope 属性到当前 dom 节点的属性值。结果总是一个字符串，因为 dom 属性是字符串。
* `&` 提供一种方式执行一个表达式在父 scope 的上下文中。如果没有指定 attr 名称，则属性名称为相同的本地名称。
* `=` 通过 directive 的 attr 属性的值在局部 scope 的属性和父 scope 属性名之间建立双向绑定。

### @ 局部 scope 属性

`@` 方式局部属性用来访问 directive 外部环境定义的字符串值，主要是通过 directive 所在的标签属性绑定外部字符串值。这种绑定是单向的，即父 scope 的绑定变化，directive 中的 scope 的属性会同步变化，而隔离 scope 中的绑定变化，父 scope 是不知道的。

如下示例：directive 声明未隔离 scope 类型，并且使用`@`绑定 name 属性，在 directive 中使用 name 属性绑定父 scope 中的属性。当改变父 scope 中属性的值的时候，directive 会同步更新值，当改变 directive 的 scope 的属性值时，父 scope 无法同步更新值。

js 代码：

```js
app.controller("myController", function ($scope) {
     $scope.name = "hello world";
}).directive("isolatedDirective", function () {
    return {
        scope: {
            name: "@"
        },
        template: 'Say：{{name}} <br>改变隔离scope的name：<input type="buttom" value="" ng-model="name" class="ng-pristine ng-valid">'
    }
})
```
html 代码：

```html
<div ng-controller="myController">
   <div class="result">
       <div>父scope：
           <div>Say：{{name}}<br>改变父scope的name：<input type="text" value="" ng-model="name"/></div>
       </div>
       <div>隔离scope：
           <div isolated-directive name="{{name}}"></div>
       </div>
        <div>隔离scope（不使用{{name}}）：
             <div isolated-directive name="name"></div>
         </div>
   </div>
```

### = 局部 scope 属性

`=` 通过 directive 的 attr 属性的值在局部 scope 的属性和父 scope 属性名之间建立双向绑定。
意思是，当你想要一个双向绑定的属性的时候，你可以使用`=`来引入外部属性。无论是改变父 scope 还是隔离 scope 里的属性，父 scope 和隔离 scope 都会同时更新属性值，因为它们是双向绑定的关系。

js 代码：

```js
 app.controller("myController", function ($scope) {
     $scope.user = {
         name: 'hello',
         id: 1
     };
 }).directive("isolatedDirective", function () {
     return {
         scope: {
             user: "="
         },
         template: 'Say：{{user.name}} <br>改变隔离scope的name：<input type="buttom" value="" ng-model="user.name"/>'
      }
 })
```
html 代码：

```html
<div ng-controller="myController">
    <div>父scope：
        <div>Say：{{user.name}}<br>改变父scope的name：<input type="text" value="" ng-model="user.name"/></div>
    </div>
    <div>隔离scope：
        <div isolated-directive user="user"></div>
    </div>
    <div>隔离scope（使用{{name}}）：
        <div isolated-directive user="{{user}}"></div>
    </div>
</div>
```

### & 局部 scope 属性

`&` 方式提供一种途经是 directive 能在父 scope 的上下文中执行一个表达式。此表达式可以是一个 function。
比如当你写了一个 directive，当用户点击按钮时，directive 想要通知 controller，controller 无法知道 directive 中发生了什么，也许你可以通过使用 angular 中的 event 广播来做到，但是必须要在 controller 中增加一个事件监听方法。
最好的方法就是让 directive 可以通过一个父 scope 中的 function，当 directive 中有什么动作需要更新到父 scope 中的时候，可以在父 scope 上下文中执行一段代码或者一个函数。

如下示例在 directive 中执行父 scope 的 function。

js代码：

```js
app.controller("myController", function ($scope) {
    $scope.value = "hello world";
    $scope.click = function () {
        $scope.value = Math.random();
    };
}).directive("isolatedDirective", function () {
    return {
        scope: {
            action: "&"
        },
        template: '<input type="button" value="在directive中执行父scope定义的方法" ng-click="action()"/>'
     }
})
```
html 代码：

```html
 <div  ng-controller="myController">
        <div>父scope：
            <div>Say：{{value}}</div>
        </div>
        <div>隔离scope：
            <div isolated-directive action="click()"></div>
        </div>
</div>
```
以上内容转自：https://blog.coding.net/blog/angularjs-directive-isolate-scope

## 小结
相信关于隔离 scope 和父 scope 如何交互的三种方法已经介绍得非常清楚了，最后发现stackoverflow上面有个更加简单直接的解释，原文如下：

All three bindings are ways of passing data from your parent scope to your directive's isolated scope through the element's attributes:

> 1. `@` binding is for passing strings. These strings support `{{}}` expressions for interpolated values. For example: . The interpolated expression is evaluated against directive's parent scope.

> 2. `=` binding is for two-way model binding. The model in parent scope is linked to the model in the directive's isolated scope. Changes to one model affects the other, and vice versa.

> 3. `&` binding is for passing a method into your directive's scope so that it can be called within your directive. The method is pre-bound to the directive's parent scope, and supports arguments. For example if the method is hello(name) in parent scope, then in order to execute the method from inside your directive, you must call $scope.hello({name:'world'})

I find that it's easier to remember these differences by referring to the scope bindings by a shorter description:

* `@` Attribute string binding
* `=` Two-way model binding
* `&` Callback method binding

The symbols also make it clearer as to what the scope variable represents inside of your directive's implementation:

* `@` string
* `=` model
* `&` method

In order of usefulness (for me anyways):

* `=`
* `@`
* `&`

更多请参考API文档：https://docs.angularjs.org/api/ng/service/$compile 。
