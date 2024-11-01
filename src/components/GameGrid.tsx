'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { GameState, Cell, Position } from '../game/types';
import {
  createInitialGameState,
  checkCollision,
  mergePieceWithGrid,
  clearLines,
  calculateScore,
  getDropInterval,
  updateGameStateAfterLineClear,
  getNextGamePiece,
  updateHighScore,
  getHighScore,
  saveGameState,
  clearGameState
} from '../game/gameLogic';
import { rotateTetromino } from '../game/tetrominoes';
import { playSound } from '../game/soundManager';

interface GameGridProps {
  onGameStateChange?: (state: GameState) => void;
}

const GameGrid: React.FC<GameGridProps> = ({ onGameStateChange }) => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [dropTime, setDropTime] = useState<number | null>(1000);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const dropInterval = useRef<NodeJS.Timeout>();

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    onGameStateChange?.(newState);
    if (!newState.isGameOver) {
      saveGameState(newState);
    }
  };

  const restartGame = useCallback(() => {
    playSound('move');
    setDropTime(1000);
    clearGameState();
    updateGameState(createInitialGameState());
  }, []);

  const getFinalDropPosition = useCallback((piece: GameState['currentPiece']): Position | null => {
    if (!piece) return null;

    let finalY = piece.position.y;
    while (!checkCollision(
      gameState.grid,
      piece.tetromino.shape,
      { x: piece.position.x, y: finalY + 1 }
    )) {
      finalY++;
    }

    return {
      x: piece.position.x,
      y: finalY
    };
  }, [gameState.grid]);

  const movePlayer = useCallback((dir: number) => {
    if (!gameState.currentPiece || gameState.isGameOver || gameState.isPaused) return;

    const newPosition = {
      x: gameState.currentPiece.position.x + dir,
      y: gameState.currentPiece.position.y
    };

    if (!checkCollision(
      gameState.grid,
      gameState.currentPiece.tetromino.shape,
      newPosition
    )) {
      playSound('move');
      updateGameState({
        ...gameState,
        currentPiece: {
          ...gameState.currentPiece,
          position: newPosition
        }
      });
    }
  }, [gameState]);

  const rotate = useCallback(() => {
    if (!gameState.currentPiece || gameState.isGameOver || gameState.isPaused) return;

    const rotated = rotateTetromino(gameState.currentPiece.tetromino.shape);
    if (!checkCollision(
      gameState.grid,
      rotated,
      gameState.currentPiece.position
    )) {
      playSound('rotate');
      updateGameState({
        ...gameState,
        currentPiece: {
          ...gameState.currentPiece,
          tetromino: {
            ...gameState.currentPiece.tetromino,
            shape: rotated
          }
        }
      });
    }
  }, [gameState]);

  const drop = useCallback(() => {
    if (!gameState.currentPiece || gameState.isGameOver || gameState.isPaused) return;

    const newPosition = {
      x: gameState.currentPiece.position.x,
      y: gameState.currentPiece.position.y + 1
    };

    if (!checkCollision(
      gameState.grid,
      gameState.currentPiece.tetromino.shape,
      newPosition
    )) {
      updateGameState({
        ...gameState,
        currentPiece: {
          ...gameState.currentPiece,
          position: newPosition
        }
      });
    } else {
      // Merge piece with grid
      const newGrid = mergePieceWithGrid(
        gameState.grid,
        gameState.currentPiece.tetromino.shape,
        gameState.currentPiece.position,
        gameState.currentPiece.tetromino.color
      );

      // Check for game over
      if (gameState.currentPiece.position.y < 0) {
        playSound('gameOver');
        updateHighScore(gameState.score);
        clearGameState();
        updateGameState({
          ...gameState,
          isGameOver: true
        });
        return;
      }

      const { newGrid: clearedGrid, linesCleared } = clearLines(newGrid);
      const newScore = gameState.score + calculateScore(linesCleared, gameState.level);
      const updatedState = updateGameStateAfterLineClear(gameState, linesCleared);
      const nextPiece = getNextGamePiece();
      
      // Ensure we have both current and next pieces
      const currentPiece = gameState.nextPiece || getNextGamePiece().tetromino;
      
      setIsClearing(true);
      updateGameState({
        ...updatedState,
        grid: clearedGrid,
        score: newScore,
        currentPiece: {
          tetromino: currentPiece,
          position: { x: 3, y: -2 },
          rotation: 0
        },
        nextPiece: nextPiece.tetromino
      });
      setDropTime(getDropInterval(updatedState.level));
      setTimeout(() => setIsClearing(false), 100);
    }
  }, [gameState]);

  const hardDrop = useCallback(() => {
    if (!gameState.currentPiece || gameState.isGameOver || gameState.isPaused) return;

    const finalPosition = getFinalDropPosition(gameState.currentPiece);
    if (!finalPosition) return;

    playSound('drop');

    // Merge piece with grid at final position
    const newGrid = mergePieceWithGrid(
      gameState.grid,
      gameState.currentPiece.tetromino.shape,
      finalPosition,
      gameState.currentPiece.tetromino.color
    );

    // Check for game over
    if (finalPosition.y < 0) {
      playSound('gameOver');
      updateHighScore(gameState.score);
      clearGameState();
      updateGameState({
        ...gameState,
        isGameOver: true
      });
      return;
    }

    const { newGrid: clearedGrid, linesCleared } = clearLines(newGrid);
    const newScore = gameState.score + calculateScore(linesCleared, gameState.level);
    const updatedState = updateGameStateAfterLineClear(gameState, linesCleared);
    const nextPiece = getNextGamePiece();
    
    // Ensure we have both current and next pieces
    const currentPiece = gameState.nextPiece || getNextGamePiece().tetromino;
    
    setIsClearing(true);
    updateGameState({
      ...updatedState,
      grid: clearedGrid,
      score: newScore,
      currentPiece: {
        tetromino: currentPiece,
        position: { x: 3, y: -2 },
        rotation: 0
      },
      nextPiece: nextPiece.tetromino
    });
    setDropTime(getDropInterval(updatedState.level));
    setTimeout(() => setIsClearing(false), 100);
  }, [gameState, getFinalDropPosition]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          movePlayer(-1);
          break;
        case 'ArrowRight':
          movePlayer(1);
          break;
        case 'ArrowUp':
          rotate();
          break;
        case 'ArrowDown':
          drop();
          break;
        case ' ':
          event.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          updateGameState({ ...gameState, isPaused: !gameState.isPaused });
          break;
        case 'r':
        case 'R':
          if (gameState.isGameOver) {
            restartGame();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [movePlayer, rotate, drop, hardDrop, gameState.isPaused, gameState.isGameOver, restartGame]);

  useEffect(() => {
    if (!dropTime || gameState.isGameOver || gameState.isPaused) {
      clearInterval(dropInterval.current);
      return;
    }

    dropInterval.current = setInterval(() => {
      drop();
    }, dropTime);

    return () => {
      clearInterval(dropInterval.current);
    };
  }, [drop, dropTime, gameState.isGameOver, gameState.isPaused]);

  const getDisplayGrid = () => {
    if (!gameState.currentPiece) return gameState.grid;

    const displayGrid: Cell[][] = gameState.grid.map(row => [...row]);
    const { tetromino, position } = gameState.currentPiece;

    // Draw active piece
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        if (tetromino.shape[y][x]) {
          const newY = position.y + y;
          const newX = position.x + x;
          if (newY >= 0 && newY < 20 && newX >= 0 && newX < 10) {
            displayGrid[newY][newX] = {
              filled: true,
              color: tetromino.color
            };
          }
        }
      }
    }

    return displayGrid;
  };

  return (
    <div className="relative inline-block">
      <div className="inline-grid grid-cols-10 gap-[1px] bg-gray-700 p-2 rounded-lg border-2 border-gray-600">
        {getDisplayGrid().map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`w-8 h-8 rounded-sm transition-colors duration-200 ${
                cell.filled
                  ? `${isClearing ? 'animate-flash' : ''}`
                  : 'bg-gray-900'
              }`}
              style={{
                backgroundColor: cell.filled ? cell.color : undefined,
                boxShadow: cell.filled ? 'inset 0 0 5px rgba(0,0,0,0.5)' : undefined
              }}
              data-position={`${rowIndex}-${colIndex}`}
            />
          ))
        ))}
      </div>
      {gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="text-white text-2xl font-bold mb-4">Game Over!</div>
            <div className="text-white mb-2">Final Score: {gameState.score}</div>
            <div className="text-white mb-6">
              {gameState.score > getHighScore() ? (
                <div className="text-yellow-400 font-bold">New High Score!</div>
              ) : (
                <div>High Score: {getHighScore()}</div>
              )}
            </div>
            <button
              onClick={restartGame}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Play Again
            </button>
            <div className="text-gray-400 text-sm mt-4">
              Press R to restart
            </div>
          </div>
        </div>
      )}
      {gameState.isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="text-white text-2xl font-bold mb-4">Paused</div>
            <div className="text-white text-sm">Press P to resume</div>
          </div>
        </div>
      )}
      {/* Level up notification */}
      {gameState.level > 0 && (
        <div 
          className={`absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg transition-opacity duration-500 ${
            isClearing ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Level {gameState.level + 1}!
        </div>
      )}
    </div>
  );
};

export default GameGrid;
