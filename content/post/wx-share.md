---
title: "微信 jssdk 分享"
date: 2017-06-28T16:02:37+08:00
draft: false
---


## 服务端
### 1. 获取 access_token
access_token 是公众号的全局唯一接口调用凭据，公众号调用各接口时都需使用 access_token。通过get请求 https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET ，正常返回：
```js
{
    "access_token": "ACCESS_TOKEN",
    "expires_in": 7200
}
```
### 2. 获取 jsapi_ticket
api_ticket 是用于调用微信卡券 JS API 的临时票据，需要通过 access_token 来获取，api_ticket 和 accss_token 一样有效期都为7200s。由于获取api_ticket 的api 调用次数非常有限，频繁刷新 api_ticket 会导致 api 调用受限，影响自身业务，开发者需在自己的服务存储与更新 api_ticket。
通过 get 请求 https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=wx_card ，正常返回：
```js
{
    "errcode": 0,
    "errmsg": "ok",
    "ticket": "bxLdikRXVbTPdHSM05e5u5sUoXNKdvsdshFKA",
    "expires_in": 7200
}
```

### 3. 生成 signature
需要将 `noncestr`（随机字符串）, 有效的`jsapi_ticket`, `timestamp`（时间戳）, `url`（当前网页的URL，不包含#及其后面部分）进行sha1签名得到signature。对所有待签名参数按照字段名的 ASCII 码从小到大排序（字典序）后，使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串string1。这里需要注意的是所有参数名均为小写字符。对 string1 作 sha1 加密，字段名和字段值都采用原始值，不进行 URL 转义。

字符串 string1：
```js
jsapi_ticket=sM4AOVdWfPE4DxkXGEs8VMCPGGVi4C3VM0P37wVUCFvkVAy_90u5h9nbSlYy3-Sl-HhTdfl2fzFy1AOcHKP7qg&noncestr=Wm3WZYTPz0wzccnW&timestamp=1414587457&url=http://mp.weixin.qq.com?params=value
```
然后对 string1 进行签名后即可得到 signature, 类似：
```js
0f9de62fce790f9a083d5c99e95740ceb90c27ed
```
最后将分享需要的权限验证配置项：`appId`， `timestamp`，`nonceStr`， `signature` 返回即可。
> 推荐能用到的库 sha1、redis、request，具体使用参考 http://npmjs.com

## 客户端
### 1. 修改 JS 接口安全域名
即使客户端其他设置都完成后，域名也是备案好的，但是还是经常会发生分享不成功的情况，打开 debug 模式后，显示的信息是 `{ "errMsg": "config:invalid url domain" }`，很大程度上是因为公众号后台配置错误，注意上面说的是`域名`不是 url， 所以不需要加上协议头！！！

### 2. 引入 jssdk
在需要调用JS接口的页面引入如下JS文件，（支持https）：http://res.wx.qq.com/open/js/jweixin-1.2.0.js
如果需要动态引入的话可以参照：
```js
(function(id, d, s, cb) {
    var d = d || window.document,
        s = s || 'script',
        fjs = d.getElementsByTagName(s)[0],
        js;
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = '//res.wx.qq.com/open/js/jweixin-1.2.0.js';
    fjs.parentNode.insertBefore(js, fjs);
    cb && cb();
}('wx-jssdk'));
```

### 3. 配置分享
首先需要调用后端接口获取配置项，一定要带上当前 url (不带不包含#及其后面部分)！！！否则不能成功分享。
例如：
```js
$.ajax({
    url: '/server/getConfig/?url='+ location.href.split('#')[0],
    type: 'GET',
    ...
})
```
配置完 wx.config 后需要在 wx.ready 回调中设置分享接口，可以设置多个分享具体参考官方文档 https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141115
> 最后说下分享的图片必须是 `https` 协议的，否则不会展示
