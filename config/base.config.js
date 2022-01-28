const webpack = require('webpack');
const { lstatSync, readdirSync, readFileSync, existsSync } = require('fs');
const { join, resolve, relative } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const { formatDistance } = require('date-fns');
const { fr } = require('date-fns/locale');

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) =>
  readdirSync(source)
    .map((name) => join(source, name))
    .filter(isDirectory);

const pageDirectories = getDirectories(join(__dirname, '../src'));

const getPageTitle = (path) => {
  const html = readFileSync(path, 'utf8');
  return html
    .match(/<title>(.*?)<\/title>/g)[0]
    .replace('<title>', '')
    .replace('</title>', '');
};

const getPageCategory = (path) => {
  const html = readFileSync(path, 'utf8');
  return html
    .match(/<meta name="category" content="(.*?)" \/>/g)[0]
    .replace('<meta name="category" content="', '')
    .replace('" />', '');
};

const getPageDate = (path) => {
  const html = readFileSync(path, 'utf8');
  const dateMatch = html.match(/<meta name="date" content="(.*?)" \/>/g);
  if (!dateMatch) return Date.now();

  return parseInt(
    dateMatch[0]
      .replace('<meta name="date" content="', '')
      .replace('" />', '')
      .padEnd(13, 0)
  );
};

const pages = pageDirectories
  .filter((dir) =>
    process.env.NODE_ENV === 'production'
      ? dir.split('/').reverse()[0].charAt(0) !== '_'
      : true
  )
  .map((pageDirectory) => {
    const slug = pageDirectory.split('/').reverse()[0];
    const html = join(pageDirectory, 'index.html');
    const js = join(pageDirectory, 'index.js');
    const name = getPageTitle(join(pageDirectory, 'index.html'));
    const category = getPageCategory(join(pageDirectory, 'index.html'));
    const screenshot = join(pageDirectory, 'screenshot.png');
    const date = getPageDate(join(pageDirectory, 'index.html')) || 'TROLOLO';
    const dateDisplay = capitalize(
      formatDistance(new Date(date), Date.now(), {
        addSuffix: true,
        locale: fr,
      })
    );

    const page = { slug, html, js, name, category, date, dateDisplay };
    if (existsSync(screenshot)) {
      page.screenshot = relative(__dirname, screenshot);
    }

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
    new GenerateJsonPlugin(
      'api.json',
      pages.map((page) => ({
        date: page.date,
        dateDisplay: page.dateDisplay,
        name: page.name,
        category: page.category,
        url: `https://lab.julienverneaut.com/${page.slug}`,
        cover: `https://lab.julienverneaut.com/${page.slug}/screenshot.png`,
      }))
    ),
  ],
  devServer: {
    contentBase: resolve(__dirname, 'dist'),
    publicPath: '/',
    writeToDisk: true,
  },
  devtool: 'eval-cheap-source-map',
};
