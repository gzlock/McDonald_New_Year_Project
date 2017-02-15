const moment = require('moment');
const Router = require('koa-router');
const router = module.exports = new Router({prefix: '/coupon'});
const multer = require('koa-multer');
const path = require('path');

router.use(async(ctx, next) => {
    if (ctx.session.admin.config.admin)
        return await next();
    ctx.show({status: 404});
});

/**
 * 显示兑换券编辑器页面
 */
router.get('/', async ctx => {
    await ctx.show('coupon', {title: '编辑券'});
});

/**
 * 保存兑换券数据
 */
router.post('/', async ctx => {
    let data = ctx.request.body;
    let isNewRecord = !data.id;
    let coupon = ctx.sql.coupon.build(data, {isNewRecord});
    await coupon.save();
    await ctx.redis.del('coupons');
    let coupons = await ctx.sql.coupon.findAll({raw: true, where: {enable: true}, attributes: {exclude: ['enable']}});
    let coupons0 = [], coupons1 = [];
    coupons.map(coupon => {
        if (coupon.type == 0)
            coupons0.push(coupon);
        else
            coupons1.push(coupon);
    });
    await ctx.redis.hset('coupons', 0, JSON.stringify(coupons0));
    ctx.redis.hset('coupons', 1, JSON.stringify(coupons1));
    ctx.show({id: coupon.id});
});
/**
 * 上传图片
 */
const storePath = path.join(__dirname, '../../public/images/coupons/');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //保存到指定目录；
        cb(null, storePath);
    },
    filename: function (req, file, cb) {
        //直接用时间戳当文件名，不使用格式名
        cb(null, Date.now() + '');
    }
});
const fileFilter = function (req, file, cb) {
    //识别文件的类型，不接受非图片的文件
    let [type, format] = file.mimetype.toLowerCase().split('/');
    cb(null, (type == 'image' && (format == 'png' || format == 'jpg' || format == 'jpeg')));
};
const upload = multer({storage, fileFilter});
router.post('/upload',
    upload.single('image'),
    async ctx => {
        if (ctx.req.file)//返回文件名
            return ctx.show(ctx.req.file.filename);
        ctx.show({message: '只能上传PNG图片', status: 500});
    });

/**
 * 兑换券数据列表
 */
router.get('/list', async ctx => {
    ctx.body = await ctx.sql.coupon.findAll({order: 'id asc'});
});