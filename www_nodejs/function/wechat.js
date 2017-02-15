const WeChatOauth = require('wechat-oauth');
const WeChatApi = require('wechat-api');
const config = require('../config');

const redisOpenIdKey = 'openid';
const redisAccessTokenKey = config.redis.key.accessToken;
const redisJsApiKey = 'jsApi:';

module.exports = function (redis) {
    let oauth = new WeChatOauth(
        config.weChat.appID,
        config.weChat.appSecret,
        (openid, cb) => {//读取
            redis.hget(redisOpenIdKey, openid, (err, token) => {
                // console.log('get access token', err, token);
                if (err) return cb(err);
                cb(null, JSON.parse(token));
            });
        },
        (openid, token, cb) => {//保存
            redis.hset(redisOpenIdKey, openid, JSON.stringify(token), cb);
        });

    let wechat = new WeChatApi(
        config.weChat.appID,
        config.weChat.appSecret,
        cb => {//读取
            redis.get(redisAccessTokenKey, (err, token) => {
                // console.log('get access token', err, token);
                if (err) return cb(err);
                cb(null, {accessToken: token, expireTime: Date.now() + 60000});
            });
        },
        (token, cb) => {//保存
            console.log('set access token', token);
            /*token.expireTime -= 600 * 100;
             redis.set(redisConfig.key.accessToken, JSON.stringify(token), cb);*/
            cb();
        });

    wechat.registerTicketHandle((type, cb) => {
        // console.log('get ticket token', type);
        redis.get(redisJsApiKey + type, (err, token) => {
            if (err) return cb(err);
            cb(null, JSON.parse(token));
        });
    }, (type, token, cb) => {
        // console.log('set ticket token', type, token);
        redis.set(redisJsApiKey + type, JSON.stringify(token), cb);
    });
    return {oauth, wechat};
}