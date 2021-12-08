import React, { useState } from 'react';

import Editor from './Editor';
import Preview from './Preview';
import Window from './Window';

const MatCapEditor = () => {
  const [texture, setTexture] = useState({ image: null });

  return (
    <>
      <div className="container">
        <Window title="Preview" className="window-preview">
          <Preview texture={texture} />
        </Window>
        <Window title="Editor" className="window-editor">
          <Editor setTexture={setTexture} />
        </Window>
      </div>
    </>
  );
};

export default MatCapEditor;
