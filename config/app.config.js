const HtmlWebpackPlugin = require('html-webpack-plugin');
const { join, relative } = require('path');
const { lstatSync, readdirSync, readFileSync, existsSync } = require('fs');
const { getFirstCommitDateForFileSync } = require('./utils/repo');

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

const pages = pageDirectories.map(pageDirectory => {
  const slug = pageDirectory.split('/').reverse()[0];
  const html = join(pageDirectory, 'index.html');
  const js = join(pageDirectory, 'index.js');
  const name = getPageTitle(join(pageDirectory, 'index.html'));
  const category = getPageCategory(join(pageDirectory, 'index.html'));
  const screenshot = join(pageDirectory, 'screenshot.png');

  const page = { slug, html, js, name, category };
  if (existsSync(screenshot)) {
    page.screenshot = relative(__dirname, screenshot);
  }

  try {
    const date = getFirstCommitDateForFileSync(
      relative(join(__dirname, '..'), html)
    );
    page.date = date;
  } catch (err) {
    throw Error(err);
  }

  return page;
});

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
