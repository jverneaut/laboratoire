export const createBoard = (width, height) => {
  return new Array(height)
    .fill(
      new Array(width).fill({
        value: 0,
        current: false,
      })
    )
    .map((row, rowIndex) =>
      row.map((col, colIndex) => ({
        ...col,
        row: rowIndex,
        col: colIndex,
        index: colIndex + rowIndex * width,
      }))
    );
};

// Run condition against each current cells,
// Return false if one or more conditions returns false
const testCurrentCells = (board, condition) => {
  return board.flat().reduce((acc, curr) => {
    if (acc === false) return false;

    if (curr.current) return condition(curr, board);

    return true;
  }, true);
};

export const canMoveDown = board => {
  return testCurrentCells(board, (curr, board) => {
    const isBottom = curr.row === board.length - 1;
    if (isBottom) return false;

    const isBottomFilled = board[curr.row + 1][curr.col].value !== 0;
    const isBottomCurrent = board[curr.row + 1][curr.col].current;
    if (isBottomFilled && !isBottomCurrent) return false;

    return true;
  });
};

export const canMoveLeft = board => {
  return testCurrentCells(board, (curr, board) => {
    const isWall = curr.col === 0;
    if (isWall) return false;

    const isLeftFilled = board[curr.row][curr.col - 1].value !== 0;
    const isLeftCurrent = board[curr.row][curr.col - 1].current;
    if (isLeftFilled && !isLeftCurrent) return false;

    return true;
  });
};

export const canMoveRight = board => {
  const boardWidth = board[0].length;
  return testCurrentCells(board, (curr, board) => {
    const isWall = curr.col === boardWidth - 1;
    if (isWall) return false;

    const isRightFilled = board[curr.row][curr.col + 1].value !== 0;
    const isRightCurrent = board[curr.row][curr.col + 1].current;
    if (isRightFilled && !isRightCurrent) return false;

    return true;
  });
};

export const moveDown = board => {
  const newBoard = JSON.parse(JSON.stringify(board));

  const boardWidth = board[0].length;
  const boardHeight = board.length;

  for (let rowIndex = boardHeight - 1; rowIndex >= 0; rowIndex--) {
    for (let colIndex = 0; colIndex < boardWidth; colIndex++) {
      if (board[rowIndex][colIndex].current) {
        newBoard[rowIndex + 1][colIndex] = {
          ...newBoard[rowIndex + 1][colIndex],
          current: true,
          value: board[rowIndex][colIndex].value,
        };
        newBoard[rowIndex][colIndex] = {
          ...newBoard[rowIndex][colIndex],
          current: false,
          value: 0,
        };
      }
    }
  }

  return newBoard;
};

export const moveLeft = board => {
  const newBoard = JSON.parse(JSON.stringify(board));

  const boardWidth = board[0].length;
  const boardHeight = board.length;

  for (let colIndex = 1; colIndex <= boardWidth - 1; colIndex++) {
    for (let rowIndex = 0; rowIndex < boardHeight; rowIndex++) {
      if (board[rowIndex][colIndex].current) {
        newBoard[rowIndex][colIndex - 1] = {
          ...newBoard[rowIndex][colIndex - 1],
          current: true,
          value: board[rowIndex][colIndex].value,
        };
        newBoard[rowIndex][colIndex] = {
          ...newBoard[rowIndex][colIndex],
          current: false,
          value: 0,
        };
      }
    }
  }
  return newBoard;
};

export const moveRight = board => {
  const newBoard = JSON.parse(JSON.stringify(board));

  const boardWidth = board[0].length;
  const boardHeight = board.length;

  for (let colIndex = boardWidth - 1; colIndex >= 0; colIndex--) {
    for (let rowIndex = 0; rowIndex < boardHeight; rowIndex++) {
      if (board[rowIndex][colIndex].current) {
        newBoard[rowIndex][colIndex + 1] = {
          ...newBoard[rowIndex][colIndex + 1],
          current: true,
          value: board[rowIndex][colIndex].value,
        };
        newBoard[rowIndex][colIndex] = {
          ...newBoard[rowIndex][colIndex],
          current: false,
          value: 0,
        };
      }
    }
  }
  return newBoard;
};

export const stickBoard = board => {
  return board.map(row =>
    row.map(col => ({
      ...col,
      current: false,
    }))
  );
};

export const removeFullRows = board => {
  const isFullRow = row => row.filter(col => col.value === 0).length === 0;

  const width = board[0].length;
  const height = board.length;

  const emptyBoard = createBoard(width, height);
  const boardWithoutFullRows = board.filter(row => !isFullRow(row));

  const newBoard = [
    ...emptyBoard.slice(0, height - boardWithoutFullRows.length),
    ...boardWithoutFullRows.slice(height - emptyBoard.length, height),
  ].map((row, rowIndex) =>
    row.map((col, colIndex) => ({
      ...col,
      row: rowIndex,
      col: colIndex,
      index: colIndex + rowIndex * width,
    }))
  );

  return newBoard;
};

export const addNewShape = board => {
  const newBoard = JSON.parse(JSON.stringify(board));

  const setCurrentValue = (y, x, value, current = false) => {
    newBoard[y][x] = {
      ...newBoard[y][x],
      current,
      value,
    };
  };

  const color = Math.ceil(Math.random() * 4);

  if (Math.random() < 0.5) {
    setCurrentValue(0, 4, color, true);
    setCurrentValue(0, 5, color, true);
    setCurrentValue(1, 4, color, true);
    setCurrentValue(1, 5, color, true);
  } else {
    setCurrentValue(0, 4, color, true);
    setCurrentValue(1, 4, color, true);
    setCurrentValue(2, 4, color, true);
    setCurrentValue(3, 4, color, true);
  }
  return newBoard;
};

export const rotateShape = board => {
  return board;
};
