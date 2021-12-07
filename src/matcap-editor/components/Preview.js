import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Noise,
  Vignette,
} from '@react-three/postprocessing';

import suzanne from '../suzanne.obj';

const Model = ({ texture }) => {
  return (
    <mesh>
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
      {texture.image && (
        <meshMatcapMaterial matcap={texture} flatShading={false} />
      )}
    </mesh>
  );
};

const Preview = ({ texture }) => {
  return (
    <Canvas>
      <color attach="background" args={['black']} />
      <Suspense fallback={null}>
        <Model texture={texture} />
        <OrbitControls autoRotate={true} />
      </Suspense>
      <EffectComposer>
        {/* <DepthOfField
          focusDistance={0}
          focalLength={0.02}
          bokehScale={2}
          height={480}
        /> */}
        {/* <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} /> */}
        {/* <Noise opacity={0.25} /> */}
        {/* <Vignette eskil={false} offset={0.1} darkness={1.1} /> */}
      </EffectComposer>
    </Canvas>
  );
};

export default Preview;
