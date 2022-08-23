import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import suzanne from '../assets/models/suzanne.obj';

const Model = ({ texture }) => {
  return (
    <mesh scale={1.5}>
      <bufferGeometry>
        <bufferAttribute
          attachObject={['attributes', 'position']}
          array={new Float32Array(suzanne.vertices)}
          itemSize={3}
          count={suzanne.vertices.length / 3}
        />
        <bufferAttribute
          attachObject={['attributes', 'normal']}
          array={new Float32Array(suzanne.vertexNormals)}
          itemSize={3}
          count={suzanne.vertexNormals.length / 3}
        />
        <bufferAttribute
          attach={'index'}
          array={new Uint16Array(suzanne.indices)}
          itemSize={1}
          count={suzanne.indices.length}
        />
      </bufferGeometry>
      {texture.image && <meshMatcapMaterial matcap={texture} />}
    </mesh>
  );
};

const Preview = ({ texture }) => {
  return (
    <>
      <Canvas>
        <Suspense fallback={null}>
          <Model texture={texture} />
          <OrbitControls autoRotate={true} />
        </Suspense>
      </Canvas>
    </>
  );
};

export default Preview;
