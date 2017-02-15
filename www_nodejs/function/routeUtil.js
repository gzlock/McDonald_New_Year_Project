const fs = require('fs');
const path = require('path');
const Router = require('koa-router');

module.exports = (dir) => {
    return new Load(dir);
};

class Load {
    constructor(dir) {
        this.dir = dir;
    }

    routes() {
        console.log(this.dir);
        let dir = this.dir;
        let router = new Router();
        fs
            .readdirSync(dir)
            .filter(function (file) {
                return (file.indexOf(".") !== 0);
            })
            .forEach(function (file) {
                console.log(path.join(dir, file));
                try {
                    router.use(require(path.join(dir, file)).routes());
                }
                catch (e) {
                    console.log('route load error', e);
                }
            });
        return router.routes();
    }
}