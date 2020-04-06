import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const Board = ({ board }) => {
  const mountRef = useRef();

  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();

  const boxesRefs = new Array(board[0].length * board.length)
    .fill(0)
    .map(() => useRef());

  const getColor = n => {
    switch (n) {
      case 1:
        // Yellow
        return 0xffde08;
      case 2:
        // Green
        return 0x22f550;
      case 3:
        // Blue
        return 0x1462db;
      case 4:
        // Red
        return 0xff1947;
      default:
        return 0x000000;
    }
  };

  // Setup scene and renderer
  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const fov = 75;
    const aspectRatio = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 10000;
    const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xf2f2f2);

    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.86);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.06, 0);
    pointLight.position.set(0, 4, 30);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 60;
    pointLight.shadow.bias = -0.0004;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    scene.add(pointLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.14);
    directionalLight.position.set(0, 10, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.bias = -0.008;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x27292b,
      side: THREE.DoubleSide,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.z = -7;
    floor.position.y = -12;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    const wallGeometry = new THREE.PlaneGeometry(40, 80);
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x27292b,
      side: THREE.DoubleSide,
      shadowSide: THREE.FrontSide,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.z = -5;
    wall.position.y = -12;
    scene.add(wall);

    camera.position.z = 18;
    renderer.render(scene, camera);
    mountRef.current.appendChild(renderer.domElement);
  }, [mountRef]);

  // Add boxes
  useEffect(() => {
    const scene = sceneRef.current;

    board.flat().forEach(col => {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshPhongMaterial({
        color: getColor(col.value),
        transparent: true,
        opacity: 0,
      });
      const cube = new THREE.Mesh(geometry, material);

      scene.add(cube);
      boxesRefs[col.index].current = cube;
    });
  }, [mountRef]);

  // Render
  const boardWidth = board[0].length;
  const boardHeight = board.length;

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    board.flat().forEach(cell => {
      const mesh = boxesRefs[cell.index].current;
      mesh.position.x = cell.col - (boardWidth - 1) / 2;
      mesh.position.y = (boardHeight - 1) / 2 - cell.row;
      mesh.castShadow = cell.value !== 0;
      mesh.receiveShadow = cell.value !== 0;

      const mat = mesh.material;
      mat.color = new THREE.Color(getColor(cell.value));
      mat.transparent = cell.value === 0;
      mat.opacity = cell.value === 0 ? 0 : 1;
    });

    renderer.render(scene, camera);
  }, [board]);

  return <div ref={mountRef}></div>;
};

export default Board;
