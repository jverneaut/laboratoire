import './main.scss';

import React, { Suspense, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { EdgesGeometry } from 'three';

import model from './drill.stl';

function Model({ url }) {
  const geometry = useLoader(STLLoader, url);

  return (
    <group>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="lightsteelblue"
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <lineSegments
        geometry={new EdgesGeometry(geometry)}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <lineBasicMaterial color="white" toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function Scene({ file }) {
  const controls = useRef();

  return (
    <Suspense fallback={<div>Loading 3D Model...</div>}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={window.devicePixelRatio}
        antialias
      >
        <Stage intensity={0.5} environment="warehouse">
          {file && <Model url={file} />}
        </Stage>

        <OrbitControls ref={controls} enableZoom={true} />
      </Canvas>
    </Suspense>
  );
}

export default function App() {
  const [file, setFile] = useState(model);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const stlFile = Array.from(droppedFiles).find((file) =>
        file.name.endsWith('.stl')
      );
      if (stlFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const blobURL = URL.createObjectURL(new Blob([e.target.result]));
          setFile(blobURL);
        };
        reader.readAsArrayBuffer(stlFile);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        opacity: dragOver ? 0.5 : 1,
        transition: 'opacity 0.3s',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'system-ui',
        }}
      >
        Drop your STL file to preview
      </div>

      <Scene file={file} />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
