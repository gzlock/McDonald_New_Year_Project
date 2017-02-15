module.exports = (sequelize, DataTypes) => {
    let table = sequelize.define('count', {
        use: {type: DataTypes.INTEGER, defaultValue: 0},
        get: {type: DataTypes.INTEGER, defaultValue: 0},
    }, {updatedAt: false,});

    let afterCreate = db => {
        db.count.belongsTo(db.coupon);
    };

    return {table, afterCreate};
};