module.exports = (sequelize, DataTypes) => {
    let table = sequelize.define("admin", {
            username: {type: DataTypes.STRING, unique: 'username'},
            password: {type: DataTypes.STRING},
            config: {type: DataTypes.JSON, defaultValue: {}}
        },
        {
            timestamps: false,
        });

    let associates = db => {
    };

    return {table, associates};
};