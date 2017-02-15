const later = require('later');
const mysql = require('./sequelize');
const co = require('co');
const moment = require('moment');
const lodash = require('lodash');
const ioRedis = require('ioredis');
later.date.localTime();

let redis = new ioRedis({host: 'redis'});

const minute = 5;

//每5分钟统计一次数据
/*later.setInterval(() => {
 console.log('执行统计,时间', moment().format('HH:mm:ss'));
 let start = moment().subtract(minute, 'minute').startOf('minute');
 co(stores(start)).catch(err => {
 console.log('has error', err);
 });
 }, later.parse.recur().every(minute).minute());*/

/*
let time = {schedules: [{h: [24], m: [0]}]};
time = later.parse.text('every 5 seconds');
//每天凌晨00:00 执行任务
later.setInterval(async() => {
    let today = 'Day_' + moment().utcOffset('+08:00').format('DD');
    console.log(new Date(), today);

    let time = moment().utcOffset('+08:00').add(1, 'day').startOf('day').unix();
    await redis.expireat(today, time);
    console.log('完成', await redis.ttl(today));
}, time);*/
