/* eslint no-param-reassign:0 */
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import cssnext from 'postcss-cssnext';
import cssImport from 'postcss-import';
import cssUrl from 'postcss-import';
import env from 'node-env';
import webpack from 'webpack';

const prod = env === 'production';
const compressJs = prod;
const extractCss = true;
const useHmr = !prod;

const cssPipeline = [
  'style-loader',
  prod ? 'css-loader?minimize' : 'css-loader',
  'postcss-loader',
];

const jsLoader = {
  test: /\.js$/,
  exclude: /node_modules/,
  loaders: ['babel-loader'],
};

const config = {
  context: `${__dirname}/../src`,
  entry: {
    app: ['./browser.js'],
    vendor: [
      'babel-polyfill',
      'react',
      'react-dom',
      'immutable',
      'react-hammerjs',
      'stilr',
      'redux',
    ],
  },
  output: {
    path: `${__dirname}/../dist/asset`,
    filename: 'bundle.js',
    publicPath: '/asset',
  },
  module: {
    loaders: [
      jsLoader,
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
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js'),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${env}"`,
    }),
  ],
};

if (useHmr) {
  config.entry.app.unshift('./hmr-client?path=/hmr/__webpack_hmr&timeout=20000');
  config.output.publicPath = '/hmr';
  jsLoader.loaders.unshift('react-hot');
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
