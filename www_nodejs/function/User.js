const utils = require('./utils');
module.exports = class User {
    constructor(redis, sql, openid) {
        this.redis = redis;
        this.sql = sql;
        this.openid = openid;
        this.data = {play: 0, share: 0};
    }

    openid() {
        return this.openid;
    }

    get play() {
        return this.data.play;
    }

    set play(play) {
        this.data.play = play;
    }

    get share() {
        return this.data.share;
    }

    set share(share) {
        this.data.share = share;
    }

    id() {
        return this.id;
    }

    async init() {
        let data = await this.redis.hget(utils.today(), this.openid);
        if (!!data) {
            this.data = JSON.parse(data);
        }
        let sql = await this.sql.user.findOrCreate({where: {openid: this.openid}});
        this.id = sql[0].id;
        // console.log({userId: this.id});
    }

    async save() {
        // console.log('user save', this.data);
        await this.redis.hset(utils.today(), this.openid, JSON.stringify(this.data));
    }

    async addCoupon(couponId) {
        let count = await this.sql.coupon.count({where: {id: couponId, enable: true}});
        if (count > 0) {
            let uc = await this.sql.ucship.findOrCreate({
                where: {couponId, userId: this.id},
                defaults: {couponId, userId: this.id}
            });
            await uc[0].increment('count');
            return {message: 'ok', couponId: couponId};
        }
        return {message: '不存在的券', status: 404};
    }

    async getCoupons() {
        let coupons = await this.sql.user.findOne({
            where: {id: this.id},
            include: [{
                model: this.sql.coupon,
                where: {enable: true},
                through: {
                    where: {count: {$gt: 0}}
                }
            }]
        });
        return coupons ? coupons.coupons : [];
    }
};