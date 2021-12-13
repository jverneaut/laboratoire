const { lstatSync, readdirSync, readFileSync } = require('fs');
const { join } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TitleSuffixHtmlWebpackPlugin = require('./TitleSuffixHtmlWebpackPlugin');

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

const pages = pageDirectories.map((pageDirectory) => {
  const slug = pageDirectory.split('/').reverse()[0];
  const html = join(pageDirectory, 'index.html');
  const js = join(pageDirectory, 'index.js');
  const name = getPageTitle(join(pageDirectory, 'index.html'));
  const category = getPageCategory(join(pageDirectory, 'index.html'));

  const page = { slug, html, js, name, category };

  return page;
});

module.exports = {
  entry: {
    ...pages
      .map((page) => ({
        [page.slug]: page.js,
      }))
      .reduce(
        (acc, curr) => ({
          ...acc,
          ...curr,
        }),
        {}
      ),
  },
  plugins: [
    new TitleSuffixHtmlWebpackPlugin(),
    ...pages.map((page) => {
      const headContent = `
        <meta name="twitter:card" content="summary" />
        <meta property="og:url" content="https://lab.julienverneaut.com/${page.slug}" />
        <meta property="og:title" content="${page.name}" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="Ce site rassemble mes expérimentations frontend. Il contient des essais d'animations, des expériences avec WebGL, des essais d'api et bien d'autres choses." />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image" content="https://lab.julienverneaut.com/${page.slug}/screenshot.png" />
        <meta property="og:image:url" content="https://lab.julienverneaut.com/${page.slug}/screenshot.png" />
        <meta property="og:image:secure_url" content="https://lab.julienverneaut.com/${page.slug}/screenshot.png" />
        <script defer data-domain="lab.julienverneaut.com" src="https://plausible.io/js/plausible.js"></script>
      `;

      return new HtmlWebpackPlugin({
        chunks: [page.slug, 'global'],
        filename: page.slug + '/index.html',
        headContent: headContent,
        template: page.html,
        alwaysWriteToDisk: true,
      });
    }),
    ...pages.map((page) => {
      return new HtmlWebpackPlugin({
        chunks: [page.slug, 'global'],
        filename: page.slug + '/index-iframe.html',
        template: page.html,
        alwaysWriteToDisk: true,
      });
    }),
  ],
};
