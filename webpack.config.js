const merge = require('webpack-merge');

const baseConfig = require('./config/base.config');
const modulesConfig = require('./config/modules.config');
const appConfig = require('./config/app.config');
const srcConfig = require('./config/src.config');
const overlayConfig = require('./config/overlay.config');

module.exports = merge(
  baseConfig,
  modulesConfig,
  appConfig,
  srcConfig,
  overlayConfig
);
