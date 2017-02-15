module.exports = (sequelize, DataTypes) => {
    let table = sequelize.define('coupon', {
            name: DataTypes.STRING,//名称
            desc: DataTypes.STRING,//描述
            type: {type: DataTypes.INTEGER, defaultValue: 0},//券的类型，0 优惠券，1 兑换券
            cover: {type: DataTypes.STRING},//封面图片
            limit: {type: DataTypes.INTEGER, defaultValue: 0},//每天限制
            money: {type: DataTypes.INTEGER, defaultValue: 0},//价值
            enable: {type: DataTypes.BOOLEAN, defaultValue: false},//是否启用
        },
        {
            timestamps: false,
        });

    let afterCreate = db => {
        db.coupon.belongsToMany(db.user, {through: db.ucship, unique: true});
        db.coupon.hasMany(db.count);
    };

    return {table, afterCreate};
};