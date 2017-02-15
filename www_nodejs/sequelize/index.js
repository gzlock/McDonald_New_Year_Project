const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require('../config');

let sequelize = new Sequelize(config.sql.database, config.sql.username, config.sql.password, config.sql);

let db = {};
let temp = {};
fs
    .readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function (file) {
        let _path = path.join(__dirname, file);
        let data = require(_path)(sequelize, Sequelize);
        temp[data.table.name] = data;
        db[data.table.name] = data.table;
    });

Object.keys(temp).forEach(name => {
    if ('afterCreate' in temp[name]) {
        temp[name].afterCreate(db);
    }
});
temp = null;

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;