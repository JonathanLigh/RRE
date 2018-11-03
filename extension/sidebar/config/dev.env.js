'use strict'
const merge = require('webpack-merge');
const prodEnv = require('./prod.env');

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  RRERecommendationsCacheSize: '100',
  RRERecommendationsCacheBufferSize: '10',
  closeModalTimeoutDuration: 1000,
  displayStatusMessageDuration: 1000,
  RREServerURL: "https://localhost:8080",
  retryRequestToServerTimeoutDuration: 1800000
})
