# koa-api-cache
Supports redis cache koa router response data and  auto-clearing.   
Only suport request method is GET.
# Quick Start

## Install

```shell
$ npm install koa-api-cache
```
## Redis Client

koa-api-cache can use [ioredis](https://github.com/luin/ioredis) redis library to keep its client connections.

## Configuration
- redis: redis client.
- prefix: redis key prefix - default 'default'
- expire: redis expire time - unit:second, default '300'
- conditionFunc: set condition to cache the response content.

## Usage

If your api interface response this body.

``` js
ctx.body = {
  code: 0,
  msg: "SUCCESS",
  data: {}
}
```
Add cache to the koa router.

```js
const Redis = require("ioredis");
const redis = new Redis({host: "127.0.0.1", port: "6379", db: 10});
const ApiCache = require("koa-api-cache");
const apiCache = new ApiCache({redis, conditionFunc(body) {
  return body.code === 0
}});
const router = require("koa-router")();
router.get("/api/test",apiCache.route({
  prefix: "test",
  expire: 300,
  conditionFunc (body) {
    return body.code === 0;
  }
}), async ctx => {})
```

If you want to clear cache.

```js
await apiCache.delCache("test");
```
## API Docs
### `ApiCache.prototype.route({prefix, expire, conditionFunc}) => Promise`
- `prefix` string, redis cache prefix
- `expire` number, redis ttl
- `conditionFunc` function, set condition to cache the response content

### `ApiCache.prototype.delCache(prefix) => Promise`
- `prefix` string, redis cache prefix