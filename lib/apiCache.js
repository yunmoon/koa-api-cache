const createHash = require("crypto").createHash
const _ = require("lodash");
function _md5(string) {
  return createHash('md5').update(string).digest('hex');
}
class ApiCache {
  constructor({ redis, conditionFunc }) {
    this.redis = redis
    this.conditionFunc = conditionFunc;
  }
  route(config = {}) {
    const _this = this;
    const { prefix, expire } = config = {
      prefix: "default",
      expire: 300,
      conditionFunc: _this.conditionFunc,
      ...config
    };
    return async (ctx, next) => {
      if (ctx.request.method === "GET") {
        let cacheKey = _md5(ctx.request.url);
        cacheKey = `${prefix}:${cacheKey}`;
        let responseBody = await _this.redis.get(cacheKey);
        if (responseBody) {
          responseBody = JSON.parse(responseBody);
          if (config.conditionFunc) {
            if (config.conditionFunc(responseBody)) {
              return ctx.body = responseBody;
            }
          } else {
            return ctx.body = responseBody;
          }
        }
        await next();
        if (config.conditionFunc) {
          if (config.conditionFunc(ctx.body)) {
            await _this.redis.set(cacheKey, JSON.stringify(ctx.body), "EX", expire)
          }
        } else {
          await _this.redis.set(cacheKey, JSON.stringify(ctx.body), "EX", expire)
        }
        return;
      }
      await next();
    }
  }

  async delCache(prefix) {
    const _this = this;
    if (_this.redis.nodes) {
      const masters = _this.redis.nodes("master");
      await Promise.all(
        masters.map(async function (node) {
          const keys = await node.keys(`${prefix}*`);
          if (keys.length) {
            await node.del(keys);
          }
        })
      );

    } else {
      const keys = await _this.redis.keys(`${prefix}*`);
      if (keys.length) {
        await _this.redis.del(keys);
      }
    }
  }
}
module.exports = ApiCache