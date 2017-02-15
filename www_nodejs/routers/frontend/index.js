const moment = require('moment');
const Router = require('koa-router');
const lodash = require('lodash');
const User = require('../../function/User');
const utils = require('../../function/utils');
const router = module.exports = new Router();
const env = process.env.NODE_ENV;

/**
 * 网页界面
 */
router.get('/', async(ctx, next) => {//从微信拿openid
    if (env == 'dev') {
        ctx.session.openid = '开发测试';
        ctx.state.user = new User(ctx.redis, ctx.sql, '开发测试');
        return await next();
    } else if (ctx.session.openid) {
        ctx.state.user = new User(ctx.redis, ctx.sql, ctx.session.openid);
        return await next();
    } else if (ctx.query && ctx.query.code) {//存在code参数
        let token = await new Promise((resolve, reject) => {
            ctx.oauth.getAccessToken(ctx.query.code, function (err, token) {
                // console.log('getOauth', err, token);
                // if (err) return reject(err);
                resolve(!!err ? null : token);
            });
        });
        // console.log(token);
        if (token && token.data && token.data.openid) {
            ctx.session.openid = token.data.openid;
            return ctx.redirect('/');
        }
        ctx.show('与微信服务器通讯失败');
    } else {//不存在code参数，需要跳转到微信网址获取
        let url = ctx.oauth.getAuthorizeURL(utils.url(ctx), 'game', 'snsapi_base');
        // console.log({redirect: url});
        return ctx.redirect(url);
    }
}, async ctx => {//网页界面
    let user = ctx.state.user;
    await user.init();

    let weChatConfig = env == 'dev' ? {} : await getJsConfig(ctx);
    weChatConfig = JSON.stringify(weChatConfig);
    await ctx.show('index', {
        pages: 5,
        weChatConfig,
        userData: JSON.stringify({
            play: user.play,
            share: user.share,
            coupons: await ctx.state.user.getCoupons()
        }),
    });
});


/**
 * 为后面的接口鉴权
 */
router.use(async(ctx, next) => {
    if (ctx.session.openid) {
        let user = new User(ctx.redis, ctx.sql, ctx.session.openid);
        ctx.state.user = user;
        await user.init();
        //检查今天的缓存是否存在
        let todayExists = await ctx.redis.exists(utils.today());
        if (!todayExists) {//缓存不存在，则添加过期日期
            await user.save();
            let time = moment().utcOffset('+08:00').add(2, 'day').startOf('day').unix();
            await ctx.redis.expireat(utils.today(), time);
        }
        // ctx.state.playTimes = 5;
        return await next();
    }
    ctx.show({message: '没有openid，拒绝进一步的操作', status: 500});
});

/**
 * 用户的券的数据接口
 */
router.get('/status', async ctx => {
    let [coupons, count] = await Promise.all([ctx.sql.coupon.findAll({
        attributes: ['id', 'name', 'money', 'cover'],
        where: {enable: true},
    }),
        ctx.sql.ucship.findAll({where: {userId: 1}, attributes: ['count', ['couponId', 'id']]})]);
    ctx.body = {coupons, count, playTimes: ctx.state.playTimes};
});

/**
 * 增加分享次数
 */
router.get('/share', async ctx => {
    ctx.redis.hincrby('share', moment().format('MM-DD'), 1);
    if (ctx.state.user.share < 1) {
        ctx.state.user.share++;
        await ctx.state.user.save();
        return ctx.show({message: '分享成功'});
    }
    return ctx.show({message: '分享失败，今天已经分享过一次了', status: 500});
});

/**
 * 拿券接口
 */
router.get('/coupon/get/', async ctx => {
    let user = ctx.state.user;
    let playTimes = user.play - user.share;
    let result;
    if (moment().format('MM-DD') == '02-15') {
        result = {message: '活动已经结束，无法再获取新的券', status: 500};
    } else if (playTimes < 3) {//拿券
        result = await randomGetCoupon(ctx);
    } else {
        if (user.share == 0)
            result = {message: '今天的领取次数已用完，告诉小伙伴们可获取多一次机会噢！', status: 500, share: true};
        else
            result = {message: '今天的领取次数已用完', status: 500};
    }

    ctx.show(result);
});

/**
 * 使用券的接口
 */
router.get('/coupon/use/:id', async ctx => {
    let id = ctx.params.id;
    let coupon = await ctx.sql.coupon.findOne({raw: true, where: {enable: true, id}});
    if (!coupon)
        return ctx.show({message: '这种券已停用，无法兑换', status: 404});
    let uc = await ctx.sql.ucship.findOne({
        where: {
            count: {$gt: 0},
            userId: ctx.state.user.id,
            couponId: id,
        }
    });
    if (!uc)
        return ctx.show({message: '您没有拥有这个券，兑换失败', status: 404});
    await uc.decrement('count');
    couponCount(ctx, id, 'use');
    ctx.show({message: '兑换成功'});
});

/**
 * 随机获取券
 * @return {Promise.<void>}
 */
async function randomGetCoupon(ctx) {
    let user = ctx.state.user,
        result,
        random = Number(await ctx.redis.hget('config', 'percent')) || 20,
        coupon;
    // console.log(1, {random});
    random = lodash.random(0, random);
    if (random == 1) {//限额的兑换券
        let coupons = JSON.parse(await ctx.redis.hget('coupons', 1));
        let couponsCount = [];
        coupons.map(c => {
            couponsCount.push(utils.today(c.id, 'get'));
        });
        couponsCount = await ctx.redis.hmget('count', couponsCount);
        coupons = coupons.map((c, i) => {//过滤获取数量为负数的兑换券
            c.last = c.limit - (couponsCount[i] || 0);
            if (c.last > 0)
                return c;
        });
        coupons = lodash.without(coupons, undefined);//过滤获取数量为负数的兑换券
        if (coupons.length) {
            coupons = lodash.sortBy(coupons, 'last');
            coupon = coupons[lodash.random(coupons.length - 1)];//优先获取剩余数量最多的兑换券
        }
    }
    // console.log(2, {random, coupon});
    if (!coupon) {//无限的优惠券
        let coupons = JSON.parse(await ctx.redis.hget('coupons', 0));
        coupon = coupons[lodash.random(coupons.length - 1)];
    }
    if (coupon) {
        user.play++;
        await Promise.all([
            user.save(),
            user.addCoupon(coupon.id),
            couponCount(ctx, coupon.id, 'get')
        ]);
        result = {coupon, message: '领取成功'};
    } else {
        result = {message: '没有可以被领取的券', status: 404};
    }
    // console.log('last,', {random, coupon});
    return result;
}

/**
 * 统计兑换券的领取和使用情况
 * @param ctx
 * @param couponId
 * @param getOrUse {string}
 * @return {Promise.<void>}
 */
async function couponCount(ctx, couponId, getOrUse) {
    // console.log('couponCount', {couponId, getOrUse});
    await ctx.redis.hincrby('count', utils.today(couponId, getOrUse), 1);
}

/**
 * 获取网页JS配置
 * @param ctx
 * @return {Promise}
 */
function getJsConfig(ctx) {
    let params = {
        debug: false,
        jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone'],
        url: utils.url(ctx),
    };
    return new Promise(resolve => {
        ctx.weChat.getJsConfig(params, (err, data) => {
            resolve(!!err ? null : data);
        });
    });
}