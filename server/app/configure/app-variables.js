'use strict';

const path = require('path');
const logMiddleware = require('volleyball');

const rootPath = path.join(__dirname, '../../');
const env = require(path.join(rootPath, './env'));

module.exports = (app) => {
    app.setValue('env', env);
    app.setValue('projectRoot', rootPath);
    app.setValue('log', logMiddleware);
};
