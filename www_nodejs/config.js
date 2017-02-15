const config = module.exports = {
    domain: 'yooo.cn',
    weChat: {
        appID: 'appId',
        appSecret: 'appSecret',

        token: '123',
        encodingAESKey: 'encodingAESKey'
    },
    redis: {
        host: 'redis',
        port: 6379,
        key: {
            accessToken: 'accessToken',
        },
    },
    sql: {
        host: 'postgres',
        dialect: 'postgres',
        database: 'yooooo',
        username: 'yooooo',
        password: '12341234',
        force: process.env.NODE_ENV == 'dev',//开发环境清空数据，生产环境不清空
        logging: false,
        timezone: '+08:00',
    },
};