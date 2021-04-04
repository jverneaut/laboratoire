const { lstatSync, readdirSync, readFileSync } = require('fs');
const { join } = require('path');
const prompts = require('prompts');
const path = require('path');
const shell = require('shelljs');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => join(source, name))
    .filter(isDirectory);

const pageDirectories = getDirectories(join(__dirname, '../src')).filter(dir =>
  process.env.NODE_ENV === 'production'
    ? dir
        .split('/')
        .reverse()[0]
        .charAt(0) !== '_'
    : true
);

const getPageCategory = path => {
  const html = readFileSync(path, 'utf8');
  return html
    .match(/<meta name="category" content="(.*?)" \/>/g)[0]
    .replace('<meta name="category" content="', '')
    .replace('" />', '');
};

const pageCategories = pageDirectories
  .map(pageDirectory => getPageCategory(join(pageDirectory, 'index.html')))
  .reduce((acc, curr) => {
    if (acc.includes(curr)) return acc;
    return [...acc, curr];
  }, []);

(async () => {
  const projectTitle = await prompts({
    type: 'text',
    name: 'value',
    message: 'Project title',
  });

  const projectSlug = await prompts({
    type: 'text',
    name: 'value',
    message: 'Project slug',
  });

  let projectCategory = await prompts({
    type: 'select',
    name: 'value',
    message: 'Project category',
    choices: [
      ...pageCategories.map(category => ({
        title: category,
        value: category,
      })),
      {
        title: '+ New category',
        value: false,
      },
    ],
  });

  if (!projectCategory.value) {
    projectCategory = await prompts({
      type: 'text',
      name: 'value',
      message: 'New category name',
    });
  }

  const projectPath = 'src/' + projectSlug.value;

  shell.cp('-R', path.resolve('cli/templates'), path.resolve(projectPath));
  shell.cd(projectPath);

  shell.ls().forEach(file => {
    shell.sed('-i', 'DATE', Date.now(), file);
    shell.sed('-i', 'TITLE', projectTitle.value, file);
    shell.sed('-i', 'CATEGORY', projectCategory.value, file);
  });
})();
