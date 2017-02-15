if (process.env.NODE_ENV == 'dev') {
    return console.log('开发环境，不请求微信Token');
}
const later = require('later');
const co = require('co');
const request = require('request');
const Redis = require('ioredis');
const moment = require('moment');

const config = require('./config');
const redisConfig = config['redis'];
const weChatConfig = config['weChat'];

const minute = 5;
const redis = new Redis(redisConfig);

let get = async() => {
    let token = await req();
    if (!token)return;
    await redis.set(redisConfig.key.accessToken, token);
};

co(get);
later.setInterval(() => {
    console.log('申请微信token,时间:', moment().format('HH:mm:ss'));
    co(get);
}, later.parse.recur().every(minute).minute());


function req() {
    let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${weChatConfig.appID}&secret=${weChatConfig.appSecret}`;
    return new Promise(resolve => {
        request(url, (err, res, body) => {
            // console.log(body);
            let info = JSON.parse(body);
            let token = null;
            if (info.access_token)
                token = info.access_token;
            resolve(token);
        });
    });
}