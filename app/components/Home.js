import React, { useState, useEffect } from 'react';

import Experiments from './Experiments';
import Filters from './Filters';
import Infos from './Infos';
import Newsletter from './Newsletter';

const title = document.querySelector('title').innerText;

const Home = ({ pages, categories }) => {
  useEffect(() => {
    document.title = title;
    document.body.classList.remove('iframe-container');
  }, []);

  const defaultFilterFunction = (a, b) => (a.date > b.date ? -1 : 1);

  const [filterFunction, setFilterFunction] = useState(
    () => (arr) => arr.sort(defaultFilterFunction)
  );

  const sortedPages = filterFunction(pages);

  return (
    <main>
      <div className="container">
        <h1>Le laboratoire – WebGL and JavaScript Experiments</h1>

        <Infos />

        <div className="paragraphs">
          <p>
            Ce site rassemble mes expérimentations frontend. Il contient des
            essais d'animations, des expériences avec WebGL, des essais d'api et
            bien d'autres choses.
          </p>
        </div>
        <a className="btn" href="https://github.com/jverneaut/laboratoire">
          Code Source
        </a>
        <Newsletter />

        <Filters
          defaultFilterFunction={defaultFilterFunction}
          setFilterFunction={setFilterFunction}
          categories={categories}
        />
        <Experiments pages={sortedPages} />
      </div>
    </main>
  );
};

export default Home;
