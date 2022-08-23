const pages = require('./pages');
const fm = require('front-matter');
const fs = require('fs');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();

module.exports = function(content) {
  const data = pages.map(page => {
    const content = fs.readFileSync(page.markdownPath, 'utf-8');
    const frontMatter = fm(content);

    return {
      ...page,
      data: frontMatter.attributes,
      content: md.render(frontMatter.body),
    };
  });

  const isPage = this.resourcePath.indexOf('/pages/') > -1;

  if (isPage) {
    const page = data.find(el => el.twigPath === this.resourcePath);

    this.addDependency(page.markdownPath);

    const level = this.resourcePath.split('/pages/')[1].split('/').length;

    return `
      {% set page = ${JSON.stringify(page)} %}
      {% set pages = ${JSON.stringify(data)} %}

      {% extends '${'../'.repeat(level)}templates/base.twig' %}
      {% block content %}
        ${content}
      {% endblock %}
    `;
  }

  return content;
};
