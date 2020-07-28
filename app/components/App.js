import React, { useEffect, useState } from 'react';

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
