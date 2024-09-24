import React, { Suspense, useState, useRef } from 'react';
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
  showDisplacement,
  showDepthMap,
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
      uShowDisplacement: { value: showDisplacement },
      uShowDepthMap: { value: showDepthMap },
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

  const [showDisplacement, setShowDisplacement] = useState(false);
  const [showDepthMap, setShowDepthMap] = useState(false);

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
        gl={{ preserveDrawingBuffer: true }}
        ref={canvasRef}
      >
        <Suspense fallback={null}>
          <StereogramScene
            backgroundImage={backgroundImage}
            depthMapImage={depthMapImage}
            slices={slices}
            depth={depth}
            zoom={zoom}
            showDisplacement={showDisplacement}
            showDepthMap={showDepthMap}
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

        <div className="render-mode">
          <div className="render-mode__list">
            <button
              onClick={() => {
                setShowDepthMap(false);
                setShowDisplacement(false);
              }}
              className={[
                'render-mode__item',
                !showDepthMap && !showDisplacement
                  ? 'render-mode__item--active'
                  : null,
              ].join(' ')}
            >
              Autostereogram
            </button>
            <button
              onClick={() => {
                setShowDepthMap(true);
                setShowDisplacement(false);
              }}
              className={[
                'render-mode__item',
                showDepthMap && !showDisplacement
                  ? 'render-mode__item--active'
                  : null,
              ].join(' ')}
            >
              Depth map
            </button>
            <button
              onClick={() => {
                setShowDepthMap(false);
                setShowDisplacement(true);
              }}
              className={[
                'render-mode__item',
                !showDepthMap && showDisplacement
                  ? 'render-mode__item--active'
                  : null,
              ].join(' ')}
            >
              Displacement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stereogram;
