import React, { useState } from 'react';

import Window from './Window';

const App = () => {
  const [counter, setCounter] = useState(0);
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  const incrementCounter = () => setCounter(counter => counter + 1);
  const decrementCounter = () => setCounter(counter => counter - 1);

  const openWindow = () => setIsWindowOpen(true);
  const closeWindow = () => setIsWindowOpen(false);

  return (
    <div className="container py-5">
      <h1>React Portals</h1>
      {isWindowOpen ? (
        <button className="btn btn-danger" onClick={closeWindow}>
          Fermer la fenêtre
        </button>
      ) : (
        <button className="btn btn-primary" onClick={openWindow}>
          Ouvrir la fenêtre
        </button>
      )}
      <div className="mt-4">
        <button className="btn btn-light" onClick={incrementCounter}>
          Incrémenter
        </button>
        <button className="btn btn-light" onClick={decrementCounter}>
          Décrémenter
        </button>
      </div>

      {isWindowOpen && (
        <Window>
          <h2>Je suis dans un portail</h2>
          <p>Counter: {counter}</p>
        </Window>
      )}
    </div>
  );
};

export default App;
