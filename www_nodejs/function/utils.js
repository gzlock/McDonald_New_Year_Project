const crypto = require('crypto');
const fs = require('fs');
const lodash = require('lodash');
const moment = require('moment');
const config = require('../config');

const colorLetters = '0123456789ABCDEF';
const randomLetters = '012356789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';


let utils = module.exports = {

    today: (...name) => {
        if (name.length)
            return 'day_' + moment().format('MM_DD') + '_' + name.join('_');
        return 'day_' + moment().format('MM_DD');
    },

    url: ctx => {
        let url = `http://${config.domain}${ctx.url}`;
        url = url.split('#')[0];
        // console.log('configUrl', url);
        return url;
    },

    /**
     * sha1加密运算
     * @param string
     * @param key 盐
     * @param isHex
     * @return {*}
     */
    sha1: (string, key = config.sha1Key, isHex = true) => {
        let sha1 = !!key ? crypto.createHmac('sha1', key) : crypto.createHash('sha1');
        sha1.update(Buffer.from(string));
        return isHex ? sha1.digest('hex') : sha1.digest();
    },

    /**
     * md5加密
     * @param string
     * @param key
     * @param isHex
     * @return {*}
     */
    md5: (string, key = config.sha1Key, isHex = true) => {
        let md5 = !!key ? crypto.createHmac('md5', key) : crypto.createHash('md5');
        md5.update(Buffer.from(string));
        return isHex ? md5.digest('hex') : md5.digest();
    },


    /**
     * 随机字符串
     * @param length
     * @param {boolean}_case true = 大小写 false = 小写
     * @return {string}
     */
    randomLetters: (length = 6, _case = true) => {
        let result = '';
        let total = _case ? randomLetters.length : randomLetters.length - 26;
        for (let i = 0; i < length; i++) {
            result += randomLetters.charAt(Math.floor(Math.random() * total));
        }
        return result;
    },
    /**
     * 分页对象
     * @param currentPage 当前页数
     * @param count 总数据量
     * @param limit 每页显示数据量
     * @return {{current: number, total: Number, limit:Number, offset:Number}}
     */
    createPages: (currentPage, count, limit) => {
        let page = {current: 1, limit, offset: 0, total: parseInt((count + limit) / limit)};

        page.current = currentPage > 1 ? currentPage : 1;
        if (page.current > page.total)
            page.current = page.total;
        page.offset = (page.current - 1) * limit;
        return page;
    },

    /**
     * 遍历文件夹
     * @param path
     * @param ignore
     */
    foreachDir: (path, ignore = []) => {
        let files = fs
            .readdirSync(path)
            .filter(function (file) {
                return (file.indexOf(".") !== 0) && ignore.indexOf(file) == -1;
            });
        let indexFile = files.indexOf('index.js');
        //如果含有index.file,但不处于第一，则提升为第一
        if (indexFile != -1 && indexFile != 0) {
            files.splice(indexFile, 1);
            files.splice(0, 0, 'index.js');
        }
        return files;
    },
};