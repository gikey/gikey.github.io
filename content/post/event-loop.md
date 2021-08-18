---
title: "JavaScript 任务和事件循环"
date: 2018-03-08T17:33:31+08:00
draft: false
tags: ["Event"]
---

js是单线程的，处理任务是一件接着一件处理，所以如果一个任务需要处理很久的话，后面的任务就会被阻塞，所以 JS 通过 Event Loop 事件循环的方式解决了这个问题。
## First
首先来看下面一段代码：

```javascript
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

Promise.resolve().then(function() {
  console.log('promise1');
}).then(function() {
  console.log('promise2');
});
```
这段代码打印的结果是：`'script start'`, `'promise1'`, `'promise2'`, `'setTimeout'`

## 执行栈
js引擎开始运行代码的时候，会将代码压入执行栈进行执行：

```javascript
function a() {
    console.log('a');
}
function b() {
    a();
}
function c() {
    b();
}
c();
```
当代码被解析后，函数会依次被压入到栈中
![](https://cdn.xieluping.cn/images/ntfq72ljf1l.png)

当函数c执行完，开始出栈
![](https://cdn.xieluping.cn/images/98jgwu48as4.png)

## 事件循环
当执行栈中出现异步代码会怎么样?

```javascript
console.log("sync");

$.on('button', 'click', function onClick() {
    setTimeout(function timer() {
        console.log('You clicked the button!');    
    }, 2000);
});

setTimeout(function timeout() {
    console.log("Click the button!");
}, 5000);

```
当浏览器在执行栈执行的时候，发现有异步任务之后，会交给 webapi 去维护，而执行栈则继续执行后面的任务
![](https://cdn.xieluping.cn/images/s8c5yx7ia5r.png)

同样，setTimeout 同样会被添加到 webapi 中
![](https://cdn.xieluping.cn/images/ugloyynx3m.png)

当上面的setTimeout执行结束后并不是直接进入执行栈，而是进入任务队列，等待执行栈为空，setTimeout的可执行函数，被从回调队列中取出，放入了执行栈执行。这个过程就叫做`事件循环`。

> 推荐个JS执行的可视化工具 [loupe](http://latentflip.com/loupe/)


## 任务队列
回头再介绍下任务队列，上面的例子中 webapi 处理完 setTimeout 后，就会直接将回调函数放入任务队列中，等待执行。这个过程必须等待执行栈为空已经前面的任务执行完。例如：

```javascript
console.log(1)  // snippet1
setTimeout(function() {  // snippet2
    console.log(2);
}, 100)
setTimeout(function() { // snippet3
    console.log(3);
    setTimeout(function() { // snippet4
        console.log(4)
    }, 0)
}, 0)
console.log(5) // snippet5
// let start = +new Date;
// while(start + 2000 > +new Date){}
```
这段代码的输出顺序是`1`, `5`, `3`, `4`, `2`。
这段代码的执行过程是：
1. snippet1 push 到执行栈，执行完并清空执行栈
2. snippet2 交给 Web Apis，100ms 后将回调 push 到任务队列
3. snippet3 交给 Web Apis，0ms 后将回调 push 到任务队列
4. snippet5 的回调 push 到执行栈，执行完并清空执行栈
5. snippet3 的回调 push 到执行栈，执行完并清空执行栈，同时将 snippet4 交给 Web Apis，0ms 后将回调 push 到任务队列
6. snippet4 的回调 push 到执行栈，执行完并清空执行栈
7. 如果 snippet2 已经在任务队列中，将 snippet2 的回调 push 到执行栈，执行完并清空执行栈

### 任务
以上说的其实都是所谓的“宏任务”，主要包括整体代码 `script`，`setTimeout`，`setInterval`。

### 微任务
如果将之前的代码改下：

```javascript
console.log(1)  // snippet1
Promise.resolve().then(function() {  // snippet2
    console.log(2);
})
setTimeout(function() { // snippet3
    console.log(3);
    setTimeout(function() { // snippet4
        console.log(4)
    }, 0)
}, 0)
console.log(5) // snippet5
```
这段代码的输出顺序是`1`, `5`, `2`, `3`, `4`。
这是因为 promise 的 then 方法，被认为是在微任务队列当中。
microtask 通常来说就是需要在当前 task 执行结束后立即执行的任务，例如需要对一系列的任务做出回应，或者是需要异步的执行任务而又不需要分配一个新的 task，这样便可以减小一点性能的开销。microtask 任务队列是一个与 task 任务队列相互独立的队列，microtask 任务将会在每一个 task 任务执行结束之后执行。每一个 task 中产生的 microtask 都将会添加到 microtask 队列中，microtask 中产生的 microtask 将会添加至当前队列的尾部，并且 microtask 会按序的处理完队列中的所有任务。microtask 类型的任务目前包括了 MutationObserver 以及 Promise 的回调函数和 node 中的 process.nextTick。

这段代码的执行过程是：
1. snippet1 push 到执行栈，执行完并清空执行栈
2. snippet2 的回调 push 到 microtask 队列中
3. snippet3 交给 Web Apis，0ms 后将回调 push 到 marcotask 队列
4. snippet5 的回调 push 到执行栈，执行完并清空执行栈
5. script task 执行完后，将 snippet2 中的回调从 microtask 队列取出，push 到执行栈，执行完并清空执行栈
6. snippet3 的回调 push 到执行栈，执行完并清空执行栈，同时将 snippet4 交给 Web Apis，0ms 后将回调 push 到任务队列
7. snippet4 的回调 push 到执行栈，执行完并清空执行栈


## One more question
如果有下面一段代码：

```html
<div class="outer">
  <div class="inner"></div>
</div>
```
```javascript
var outer = document.querySelector('.outer');
var inner = document.querySelector('.inner');

new MutationObserver(function() {
  console.log('mutate');
}).observe(outer, {
  attributes: true
});

function onClick() {
  console.log('click');

  setTimeout(function() {
    console.log('timeout');
  }, 0);

  Promise.resolve().then(function() {
    console.log('promise');
  });

  outer.setAttribute('data-random', Math.random());
}

inner.addEventListener('click', onClick);
outer.addEventListener('click', onClick);

// inner.click();
```

在这里不同的浏览器可能会有不同的结果。

| Chrome  | FireFox  |   Safari   | Edge |
| :------ | :------ | :------  | :------  |
| click   | click |  click  |  click  |
| promise | mutate | mutate	| click  |
| mutate  | click |	click | mutate |
| click   | mutate | mutate	| timeout |
| promise | timeout | promise | promise | 
| mutate  | promise	| promise |	timeout |
| timeout | promise | timeout | promise |
| timeout | timeout |  timeout  | |

按照上面的推导 Chrome 的输出是正确的。

> 通过上面的例子可以测试出，FireFox 和 Safari 能够正确的执行 microtask 队列，这一点可以通过 MutationObserver 的表现中看出，不过 Promise 被添加至事件队列中的方式好像有些不同。 这一点也是能够理解的，由于 jobs 和 microtasks 的关系以及概念目前还比较模糊，不过人们都普遍的期望他们都能够在两个事件监听器之间执行。这里有 FireFox 和 Safari 的 BUG 记录。（目前 Safari 已经修复了这一 BUG）
> 在 Edge 中我们可以明显的看出其压入 Promise 的方式是错误的，同时其执行 microtask 队列的方式也不正确，它没有在两个事件监听器之间执行，反而是在所有的事件监听器之后执行，所以才会只输出了一次 mutate 。Edge bug ticket （目前已修复）

加入我们现在取消上段代码中最后一行的注释，使用模拟点击输出的是什么呢？

| Chrome  | FireFox  |   Safari   | Edge |
| :------ | :------ | :------  | :------  |
| click | click | click | click |
| click | click | click | click |
| promise | mutate | mutate | mutate |
| mutate | timeout | promise | timeout |
| promise | promise| promise | promise |
| timeout |	promise| timeout | timeout |
| timeout |	timeout	| timeout |promise |


<!--在前一个 demo 中，microtask 将会在两个 click 时间监听器之间运行，但是在这个 demo 中，由于我们调用 .click() ，使得事件监听器的回调函数和当前运行的脚本同步执行而不是异步，所以当前脚本的执行栈会一直压在 JS 执行栈 当中。所以在这个 demo 中 microtask 不会在每一个 click 事件之后执行，而是在两个 click 事件执行完成之后执行。所以在这里我们可以再次的对 microtask 的检查点进行定义：当执行栈(JS Stack)为空时，执行一次 microtask 检查点。这也确保了无论是一个 task 还是一个 microtask 在执行完毕之后都会生成一个 microtask 检查点，也保证了 microtask 队列能够一次性执行完毕。 -->
在确定上面答案前先看一个小例子：

```html
<button id="btn">click me</button>
```
```javascript
let btn = document.getElementById('btn');

console.log(1);
btn.onclick = function() {
    console.log(2)
}
console.log(3);
```

很明显输出顺序是：`1`, `3`, `2`。
但是如果是直接调用 click 方法：

```javascript
let btn = document.getElementById('btn');

console.log(1);
btn.onclick = function() {
    console.log(2)
}
btn.click();
console.log(3);
```

输出的结果是：`1`, `2`, `3`。
原因是我们调用 .click()，使得事件监听器的回调函数和当前运行的脚本同步执行而不再是异步。

同理在之前的例子中由于我们调用 click()，使得事件监听器的回调函数和当前运行的脚本同步执行，所以当前脚本的执行栈会一直压在 JS 执行栈当中（简单来说就是click的回调并没有加入任务队列中，而是直接执行了）。所以在这个 demo 中 microtask 不会在每一个 click 事件之后执行，而是在两个 click 事件执行完成之后执行。所以在这里我们可以再次的对 microtask 的检查点进行定义：当执行栈(JS Stack)为空时，执行一次 microtask 检查点。这也确保了无论是一个 task 还是一个 microtask 在执行完毕之后都会生成一个 microtask 检查点，也保证了 microtask 队列能够一次性执行完毕。









