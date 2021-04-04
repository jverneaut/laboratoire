const webpack = require('webpack');
const { join, resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    global: join(__dirname, '../src/global.js'),
  },
  output: {
    publicPath: '/',
    path: join(__dirname, '../dist'),
    filename: '[name]/[name].js',
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name]/[name].css',
    }),
    new FaviconsWebpackPlugin({
      logo: join(__dirname, '/../src/favicon.svg'),
      favicons: {
        appName: 'Le laboratoire',
        lang: 'fr-FR',
        theme_color: '#fd7e14',
      },
    }),
    new CopyPlugin({
      patterns: [{ from: 'public/' }],
    }),
  ],
  devServer: {
    contentBase: resolve(__dirname, 'dist'),
    publicPath: '/',
    writeToDisk: true,
  },
  devtool: 'eval-cheap-source-map',
};
