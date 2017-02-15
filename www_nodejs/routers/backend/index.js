const Router = require('koa-router');
const lodash = require('lodash');
const moment = require('moment');
const utils = require('../../function/utils');
const router = module.exports = new Router({prefix: '/data'});

/**
 * 登录页面
 */
router.get('/', async(ctx, next) => {
    if (ctx.session.admin)
        return await next();
    await ctx.show('login', {title: '登录'});
});

/**
 * 处理登录数据
 */
router.post('/', async ctx => {
    let data = ctx.request.body;
    let user = await ctx.sql.admin.findOne({where: {username: data.a}});
    let res;
    if (!user) {
        res = {message: '不存在的账号', status: 500};
    } else {
        if (user.password == data.b) {
            ctx.session.admin = user.toJSON();
        } else
            res = {message: '密码错误', status: 500};
    }
    await ctx.show(res);
});

/**
 * 利用全局路由器检查是否有登录
 */
router.use(async(ctx, next) => {
    if (ctx.session.admin)
        return await next();
    let method = ctx.request.method.toLowerCase();
    if (method == 'get')
        return await ctx.show('login', {title: '登录'});
    else
        ctx.show({message: '请登录后再操作', status: 403});
});

/**
 * 后台首页
 */
router.get('/', async ctx => {
    let config = await ctx.redis.hgetall('config');
    if (!config.percent) config.percent = 20;
    await ctx.show('index', {title: '首页', config});
});


/**
 * 登出
 */
router.get('/logout', async ctx => {
    ctx.session.admin = null;
    ctx.redirect('/data');
});

async function adminLimit(ctx, next) {
    if (ctx.session.admin.config.admin)
        return await next();
    ctx.show({message: '没有权限', status: 403});
}

/**
 * 保存全局设置
 */
router.post('/config', adminLimit, async ctx => {
    let body = ctx.request.body;
    for (let key in body) {
        let value = body[key];
        if (!lodash.isNumber(value) && lodash.isEmpty(value))
            continue;
        value = lodash.isObject(value) ? JSON.stringify(value) : value;
        await [ctx.sql.config.upsert({key, value}), ctx.redis.hset('config', key, value)];
    }
    ctx.show();
});

let routersPath = __dirname + '/';
utils.foreachDir(routersPath, ['index.js']).forEach(file => {
    let path = routersPath + file;
    router.use(require(path).routes());
});