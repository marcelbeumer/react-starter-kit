/* eslint no-param-reassign:0 */
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { HtmlWebpackAssetPlugin } from './webpack-plugins';
import cssnext from 'postcss-cssnext';
import cssImport from 'postcss-import';
import cssUrl from 'postcss-import';
import env from 'node-env';
import webpack from 'webpack';

const prod = env === 'production';
const compressJs = prod;
const extractCss = true;
const useHmr = !prod;
const useCdn = prod;
const useMin = prod;

const cssPipeline = [
  'style-loader',
  prod ? 'css-loader?minimize' : 'css-loader',
  'postcss-loader',
];

const scripts = [
  {
    module: 'react',
    external: 'window.React',
    from: `../node_modules/react/dist/react${useMin ? '.min' : ''}.js`,
    to: `react-__VERSION__${useMin ? '.min' : ''}.js`,
    cdn: 'https://cdn.jsdelivr.net/react/__VERSION__/react.min.js',
  },
  {
    module: 'react-dom',
    external: 'window.ReactDOM',
    from: `../node_modules/react-dom/dist/react-dom${useMin ? '.min' : ''}.js`,
    to: `react-dom-__VERSION__${useMin ? '.min' : ''}.js`,
    cdn: 'https://cdn.jsdelivr.net/react/__VERSION__/react-dom.min.js',
  },
  {
    module: 'immutable',
    external: 'window.Immutable',
    from: `../node_modules/immutable/dist/immutable${useMin ? '.min' : ''}.js`,
    to: `immutable-__VERSION__${useMin ? '.min' : ''}.js`,
    cdn: 'https://cdn.jsdelivr.net/immutable.js/__VERSION__/immutable.min.js',
  },
];

scripts.forEach(script => {
  const version = require(`${script.module}/package.json`).version;
  ['to', 'cdn'].forEach(prop => {
    script[prop] = script[prop].replace('__VERSION__', version);
  });
});

const externals = scripts.reduce((p, c) => {
  p[c.module] = c.external; // eslint-disable-line no-param-reassign
  return p;
}, {});

const babelLoader = {
  test: /\.js$/,
  exclude: /node_modules/,
  loader: 'babel-loader',
};

const config = {
  externals,
  context: `${__dirname}/../src`,
  entry: [
    './browser.js',
  ],
  output: {
    path: `${__dirname}/../dist/asset`,
    filename: 'bundle.js',
    publicPath: '/asset',
  },
  module: {
    loaders: [
      babelLoader,
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        loader: extractCss ?
          ExtractTextPlugin.extract(cssPipeline[0], cssPipeline.slice(1)) :
          cssPipeline.join('!'),
      },
    ],
  },
  postcss: (pack) => [
    cssImport({ addDependencyTo: pack }),
    cssUrl(),
    cssnext(),
  ],
  plugins: [
    new CopyWebpackPlugin(scripts.map(({ from, to }) => ({ from, to }))),
    new HtmlWebpackAssetPlugin((assets, hash) => {
      const scriptBase = useHmr ? '/hmr' : '/asset';
      assets.css.push(`/asset/component.css?__stilr&${hash}`);
      assets.js = [
        ...scripts.map(script => useCdn ? script.cdn : `${scriptBase}/${script.to}`),
        ...assets.js,
      ];
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      hash: true,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${env}"`,
    }),
  ],
};

if (useHmr) {
  config.entry.unshift('./hmr-client?path=/hmr/__webpack_hmr&timeout=20000');
  config.output.publicPath = '/hmr/';
  babelLoader.query = {
    plugins: [
      ['react-transform', {
        transforms: [
          {
            transform: 'react-transform-hmr',
            imports: ['react'],
            locals: ['module'],
          },
        ],
      }],
    ],
  };
  config.plugins.push(
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  );
}

if (extractCss) {
  config.plugins.push(
    new ExtractTextPlugin('bundle.css'),
  );
}

if (compressJs) {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    })
  );
}

export default config;
