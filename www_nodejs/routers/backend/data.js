const Router = require('koa-router');
const lodash = require('lodash');
const moment = require('moment');
const utils = require('../../function/utils');
const router = module.exports = new Router({prefix: '/data'});


/**
 * 统计数据接口
 */
router.get('/:type/:start/:end', async ctx => {
    let type = ctx.params.type;
    let result = {
        title: {
            text: '数据集合'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
        },
        grid: {left: '3%', right: '4%', bottom: '3%', containLabel: true},
        legend: {top: '25'},
        xAxis: {type: 'category', data: ['1月2', '1月3', '1月4', '1月5', '1月6', '1月7', '1月8'],},
        yAxis: {type: 'value'},
        series: [{name: '1月1', type: 'bar', data: [10, 52, 200, 334, 390, 330, 220]},]
    };
    let start = moment(ctx.params.start, 'YYYY-MM-DD').startOf('day'),
        end = moment(ctx.params.end, 'YYYY-MM-DD').endOf('day');
    if (end.isBefore(start))//结束日期在开始日期之前，则将end设为start
        end = start;
    let diff = end.diff(start, 'days') + 1;//计算两个日期的天数差距
    let dateRange = lodash.range(diff).map(i => {//得到所有日期
        return start.clone().add(i, 'day');
    });


    result.title.text = `从 ${dateRange[0].format('M月D日')} 到 ${dateRange[dateRange.length - 1].format('M月D日')} `;

    if (type == 1) {//分享数据
        await loadRedisShareData(ctx.redis, result, dateRange);
    } else if (type == 2 || type == 3) {//领取次数
        await loadSqlData(ctx, type, result, dateRange);
    }
    ctx.body = JSON.stringify(result, null, 4);
});

/**
 * 读取所有券的 领取次数 或 使用次数
 * @param ctx
 * @param type
 * @param result
 * @param dateRange
 * @return {Promise.<void>}
 */
async function loadSqlData(ctx, type, result, dateRange) {
    if (type == 2)
        result.title.text += '所有券的领取次数';
    else
        result.title.text += '所有券的使用次数';

    result.xAxis.data = [];
    result.legend.data = [];
    result.series = [];

    type = type == 2 ? 'get' : 'use';

    let coupons = await ctx.sql.coupon.findAll({raw: true, attributes: ['id', 'name'], order: 'type asc'});
    let countData = [];
    coupons.map(coupon => {
        dateRange.map(date => {
            countData.push(`day_${date.format('MM_DD')}_${coupon.id}_${type}`);
        });
    });
    // console.log({countData});
    countData = await ctx.redis.hmget('count', countData);
    // console.log({countData});
    dateRange.map(date => {//x轴坐标内容为日期
        result.xAxis.data.push(date.format('M月D日'));
    });
    let defaultValue = dateRange.map(() => {
        return 0;
    });
    coupons.map((coupon) => {
        result.legend.data.push(coupon.name);
        result.series.push({
            name: coupon.name,
            id: coupon.id,
            type: 'bar',
            label: {
                normal: {
                    show: true,
                    position: 'top'
                }
            },
            data: defaultValue.slice(0),
        });
    });

    for (let i in result.series) {
        let item = result.series[i];
        let j;
        for (j in countData) {
            if (!!countData[j])
                item.data.splice(j, 1, countData[j]);
            if (j >= dateRange.length - 1)
                break;
        }
        countData.splice(0, dateRange.length);
    }
}

/**
 * 从redis读取分享次数
 * @param redis
 * @param result
 * @param dateRange
 * @return {Promise.<void>}
 */
async function loadRedisShareData(redis, result, dateRange) {
    result.title.text += '的分享次数';
    result.xAxis.data = [];
    result.legend.data = [];
    result.series = [{
        name: '分享次数',
        type: 'bar',
        label: {
            normal: {
                show: true,
                position: 'top'
            }
        },
        data: dateRange.map(() => {
            return 0;
        })
    }];
    let dates = dateRange.map(d => {
        let semanticDate = d.format('M月D日');
        result.legend.data.push(semanticDate);
        result.xAxis.data.push(semanticDate);
        return d.format('MM-DD');
    });
    let shareData = await redis.hmget('share', dates);
    dates.map((d, i) => {
        if (!!shareData[i])
            result.series[0].data.splice(i, 1, shareData[i]);
    });
}