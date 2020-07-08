import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';

import socialImg from './../social.png';

import Home from './Home';
import Experiment from './Experiment';
import Loader from './Loader';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

const HomePlaceholder = ({ setLoaded }) => {
  useEffect(() => {
    setLoaded(false);
  }, []);

  return null;
};

const App = ({ pages, categories }) => {
  const [loaded, setLoaded] = useState(false);

  const onMessage = e => {
    if (e.data.type === 'loaded') {
      if (window.location.pathname !== '/') {
        setLoaded(true);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  });

  return (
    <Router>
      <Helmet>
        <meta name="twitter:title" content="Le laboratoire" />
        <meta
          name="twitter:image"
          content={'https://lab.julienverneaut.com' + socialImg}
        />
        <meta property="og:url" content="https://lab.julienverneaut.com" />
        <meta property="og:title" content="Le laboratoire" />
        <meta
          property="og:description"
          content="Ce site rassemble mes expérimentations frontend. Il contient des essais d'animations, des expériences avec WebGL, des essais d'api et bien d'autres choses."
        />
        <meta property="og:image:type" content="image/png" />
        <meta
          property="og:image"
          content={'https://lab.julienverneaut.com' + socialImg}
        />
        <meta
          property="og:image:url"
          content={'https://lab.julienverneaut.com' + socialImg}
        />
        <meta
          property="og:image:secure_url"
          content={'https://lab.julienverneaut.com' + socialImg}
        />
      </Helmet>
      <Switch>
        <Route path="/" exact>
          {null}
        </Route>
        <Route path="/*">
          <Loader loaded={loaded} />
        </Route>
      </Switch>
      <div style={{ opacity: loaded ? 1 : 0 }}>
        <Switch>
          <Route path="/" exact>
            <HomePlaceholder setLoaded={setLoaded} />
          </Route>
          <Route path="/*">
            <Experiment setLoaded={setLoaded} />
          </Route>
        </Switch>
      </div>
      {loaded ? null : <Home pages={pages} categories={categories} />}
    </Router>
  );
};

export default App;
