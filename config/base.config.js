const webpack = require('webpack');
const { lstatSync, readdirSync, readFileSync } = require('fs');
const { join, resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SitemapPlugin = require('sitemap-webpack-plugin').default;

const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) =>
  readdirSync(source)
    .map((name) => join(source, name))
    .filter(isDirectory);

const pageDirectories = getDirectories(join(__dirname, '../src')).filter(
  (dir) =>
    process.env.NODE_ENV === 'production'
      ? dir.split('/').reverse()[0].charAt(0) !== '_'
      : true
);

const pages = pageDirectories.map((pageDirectory) => {
  const slug = pageDirectory.split('/').reverse()[0];
  const page = { slug };

  return page;
});

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
    new SitemapPlugin({
      base: 'https://lab.julienverneaut.com',
      paths: [
        { path: '/', changefreq: 'daily', priority: 1.0 },
        ...pages.map(({ slug }) => ({
          path: `${slug}/`,
          changefreq: 'weekly',
          priority: 0.8,
        })),
      ],
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
