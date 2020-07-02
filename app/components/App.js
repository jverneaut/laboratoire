import React from 'react';

const App = ({ pages, categories }) => (
  <div className="container">
    <h1>
      Le
      <br />
      laboratoire
    </h1>
    <div className="paragraphs">
      <p>
        Ce site rassemble mes expérimentations frontend. Il contient des essais
        d'animations, des expériences avec WebGL, des essais d'api et bien
        d'autres choses.
      </p>

      <p>
        La version précédente est disponible{' '}
        <a href="https://fervent-allen-3654dd.netlify.com/">à cette url</a>.
      </p>
    </div>
    <a className="btn" href="https://github.com/jverneaut/laboratoire">
      Code Source
    </a>
    <div className="categories">
      {categories.map(category => (
        <div key={category} className="category">
          <h2>{category}</h2>
          <ul>
            {pages
              .filter(page => page.category === category)
              .map(page => (
                <li key={page.slug}>
                  <a href={`/${page.slug}`}>{page.name}</a>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

export default App;
