import React, { useRef, useState, useEffect } from 'react';
import Board from './Board';

import useInterval from '../utils/useInterval';
import * as boardUtils from '../utils/board';

const BOARD_WIDTH = 16;
const BOARD_HEIGHT = 24;

const App = () => {
  const initialBoard = boardUtils.createBoard(BOARD_WIDTH, BOARD_HEIGHT);
  const [board, setBoard] = useState(initialBoard);

  // Add first piece
  useEffect(() => {
    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard));
      const setCurrentValue = (y, x, value, current = false) => {
        newBoard[y][x] = {
          ...newBoard[y][x],
          current,
          value,
        };
      };

      // S shape
      setCurrentValue(0, 4, 1, true);
      setCurrentValue(1, 4, 1, true);
      setCurrentValue(1, 5, 1, true);
      setCurrentValue(2, 5, 1, true);

      // Line
      new Array(BOARD_WIDTH - 2).fill(0).forEach((_, index) => {
        setCurrentValue(BOARD_HEIGHT - 1, index, 4, false);
      });

      // Square
      setCurrentValue(BOARD_HEIGHT - 3, 1, 2, false);
      setCurrentValue(BOARD_HEIGHT - 3, 2, 2, false);
      setCurrentValue(BOARD_HEIGHT - 2, 1, 2, false);
      setCurrentValue(BOARD_HEIGHT - 2, 2, 2, false);

      // L
      setCurrentValue(BOARD_HEIGHT - 4, 3, 3, false);
      setCurrentValue(BOARD_HEIGHT - 3, 3, 3, false);
      setCurrentValue(BOARD_HEIGHT - 2, 3, 3, false);
      setCurrentValue(BOARD_HEIGHT - 2, 4, 3, false);

      // Dot
      setCurrentValue(BOARD_HEIGHT - 1, BOARD_WIDTH - 1, 1, false);

      return newBoard;
    });
  }, []);

  // Tick
  const [tick, setTick] = useState(0);
  useInterval(() => {
    setTick(tick + 1);
  }, 400);

  // Getters
  const [canMoveDown, setCanMoveDown] = useState(null);
  const [canMoveLeft, setCanMoveLeft] = useState(null);
  const [canMoveRight, setCanMoveRight] = useState(null);

  useEffect(() => {
    setCanMoveDown(boardUtils.canMoveDown(board));
    setCanMoveLeft(boardUtils.canMoveLeft(board));
    setCanMoveRight(boardUtils.canMoveRight(board));
  }, [board, tick]);

  // Operators
  const moveDown = () => {
    setBoard(prevBoard => boardUtils.moveDown(prevBoard));
  };
  const moveLeft = () => {
    setBoard(prevBoard => boardUtils.moveLeft(prevBoard));
  };
  const moveRight = () => {
    setBoard(prevBoard => boardUtils.moveRight(prevBoard));
  };

  const removeFullRows = () => {
    setBoard(prevBoard => boardUtils.removeFullRows(prevBoard));
  };

  const addNewShape = () => {
    setBoard(prevBoard => boardUtils.addNewShape(prevBoard));
  };

  const rotateShape = () => {
    setBoard(prevBoard => boardUtils.rotateShape(prevBoard));
  };

  // Game Loop
  useEffect(() => {
    removeFullRows();
    if (typeof canMoveDown === 'boolean') {
      if (canMoveDown) {
        moveDown();
      } else {
        setBoard(prevBoard => boardUtils.stickBoard(prevBoard));
        addNewShape();
      }
    }
  }, [tick]);

  // Controls
  const [direction, setDirection] = useState([0, 0]);

  useEffect(() => {
    document.addEventListener('keydown', e => {
      switch (e.code) {
        case 'ArrowUp':
          return setDirection([0, 1]);
        case 'ArrowDown':
          return setDirection([0, -1]);
        case 'ArrowLeft':
          return setDirection([-1, 0]);
        case 'ArrowRight':
          return setDirection([1, 0]);
        default:
          return;
      }
    });
  }, []);

  const lastDirection = useRef(direction);
  useEffect(() => {
    if (
      direction[0] === lastDirection.current[0] &&
      direction[1] === lastDirection.current[1]
    ) {
      return;
    }

    if (direction[0] === -1 && canMoveLeft) moveLeft();
    if (direction[0] === 1 && canMoveRight) moveRight();
    if (direction[1] === -1 && canMoveDown) moveDown();
    if (direction[1] === 1) rotateShape();

    setDirection([0, 0]);
    lastDirection.current = [0, 0];
  }, [direction]);

  return (
    <>
      <Board board={board} />
    </>
  );
};

export default App;
