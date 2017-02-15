const co = require('co');
const db = require('./sequelize');
const config = require('./config');

const data = {
    development: {
        admin: [
            {username: '123', password: '123'},
        ],
        coupon: [
            {name: 'xxx汉堡', cover: '1', money: 49, limit: 100},
            {name: '麦乐鸡翅', cover: '2', money: 49, limit: 100},
            {name: '麦辣鸡翅', cover: '3', type: 1, money: 49, limit: 100},
        ],
        user: [{openid: 'test1'}, {openid: 'test2'},],
        ucship: [
            {couponId: 1, userId: 1, count: 10},
            {couponId: 1, userId: 2, count: 10},
        ],
    },
    production: {
        admin: [
            {username: '123', password: '123', config: {admin: true}},
        ],
    },
};

(async() => {
    let dataType = process.env.NODE_ENV || 'development';
    let d = data[dataType];
    await db.sequelize.sync({force: config.sql.force});
    for (let i in d) {
        let _db = db[i];
        if (!_db) continue;
        console.log('sequelize fill data: ', _db.name);
        for (let j in d[i]) {
            await _db.create(d[i][j]);
        }
    }
    console.log('fill finish.');
})();
