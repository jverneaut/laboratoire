import React, { useRef, useState } from 'react';
import * as THREE from 'three';

import Window from './Window';
import Preview from './Preview';
import Editor from './Editor';

const MatCapEditor = () => {
  const canvasRef = useRef();

  const [texture, setTexture] = useState(
    new THREE.CanvasTexture(canvasRef.current)
  );

  return (
    <div className="matcap-editor">
      <Window title="Preview" className="preview">
        <Preview texture={texture} />
      </Window>
      <Window title="Editor" className="editor">
        <Editor canvasRef={canvasRef} setTexture={setTexture} />
      </Window>
    </div>
  );
};

export default MatCapEditor;
