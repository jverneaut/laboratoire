import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const Model = ({ url, coords }) => {
  const { scene } = useGLTF(url);

  const points = useMemo(() => {
    const numPoints = 1200;
    const positions = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
      const randomSeed = Math.random() * Math.PI * 2;

      const x =
        -0.1 + Math.sin(randomSeed) * 0.3 + (Math.random() - 0.5) * 0.12;

      const z = 0.05 + Math.cos(randomSeed) * 0.3 + (Math.random() - 0.5) * 0.1;

      positions[i * 3] = x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5 + 0.074;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, []);

  return (
    <>
      <group
        position={[coords.position.x, coords.position.y, coords.position.z]}
        rotation={[coords.rotation.x, coords.rotation.y, coords.rotation.z]}
      >
        <primitive object={scene} />
      </group>

      <group
        position={[
          -0.1 * coords.position.y,
          0.2 * coords.position.z,
          -0.2 * coords.position.x,
        ]}
        rotation={[
          0.25 * coords.rotation.x + 0.125 * coords.rotation.y,
          0.125 * coords.rotation.y,
          0.25 * coords.rotation.z - 0.125 * coords.rotation.x,
        ]}
      >
        <points>
          <bufferGeometry>
            <bufferAttribute
              attachObject={['attributes', 'position']}
              count={points.length / 3}
              array={points}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="white"
            size={0.001}
            transparent
            opacity={0.6}
          />
        </points>
      </group>
    </>
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
