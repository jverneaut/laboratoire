import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const Model = ({ url, coords }) => {
  const { scene } = useGLTF(url);

  return (
    <group
      position={[coords.position.x, coords.position.y, coords.position.z]}
      rotation={[coords.rotation.x, coords.rotation.y, coords.rotation.z]}
    >
      <primitive object={scene} />
    </group>
  );
};

const FullscreenGLBViewer = ({ glbUrl, objectCoords: defaultCoords }) => {
  const [coords, setCoords] = useState(defaultCoords);

  useEffect(() => {
    const setData = (e) => {
      const { objectCoordinates } = e.detail;
      setCoords(objectCoordinates);
    };

    const container = document.querySelector('#root');
    container.addEventListener('coords', setData);

    return () => {
      container.removeEventListener('coords', setData);
    };
  }, [defaultCoords]);

  return (
    <>
      <Canvas
        camera={{
          position: [0, 0.085, 0.3],
          rotation: [0, 0, 0],
          fov: 50,
          near: 0.1,
          far: 10,
        }}
        style={{ width: '100vw', height: '100vh' }}
        dpr={window.devicePixelRatio}
      >
        <ambientLight intensity={0.4} />

        <directionalLight position={[0, 5, -5]} intensity={3} />
        <directionalLight position={[0, -3, 5]} intensity={1} />

        <spotLight
          position={[-5, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <spotLight
          position={[5, 5, -5]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
        />

        <Suspense fallback={null}>
          <Model coords={coords} url={glbUrl} />
        </Suspense>
      </Canvas>
    </>
  );
};

export default FullscreenGLBViewer;
