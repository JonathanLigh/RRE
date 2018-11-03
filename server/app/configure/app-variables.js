'use strict';

const path = require('path');
const logMiddleware = require('volleyball');

const rootPath = path.join(__dirname, '../../');

module.exports = (app) => {
    app.setValue('projectRoot', rootPath);
    app.setValue('log', logMiddleware);
};
