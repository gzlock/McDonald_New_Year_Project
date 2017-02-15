module.exports = (sequelize, DataTypes) => {
    let table = sequelize.define('config', {
        key: {type: DataTypes.STRING, primaryKey: true},
        value: {type: DataTypes.JSON}
    }, {timestamps: false});

    let afterCreate = db => {
    };

    return {table, afterCreate};
};