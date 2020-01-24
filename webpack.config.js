const { lstatSync, readdirSync, readFileSync } = require('fs');
const { join, resolve } = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => join(source, name))
    .filter(isDirectory);

const pageDirectories = getDirectories(__dirname).filter(
  dirpath =>
    !['dist', 'node_modules', '.vscode'].includes(
      dirpath.split('/').reverse()[0]
    )
);

const getPageTitle = path => {
  const html = readFileSync(path, 'utf8');
  return html
    .match(/<title>(.*?)<\/title>/g)[0]
    .replace('<title>', '')
    .replace('</title>', '');
};

const pages = pageDirectories.map(pageDirectory => ({
  slug: pageDirectory.split('/').reverse()[0],
  html: join(pageDirectory, 'index.html'),
  js: join(pageDirectory, 'index.js'),
  name: getPageTitle(join(pageDirectory, 'index.html')),
}));

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
  },
  output: {
    path: join(__dirname, 'dist'),
    filename: 'dist/[name]/bundle.js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    ...pages.map(
      page =>
        new HtmlWebpackPlugin({
          chunks: [page.slug, 'reset'],
          filename: 'dist/' + page.slug + '/index.html',
          template: page.html,
          alwaysWriteToDisk: true,
        })
    ),
    new HtmlWebpackPlugin({
      template: join(__dirname, 'index.html'),
      filename: 'dist/index.html',
      inject: true,
      pages,
      chunks: ['reset'],
      alwaysWriteToDisk: true,
    }),
    new HtmlWebpackHarddiskPlugin(),
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
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(sc|c)ss$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
      },
    ],
  },
};
