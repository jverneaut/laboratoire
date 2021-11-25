import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const Experiment = () => {
  useEffect(() => {
    document.body.classList.add('iframe-container');
  }, []);

  const history = useHistory();

  window.addEventListener('message', function (e) {
    if (e.data.type === 'title') {
      document.title = e.data.payload;
    }

    if (e.data.type === 'go-home') {
      history.push('/');
    }
  });

  return (
    <iframe
      src={`${location.pathname}/index-iframe.html`}
      allow="camera;microphone"
    ></iframe>
  );
};

export default Experiment;
