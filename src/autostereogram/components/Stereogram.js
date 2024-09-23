import React, { Suspense, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { ShaderMaterial, RepeatWrapping, NearestFilter } from 'three';

import fragmentShaderSource from '../shaders/fragment.glsl';
import vertexShaderSource from '../shaders/vertex.glsl';

import fullScreenIcon from '../assets/icons/fullscreen.svg';

const StereogramScene = ({
  backgroundImage,
  depthMapImage,
  slices,
  depth,
  zoom,
}) => {
  const backgroundTexture = useTexture(backgroundImage.src);
  backgroundTexture.wrapS = RepeatWrapping;
  backgroundTexture.wrapT = RepeatWrapping;
  backgroundTexture.magFilter = NearestFilter;
  backgroundTexture.minFilter = NearestFilter;

  const depthMapTexture = useTexture(depthMapImage.src);
  depthMapTexture.magFilter = NearestFilter;
  depthMapTexture.minFilter = NearestFilter;

  const { gl, size } = useThree();
  gl.setPixelRatio(window.devicePixelRatio);

  const shaderMaterial = new ShaderMaterial({
    uniforms: {
      tBackground: { value: backgroundTexture },
      tDepthMap: { value: depthMapTexture },
      uSlices: { value: slices },
      uResolution: { value: [size.width, size.height] },
      uBackgroundAspectRatio: {
        value: backgroundImage.width / backgroundImage.height,
      },
      uDepthMapAspectRatio: {
        value: depthMapImage.width / depthMapImage.height,
      },
      uDepth: { value: depth },
      uZoom: { value: zoom },
    },
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
  });

  return (
    <mesh material={shaderMaterial}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
};

const Stereogram = ({
  backgroundImage,
  depthMapImage,
  slices,
  depth,
  zoom,
}) => {
  const canvasRef = useRef();

  return (
    <div className="stereogram">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        orthographic
        style={{
          width: 'auto',
          height: '100%',
          aspectRatio: '16/9',
          margin: '0 auto',
        }}
        ref={canvasRef}
      >
        <Suspense fallback={null}>
          <StereogramScene
            backgroundImage={backgroundImage}
            depthMapImage={depthMapImage}
            slices={slices}
            depth={depth}
            zoom={zoom}
          />
        </Suspense>
      </Canvas>
      <div className="overlay">
        <div
          onClick={() => {
            canvasRef.current.requestFullscreen();
          }}
          className="fullscreen-button"
        >
          <img src={fullScreenIcon} alt="" />
        </div>
      </div>
    </div>
  );
};

export default Stereogram;
