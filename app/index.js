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
  const script = document.createElement('script');
  script.innerHTML = `
    window.pages = ${JSON.stringify(pages)};
    window.categories = ${JSON.stringify(categories)};
  `;
  document.body.appendChild(script);

  return ReactDOM.render(
    <App pages={pages} categories={categories} />,
    document.querySelector('#root')
  );
};
