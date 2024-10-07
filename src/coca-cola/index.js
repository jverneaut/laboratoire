import './main.scss';

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import Lenis from 'lenis';
import gsap, { Quad } from 'gsap';
import { ScrollTrigger } from 'gsap/all';

import Viewer from './Viewer';

import model from './assets/models/coke.glb';

gsap.registerPlugin(ScrollTrigger);

const defaultCoordinates = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
};

const objectCoordinates = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
};

const mouse = { x: 0, y: 0 };
const mouseTarget = { x: 0.5 * window.innerWidth, y: 0.5 * window.innerHeight };

const addedRotation = {
  x: 0,
  y: 0,
  z: 0,
};

const addedPosition = {
  x: 0,
  y: 0,
  z: 0,
};

const lenis = new Lenis({
  smooth: true,
  touchMultiplier: 1,
  wheelMultiplier: 0.5,
});

const sections = document.querySelectorAll('.section');
sections.forEach((section, index) => {
  ScrollTrigger.create({
    trigger: section,
    start: index === 0 ? 'center center' : 'top center',
    end: index === sections.length - 1 ? 'center center' : 'bottom center',
    // markers: true,
    scrub: 1,
    onUpdate: (self) => {
      const rawProgress = self.progress;

      const progress = Quad.easeInOut(rawProgress);

      const currentRotationX =
        (index === 0
          ? defaultCoordinates.rotation.x
          : parseFloat(sections[index - 1].dataset.rotationX)) ||
        defaultCoordinates.rotation.x;

      const currentRotationY =
        (index === 0
          ? defaultCoordinates.rotation.y
          : parseFloat(sections[index - 1].dataset.rotationY)) ||
        defaultCoordinates.rotation.y;
      const currentRotationZ =
        (index === 0
          ? defaultCoordinates.rotation.z
          : parseFloat(sections[index - 1].dataset.rotationZ)) ||
        defaultCoordinates.rotation.z;

      const nextRotationX =
        parseFloat(section.dataset.rotationX) || defaultCoordinates.rotation.x;
      const nextRotationY =
        parseFloat(section.dataset.rotationY) || defaultCoordinates.rotation.y;
      const nextRotationZ =
        parseFloat(section.dataset.rotationZ) || defaultCoordinates.rotation.z;

      gsap.to(objectCoordinates.rotation, {
        x: gsap.utils.interpolate(currentRotationX, nextRotationX, progress),
        y: gsap.utils.interpolate(currentRotationY, nextRotationY, progress),
        z: gsap.utils.interpolate(currentRotationZ, nextRotationZ, progress),
        duration: 0,
      });

      const currentPositionX =
        (index === 0
          ? defaultCoordinates.position.x
          : parseFloat(sections[index - 1].dataset.positionX)) ||
        defaultCoordinates.position.x;

      const currentPositionY =
        (index === 0
          ? defaultCoordinates.position.y
          : parseFloat(sections[index - 1].dataset.positionY)) ||
        defaultCoordinates.position.y;
      const currentPositionZ =
        (index === 0
          ? defaultCoordinates.position.z
          : parseFloat(sections[index - 1].dataset.positionZ)) ||
        defaultCoordinates.position.z;

      const nextPositionX =
        parseFloat(section.dataset.positionX) || defaultCoordinates.position.x;
      const nextPositionY =
        parseFloat(section.dataset.positionY) || defaultCoordinates.position.y;
      const nextPositionZ =
        parseFloat(section.dataset.positionZ) || defaultCoordinates.position.z;

      const responsiveFactor = window.innerWidth < 800 ? 0.5 : 1;

      gsap.to(objectCoordinates.position, {
        x:
          responsiveFactor *
          gsap.utils.interpolate(currentPositionX, nextPositionX, progress),
        y: gsap.utils.interpolate(currentPositionY, nextPositionY, progress),
        z: gsap.utils.interpolate(currentPositionZ, nextPositionZ, progress),
        duration: 0,
      });
    },
  });
});

const raf = (time) => {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);

  mouse.x += (mouseTarget.x - mouse.x) * 0.02;
  mouse.y += (mouseTarget.y - mouse.y) * 0.02;

  addedPosition.y = 0.006 * Math.sin(0.0006 * time);

  addedRotation.y += 0.001;
  addedRotation.z =
    0.1 * (0.5 - Math.sin(0.0002 * time)) +
    0.05 * (0.5 - Math.sin(0.00034 * time));

  const event = new CustomEvent('coords', {
    detail: {
      objectCoordinates: {
        ...objectCoordinates,
        position: {
          ...objectCoordinates.position,
          x:
            0.00001 * (mouse.x - 0.5 * window.innerWidth) +
            objectCoordinates.position.x,
          y:
            0.00001 * (mouse.y - 0.5 * window.innerHeight) +
            objectCoordinates.position.y +
            addedPosition.y,
        },
        rotation: {
          ...objectCoordinates.rotation,
          y:
            -0.0015 * (mouse.x - 0.5 * window.innerWidth) +
            objectCoordinates.rotation.y +
            addedRotation.y,
          x:
            -0.0015 * (mouse.y - 0.5 * window.innerHeight) +
            objectCoordinates.rotation.x +
            addedRotation.x,
          z: objectCoordinates.rotation.z + addedRotation.z,
        },
      },
    },
  });

  container.dispatchEvent(event);
};

requestAnimationFrame(raf);

window.addEventListener('mousemove', (e) => {
  mouseTarget.x = e.clientX;
  mouseTarget.y = e.clientY;
});

const container = document.querySelector('#root');
ReactDOM.render(
  <Suspense fallback={null}>
    <Viewer glbUrl={model} objectCoords={defaultCoordinates} />
  </Suspense>,
  container
);
