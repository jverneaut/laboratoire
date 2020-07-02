const HtmlWebpackPlugin = require('html-webpack-plugin');
const { join } = require('path');
const { lstatSync, readdirSync, readFileSync } = require('fs');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => join(source, name))
    .filter(isDirectory);

const pageDirectories = getDirectories(join(__dirname, '../src'));

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
    index: join(__dirname, '../app/index.js'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template:
        '!!prerender-loader?' +
        JSON.stringify({ string: true, params: { pages, categories } }) +
        '!app/index.html',
      filename: 'index.html',
      inject: true,
      chunks: ['index'],
      alwaysWriteToDisk: true,
    }),
  ],
};
