module.exports = (sequelize, DataTypes) => {
    let table = sequelize.define('user', {
            openid: {type: DataTypes.STRING, unique: 'openid'},
        },
        {
            timestamps: false,
        });

    let afterCreate = db => {
        db.user.belongsToMany(db.coupon, {through: db.ucship, unique: true});
    };

    return {table, afterCreate};
};