// @flow
/* eslint no-console:0 */
import 'babel-polyfill';
import express from 'express';
import webpack from 'webpack';
import path from 'path';
import fs from 'fs';
import once from 'lodash/once';
import webpackConfig from '../settings/webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

process.on('unhandledRejection', (value = {}) =>
  console.error(value.stack || value));

const app = express();
const compiler = webpack(webpackConfig);

const devMiddleware = webpackDevMiddleware(compiler, {
  stats: true,
  publicPath: webpackConfig.output.publicPath,
});

const hotMiddleware = webpackHotMiddleware(compiler, {
  log: console.log,
  path: '/hmr/__webpack_hmr',
  heartbeat: 10 * 1000,
});

function clearRequire(modulePath) {
  const base = path.resolve(modulePath);
  Object.keys(require.cache).forEach(entry => {
    if (entry.indexOf(base) === 0) {
      delete require.cache[entry];
    }
  });
}

function serverMiddleware(req, res, next) {
  const server = require('./server').default(fs); // eslint-disable-line global-require
  server(req, res, next);
}

function updateStilr() {
  hotMiddleware.publish({
    action: 'update-stilr',
    payload: require('./server').getComponentCss(), // eslint-disable-line global-require
  });
}

let bundleReady = false;
compiler.plugin('done', () => {
  bundleReady = true;
});

compiler.plugin('watch-run', (c, callback) => {
  clearRequire(__dirname);
  updateStilr();
  callback();
});

app.use(devMiddleware);
app.use(hotMiddleware);

app.use((req, res, next) => {
  const ready = () => serverMiddleware(req, res, next);
  if (!bundleReady) {
    compiler.plugin('done', once(() => ready()));
  } else {
    ready();
  }
});

export default app;
