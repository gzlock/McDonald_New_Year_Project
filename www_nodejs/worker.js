const Koa = require('koa');
const render = require('koa-ejs');
const path = require('path');
const session = require('koa-generic-session');
const redisStore = require('koa-redis');
const utils = require('./function/utils');
const co = require('co');
const config = require('./config');
const ioRedis = require('ioredis');

const workPath = process.env.WORK_PATH;

const app = new Koa();
app.listen(process.env.PORT);
app.proxy = true;
app.keys = ['GDMC'];

render(app, {
    root: path.join(__dirname, 'views', workPath),
    layout: workPath == 'frontend' ? false : 'layout',
    cache: false
});
app.context.render = co.wrap(app.context.render);
app.context.sql = require('./sequelize');
app.context.redis = new ioRedis({host: 'redis'});
app.context.show = show;
if (workPath == 'frontend') {
    let a = require('./function/wechat');
    let b = a(app.context.redis);
    app.context.weChat = b.wechat;
    app.context.oauth = b.oauth;
}

app
    .use(session({
        store: redisStore({host: 'redis', ttl: 24 * 3600}),
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000,
        }
    }))
    .use(require('koa-bodyparser')());

let routersPath = __dirname + '/routers/' + workPath + '/';
app.use(require(routersPath).routes());

/**
 *
 * @param {String|Object} file
 * @param data
 * @param status
 * @return {*}
 */
async function show(file, data, status = 200) {
    if (file && data) {
        this.status = data.status || status;
        Object.assign(data, this.state, this.session);
        return this.render(file, data);
    }
    if (!file && !data) file = {message: 'ok'};
    this.status = file.status || data || status;
    this.body = file;
}