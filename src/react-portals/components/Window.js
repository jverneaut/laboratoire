import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const Window = ({ children }) => {
  const [container] = useState(document.createElement('div'));
  let externalWindow = null;

  useEffect(() => {
    externalWindow = window.open(
      '',
      '',
      'width=600,height=400,left=200,top=200'
    );

    externalWindow.document.body.appendChild(container);

    return () => {
      externalWindow.close();
      externalWindow = null;
    };
  }, []);

  return ReactDOM.createPortal(children, container);
};

export default Window;
