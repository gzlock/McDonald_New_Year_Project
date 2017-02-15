console.log('test.js', process.env.NODE_ENV);
const sql = require('./sequelize');
const moment = require('moment');
return;
//测试用的代码
(async() => {
    let now = await sql.count.findOne({where: {id: 1}});
    await now.set('data.' + moment().format('DD'), 124).save();
    now = await sql.count.create();
    console.log(await sql.count.count());
})();