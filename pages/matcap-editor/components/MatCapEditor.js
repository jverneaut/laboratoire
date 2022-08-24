import React, { useState } from 'react';

import Editor from './Editor';
import Preview from './Preview';
import Window from './Window';

const MatCapEditor = () => {
  const [texture, setTexture] = useState({ image: null });
  const [topWindow, setTopWindow] = useState('');

  return (
    <>
      <div className="container">
        <Window
          title="Preview"
          className="window-preview"
          topWindow={topWindow}
          setTopWindow={setTopWindow}
        >
          <Preview texture={texture} />
        </Window>
        <Window
          title="Editor"
          className="window-editor"
          topWindow={topWindow}
          setTopWindow={setTopWindow}
        >
          <Editor setTexture={setTexture} />
        </Window>
      </div>
    </>
  );
};

export default MatCapEditor;
