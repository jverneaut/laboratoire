const path = require('path');
const glob = require('glob');

const baseDirectory = path.join(__dirname, '../src/pages');

const pages = glob.sync(`${baseDirectory}/**/index.twig`).map(pagePath => {
  const location = pagePath
    .split(`${baseDirectory}`)[1]
    .replace('index.twig', '');

  return {
    markdownPath: baseDirectory + location + 'index.md',
    twigPath: baseDirectory + location + 'index.twig',
    cssPath: baseDirectory + location + 'index.scss',
    jsPath: baseDirectory + location + 'index.js',
    filename: location.slice(1) + 'index.html',
    slug: location.slice(1, -1),
  };
});

module.exports = pages;
