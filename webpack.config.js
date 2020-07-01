const { lstatSync, readdirSync, readFileSync } = require('fs');
const { join, resolve } = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => join(source, name))
    .filter(isDirectory);

const pageDirectories = getDirectories(__dirname).filter(
  dirpath =>
    // Filter these directories
    !['dist', 'node_modules', '.vscode', '.git', '.netlify'].reduce(
      (acc, curr) => (acc === false ? dirpath.includes(curr) : true),
      false
    )
);

const getPageTitle = path => {
  const html = readFileSync(path, 'utf8');
  return html
    .match(/<title>(.*?)<\/title>/g)[0]
    .replace('<title>', '')
    .replace('</title>', '');
};

const getPageCategory = path => {
  const html = readFileSync(path, 'utf8');
  return html
    .match(/<meta name="category" content="(.*?)" \/>/g)[0]
    .replace('<meta name="category" content="', '')
    .replace('" />', '');
};

const pages = pageDirectories.map(pageDirectory => ({
  slug: pageDirectory.split('/').reverse()[0],
  html: join(pageDirectory, 'index.html'),
  js: join(pageDirectory, 'index.js'),
  name: getPageTitle(join(pageDirectory, 'index.html')),
  category: getPageCategory(join(pageDirectory, 'index.html')),
}));

const categories = Array.from(new Set(pages.map(page => page.category))).sort();

module.exports = {
  entry: {
    ...pages
      .map(page => ({
        [page.slug]: page.js,
      }))
      .reduce(
        (acc, curr) => ({
          ...acc,
          ...curr,
        }),
        {}
      ),
    reset: join(__dirname, 'reset.css'),
    home: join(__dirname, 'main.scss'),
    global: join(__dirname, 'global.js'),
  },
  output: {
    publicPath: '/',
    path: join(__dirname, 'dist'),
    filename: '[name]/[name].js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    ...pages.map(
      page =>
        new HtmlWebpackPlugin({
          chunks: [page.slug, 'global'],
          filename: page.slug + '/index.html',
          template: page.html,
          alwaysWriteToDisk: true,
        })
    ),
    new HtmlWebpackPlugin({
      template: join(__dirname, 'index.html'),
      filename: 'index.html',
      inject: true,
      pages,
      categories,
      chunks: ['home'],
      alwaysWriteToDisk: true,
    }),
    new HtmlWebpackHarddiskPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name]/[name].css',
    }),
    new FaviconsWebpackPlugin({
      logo: resolve(__dirname, './favicon.svg'),
    }),
  ],
  devServer: {
    contentBase: resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        },
      },
      {
        test: /\.(sc|c)ss$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|svg|jpe?g|gif|mp4)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: '/',
              name: '[path][name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.glsl$/,
        loader: 'webpack-glsl-loader',
      },
    ],
  },
};
