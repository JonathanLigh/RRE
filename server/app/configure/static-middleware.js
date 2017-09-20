'use strict';

const path = require('path');
const express = require('express');

module.exports = (app) => {

  const root = app.getValue('projectRoot');

  const npmPath = path.join(root, './node_modules');
  app.use(express.static(npmPath));

};
