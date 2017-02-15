const moment = require('moment');
const Router = require('koa-router');
const router = module.exports = new Router({prefix: '/account'});
const multer = require('koa-multer');
const path = require('path');

router.use(async(ctx, next) => {
    if (ctx.session.admin.config.admin)
        return await next();
    ctx.show({status: 404});
});

/**
 * 编辑账号页面
 */
router.get('/', async ctx => {
    let account = await ctx.sql.admin.findAll({order: 'id asc', raw: true});
    await ctx.show('account', {title: '编辑账号', account});
});

/**
 * 保存账号
 */
router.post('/', async ctx => {
    let account = ctx.request.body;
    for (let i in account) {
        let a = account[i];
        if (!!a.id)
            ctx.sql.admin.update(a, {where: {id: a.id}});
        else
            ctx.sql.admin.build(account[i]).save();
    }
    ctx.show();
});