import React from 'react';
import { Tetromino } from '../game/types';

interface NextPieceProps {
  tetromino: Tetromino | null;
}

export const NextPiece: React.FC<NextPieceProps> = ({ tetromino }) => {
  if (!tetromino) return null;

  const gridSize = Math.max(tetromino.shape.length, tetromino.shape[0].length);
  const cellSize = 20; // pixels
  const padding = 2; // pixels

  return (
    <div 
      className="w-24 h-24 bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center"
      style={{ minHeight: '96px' }}
    >
      <div 
        className="grid gap-[1px]"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          padding: `${padding}px`
        }}
      >
        {tetromino.shape.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="rounded-sm transition-colors duration-200"
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor: cell ? tetromino.color : 'transparent',
                  boxShadow: cell ? 'inset 0 0 5px rgba(0,0,0,0.5)' : undefined
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
