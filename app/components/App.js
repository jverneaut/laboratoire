import React from 'react';
import Experiments from './Experiments';

const App = ({ pages, categories }) => (
  <div className="container">
    <h1>Le laboratoire</h1>
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

    <Experiments pages={pages} />
  </div>
);

export default App;
