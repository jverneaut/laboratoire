import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

import './main.scss';

if (document.querySelector('#root').childElementCount) {
  ReactDOM.render(
    <App pages={window.pages} categories={window.categories} />,
    document.querySelector('#root')
  );
}

export default ({ pages, categories }) => {
  const pagesWithScreenshot = pages.map(page =>
    page.screenshot
      ? {
          ...page,
          screenshot: require(`../src/${page.screenshot
            .replace('../src/', '')
            .replace('/screenshot.png', '')}/screenshot.png`).default,
        }
      : page
  );

  const script = document.createElement('script');
  script.innerHTML = `
    window.pages = ${JSON.stringify(pagesWithScreenshot)};
    window.categories = ${JSON.stringify(categories)};
  `;
  document.body.appendChild(script);

  return ReactDOM.render(
    <App pages={pagesWithScreenshot} categories={categories} />,
    document.querySelector('#root')
  );
};
