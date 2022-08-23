const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const pages = require('./utils/pages');

const combineObjects = (a, b) => ({ ...a, ...b });

const config = {
  entry: {
    ...pages
      .map(page => ({
        [[page.slug, 'bundle.js'].join('/')]: page.jsPath,
      }))
      .reduce(combineObjects),
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: '[name]',
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    ...pages.map(
      page =>
        new HtmlWebpackPlugin({
          template: page.twigPath,
          filename: page.filename,
          chunks: [[page.slug, 'bundle.js'].join('/')],
        })
    ),
  ],

  devServer: {
    compress: true,
    hot: true,
    liveReload: true,
    watchFiles: ['./src/**/*'],
  },

  module: {
    rules: [
      {
        test: /\.twig$/,
        use: [
          {
            loader: 'twig-loader',
          },
          { loader: path.resolve(__dirname, './utils/loader.js') },
        ],
      },
      { test: /\.md$/, use: ['raw-loader'] },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(glsl|frag|vert)$/,
        use: ['raw-loader'],
      },
    ],
  },
};

module.exports = config;
