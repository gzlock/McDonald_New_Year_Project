module.exports = (sequelize, DataTypes) => {
    let table = sequelize.define("ucship", {
        count: {type: DataTypes.INTEGER, defaultValue: 0}
    }, {timestamps: false,});

    let afterCreate = db => {
    };

    return {table, afterCreate};
};