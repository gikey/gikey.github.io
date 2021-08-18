---
title: "React Server Components 介绍"
date: 2021-08-16T10:08:13+08:00
draft: false
---


2020年12月21日 React 官方公布了一个新的[提案](https://github.com/reactjs/rfcs/pull/188) React Server Component（后面简称：RSC），并做了[视频介绍](https://www.youtube.com/watch?v=TQQPAU21ZUw&feature=emb_title)和 [demo](https://github.com/reactjs/server-components-demo) (如果跑不起来建议尝试docker)演示。React Server Component 还在研发中，目前还是个试验性的功能，主要目的是为了从社区收到一些反馈。离正式发布还需要较长时间，暂时不用立即跟进学习。接下来主要做个简单的介绍。

## Web  渲染的演化
### 一、Web1.0 服务端渲染
为了区分目前常说的“服务端渲染”，暂且把没有 Ajax 时代的服务端渲染称为“Web1.0 服务端渲染”。Web1.0 的时候前后端不分离，后端提供数据和模板渲染相应 HTML 页面，前端主要提供页面样式和js实现交互动效果。
#### 渲染流程：
1. 客户端发起页面请求
2. 服务端查询数据并使用相应的模板引擎渲染成 HTML 片段
3. 客户端收到返回 HTML 解析成可见网页内容
![](https://cdn.xieluping.cn/images/hvcg3mktsag.png)

#### 优点：
- 友好的 SEO，每个页面都是服务端返回的完整的 HTML
- 首屏加载快，页面由后端渲染完成
#### 缺点：
- 前后端耦合严重，前后端开发相互依赖
- 交互体验不佳，每个路由都需要页面刷新
- 服务端负载压力大，渲染任务都由服务端也丧失了客户端作为天然分布式系统的优势

### 二、客户端渲染（[CSR](https://developers.google.com/web/updates/2019/02/rendering-on-the-web)）
随着前端页面复杂程度加剧和 Web2.0 Ajax 技术的发展，就有了前后端分离概念。以 Anglular 为代表的现代前端框架让这种后端提供接口，前端渲染页面的开发方式得到普及。也让服务端和客户端职责得到了明确的分工，让客户端和服务端各自实现更擅长的事情。
渲染流程：
1. 客户端发起请求并接收返回的 HTML 内容
2. 客户端解析网页内容并执行 JS 脚本
3. JS 利用 Ajax请求后端数据（json/xml）
4. JS 动态将数据渲染在页面中
![](https://cdn.xieluping.cn/images/v9c9dmh228.png)

#### 优点：
- 前后端分离模式，前端专注于UI，后端专注于逻辑
- 良好的交互体验，局部进行刷新，可以实现单页应用，预加载等提升页面性能
- 降低服务器压力，部署比较简单节约服务器成本
#### 缺点：
- 不利于 SEO，页面数据都是动态生成不利于 SEO 优化
- 首屏白屏，首次请求几乎空白的 HMTL 页面，TTI受限于`数据获取`和`浏览器渲染`的耗时
### 三、服务端渲染（SSR）
随着单页应用的发展，不友好的 SEO 和首屏渲染白屏等问题亟待解决，于是再次考虑引入服务端渲染。主要逻辑是将 Web1.0 服务端渲染和 CSR 做了一个结合，以单页应用为例：前端服务器获取首屏数据通过服务端渲染成相应HTML返回客户端，之后的数据交互逻辑与客户端渲染一样。
渲染流程：
1. 客户端向前端服务器发送页面请求
2. 前端服务器向后端服务器请求相应数据并渲染完整 HTML 返回给客户端
3. 客户端渲染 HTML 页面并执行 JS 脚本，给页面绑定事件，让页面变得可交互
4. 当再次需要数据交互就于CSR一致利用 Ajax 请求服务端 API，拿到返回数据进行动态渲染
![](https://cdn.xieluping.cn/images/52qreo5vkco.png)

#### 优点：
- 友好的 SEO，首屏不再是空白页面
- 良好的交互体验，既解决了首屏白屏的问题，也兼顾了 CSR 的优势
#### 缺点：
- 维护困难，抛弃了部分 SPA 技术带来的技术优势
- 首屏无法分段渲染

> RSC 并不是为了解决 SSR 渲染的问题而出现的， SSR 和 RSC 可以一起使用。
## RSC 到底是啥？
以官方的介绍为例，有如下这样一个音乐详情页面：
![](https://cdn.xieluping.cn/images/03qsuaeu0s.png)
我们的代码基本结构可能是这样：
```js
function ArtistPage({ artistId }) {
  return (
    <ArtistDetails artistId={artistId}>
      <TopTracks artistId={artistId} />
      <Discography artistId={artistId} />
    </ArtistDetails>
  );
}
```

为了保证良好的用户体验，我们会在一个接口中获取所有相关数据，避免随机顺序渲染：
```js
function ArtistPage({ artistId }) {
    const stuff = fetchAllTheStuffJustInCase();
    return (
      <ArtistDetails
        artistId={artistId}
        details={stuff.details}
      >
        <TopTracks 
          artistId={artistId}
          topTracks={stuff.topTracks}
        />
        <Discography
          artistId={artistId}
          discography={stuff.discography}
        />
      </ArtistDetails>
    );
  }
```

这样每个组件从逻辑上就不那么解耦了，会让组件的可维护性变得非常差。如果后续不再需要 TopTracks 数据了，接口就返回了冗余的数据，或者某个组件增加了一个 `props` 属性，如果这个组件在其他地方也被用到，这样需要在其他所有地方都要增加这个 `props` 属性。
其实这个问题可用通过 [GraphQL](https://graphql.org/) + [Relay](https://github.com/facebook/relay) 的方案解决
于是我们考虑到可以让每个组件单独来实现各自数据获取逻辑：
```js
function ArtistDetails({ artistId, children }) {
  const detail = fetchDetails(artistId);
  // ...
}

function TopTracks({ artistId }) {
  const topTracks = fetchTopTracks(artistId);
  // ...
}

function Discography({ artistId }) {
  const discography = fetchDiscography(artistId);
  // ...
}
```

这样在父组件 ArtistDetails 中的实现可能是这样：
```js
function ArtistDetails({ artistId, children }) {
    const [details, setDetails] = useState(null);

    useEffect(() => {
        const detail = fetchArtistDetails(artistId);
        setArtistInfo(detail);
    }, [artistId])

    if (!details) {
        return 'loading';
    }
    return (
        <div>
            ...
            {children}
        </div>
    );
}
```

也就是子组件中获取数据的逻辑必须要等到父组件渲染完毕，这种像瀑布一样一节一节往下流的模式就造成典型的`网络瀑布`，如果组件的数据源越多组件层级越深，问题越明显。
同时这样也会让体验变差，因为这个组件就需要发送3个 HTTP 请求，浏览器从服务端 fetch 数据是比较贵的 IO，抽象一下就是下面这样：
![](https://cdn.xieluping.cn/images/ah3hpqkpv3g.png)

当然我们也可以让三个组件完全不嵌套平级展示，这样虽然避免了`网络瀑布`，但是组件的渲染顺序也变得不可控了，交互体验会再次打折扣
我们平时的组件数据交互基本都是这种模式。大胆设想下：如果把`容器组件`放在服务端，服务端的组件直接与数据交互生成完整组件内容然后返回给客户端，这样既可以解决频繁请求带来的 IO 消耗也解决了 CSR 中的网络瀑布。
![](https://cdn.xieluping.cn/images/g63rosd58po.png)
到此，我们知道了 React Server Component 就是 在服务端运行的 React 组件。
## RSC 如何运行?
### 组件类型：
介绍 RSC 运行流程前需要先了解几个新的概念：
- #### Server Component
服务器组件是在服务端运行的组件，它们可以直接访问服务器端数据源，比如服务器上的数据库或文件系统，因而获取数据取过程更快、更高效。服务器组件是无状态的，服务器组件可以导入客户端组件，客户端组件不能导入服务服务器组件，必须以 .server.js、.server.jsx 的格式命名。
- #### Client Component
客户端组件是只能在客户端上呈现的组件（这就是我们目前使用的 react 组件）。客户端组件不能使用服务器组件。它们通常由服务器组件导入，用于显示应用程序的交互部分。它们不能访问服务器端数据源，它们是有状态的，可以访问浏览器 API，必须以 .client.js、.client.jsx 的格式命名。
- #### Shared Component
共享组件是可以在服务端或客户端上呈现的组件，这具体取决于使用它们的组件类型。一般是Server Component 和 Client Component 共有的一些功能组成的组件，同样Shared Component也不能有状态。

如果上面的 demo 抽象成在完全在客户端渲染的组件树可能是：
![](https://cdn.xieluping.cn/images/ovqtiv8l55.png)
其实平时我们可以把组件划分为：依赖数据的`容器组件`和依赖行为的`交互组件`，`容器组件`其实可以运行在服务端`交互组件`可以运行在客户端。`容器组件`我们就可以用 Server Component 实现，而依赖行为的`交互组件`用 Client Component 实现：
![](https://cdn.xieluping.cn/images/4q1gquqlna.png)
### 运行流程
1. webpack 利用 react-server-dom-webpack/plugin 编译所有的 .client.js 文件，并生成 react-client-manifest.json 文件
```json
{
  "file:///workspace/server-components-demo/src/Root.client.js": {
    "": {
      "id": "./src/Root.client.js",
      "chunks": [
        "main"
      ],
      "name": ""
    },
    "*": {
      "id": "./src/Root.client.js",
      "chunks": [
        "main"
      ],
      "name": "*"
    },
    "default": {
      "id": "./src/Root.client.js",
      "chunks": [
        "main"
      ],
      "name": "default"
    }
    // ...
  }
```
2. Server 端启动服务，利用 [react-server-dom-webpack/writer](https://github.com/facebook/react/blob/main/packages/react-server-dom-webpack/src/ReactFlightDOMServerNode.js) 的 pipeToNodeWritable 将 Server Component 和数据以及 react-client-manifest.json 转为 chunk 数据流返回客户端
```js
const { pipeToNodeWritable } = require('react-server-dom-webpack/writer');

async function renderReactTree(res, props) {
  await waitForWebpack();
  const manifest = readFileSync(
    path.resolve(__dirname, '../build/react-client-manifest.json'),
    'utf8'
  );
  const moduleMap = JSON.parse(manifest);
  pipeToNodeWritable(React.createElement(ReactApp, props), res, moduleMap);
}
```
```bash
M1:{"id":"./src/SearchField.client.js","chunks":["client5"],"name":""}
M2:{"id":"./src/EditButton.client.js","chunks":["client1"],"name":""}
S3:"react.suspense"
J0:["$","div",null,{"className":"main","children":[["$","section",null,{"className":"col sidebar","children":[["$","section",null,{"className":"sidebar-header","children":[["$","img",null,{"className":"logo","src":"logo.svg","width":"22px","height":"20px","alt":"","role":"presentation"}],["$","strong",null,{"children":"React Notes"}]]}],["$","section",null,{"className":"sidebar-menu","role":"menubar","children":[["$","@1",null,{}],["$","@2",null,{"noteId":null,"children":"New2"}]]}],["$","nav",null,{"children":["$","$3",null,{"fallback":["$","div",null,{"children":["$","ul",null,{"className":"notes-list skeleton-container","children":[["$","li",null,{"className":"v-stack","children":["$","div",null,{"className":"sidebar-note-list-item skeleton","style":{"height":"5em"}}]}],["$","li",null,{"className":"v-stack","children":["$","div",null,{"className":"sidebar-note-list-item skeleton","style":{"height":"5em"}}]}],["$","li",null,{"className":"v-stack","children":["$","div",null,{"className":"sidebar-note-list-item skeleton","style":{"height":"5em"}}]}]]}]}],"children":"@4"}]}]]}],["$","section","null",{"className":"col note-viewer","children":["$","$3",null,{"fallback":["$","div",null,{"className":"note skeleton-container","role":"progressbar","aria-busy":"true","children":[["$","div",null,{"className":"note-header","children":[["$","div",null,{"className":"note-title skeleton","style":{"height":"3rem","width":"65%","marginInline":"12px 1em"}}],["$","div",null,{"className":"skeleton skeleton--button","style":{"width":"8em","height":"2.5em"}}]]}],["$","div",null,{"className":"note-preview","children":[["$","div",null,{"className":"skeleton v-stack","style":{"height":"1.5em"}}],["$","div",null,{"className":"skeleton v-stack","style":{"height":"1.5em"}}],["$","div",null,{"className":"skeleton v-stack","style":{"height":"1.5em"}}],["$","div",null,{"className":"skeleton v-stack","style":{"height":"1.5em"}}],["$","div",null,{"className":"skeleton v-stack","style":{"height":"1.5em"}}]]}]]}],"children":["$","div",null,{"className":"note--empty-state","children":["$","span",null,{"className":"note-text--empty-state","children":"Click a note on the left to view something! ð¥º"}]}]}]}]]}]
M5:{"id":"./src/SidebarNote.client.js","chunks":["client6"],"name":""}
J4:["$","ul",null,{"className":"notes-list","children":[["$","li","3",{"children":["$","@5",null,{"id":3,"title":"test","expandedChildren":["$","p",null,{"className":"sidebar-note-excerpt","children":"test demo"}],"children":["$","header",null,{"className":"sidebar-note-header","children":[["$","strong",null,{"children":"test"}],["$","small",null,{"children":"12:32 noon"}]]}]}]}]]}]
```
3. 客户端利用 react-server-dom-webpack 中 createFromFetch readRoot将获取的数据流反序列化为 React节点。
> Server Component 中嵌套的 Client Component 则直接加载客户端.client.js 打包出来的 js 文件
```js
import { createFromFetch } from "react-server-dom-webpack";

function useServerResponse(id) {
  return createFromFetch(fetch(`/react?id=${id}`));
}

function Content() {
  const [response, setResponse] = useState();
  
  useEffect(() => {
    setResponse(useServerResponse());
  }, []);

  return response ? (
    <div>{response.readRoot()}</div>
  ) : null;
}
```
整体流程如下：
![](https://cdn.xieluping.cn/images/65m6ucl55so.png)
![](https://cdn.xieluping.cn/images/1e3j1g6seuo.png)

## RSC 思考
RSC的思路其实很类似 PHP/ASP 时代的 Web1.0 服务端渲染，很多人认为是一种倒退，“前端好不容易爬到了山顶，却发现 PHP 已经等待多时”。盘点下 RSC 的一些优点和#### 缺点：

#### 缺点：
1. 职责不清，RSC 的引入使得前后端分离的开发模式受到挑战，再次回到 Web1.0 的时代
2. 维护困难，Server 组件和 Client 组件相互嵌套，代码维护会变得比 CSR 更加困难
3. 增加了服务端压力，服务端需要额外将数据、jsx 转为 RSC 数据流传递给客户端

#### 优点：
1. 天然接近各种IO，访问数据库、文件系统更快、更高效
2. Zero Bundle Size，RSC 可以大大降低前端项目打包体积
3. Code Splitting，自动的代码分割
4. 替代前端微服务，RSC 颗粒度是到组件级别，复用性能大大提高

哲学中有个理论叫做：“螺旋式上升”，RSC 并没有开倒车而是在一个更高的维度回来解决了一个老问题，这正是一种先进而优雅的方式。

## 相关链接
- https://reactjs.org/blog/2020/12/21/data-fetching-with-react-server-components.html
- https://www.youtube.com/watch?v=TQQPAU21ZUw&feature=emb_title
- https://github.com/reactjs/server-components-demo
- https://github.com/reactjs/rfcs/pull/188

