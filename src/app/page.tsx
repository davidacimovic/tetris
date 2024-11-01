'use client';

import GameGrid from '../components/GameGrid';
import { NextPiece } from '../components/NextPiece';
import { useEffect, useState } from 'react';
import { GameState } from '../game/types';
import { createInitialGameState, getHighScore } from '../game/gameLogic';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    setMounted(true);
    setHighScore(getHighScore());
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center bg-gray-900 p-4">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-5xl font-bold text-white mb-8 tracking-wider">Tetris</h1>
          <div className="flex gap-8">
            <GameGrid onGameStateChange={setGameState} />
            <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700 min-w-[200px]">
              <div className="text-white space-y-6">
                <div className="text-xl">
                  <h2 className="font-bold mb-2">Score</h2>
                  <p className="text-3xl">{gameState.score}</p>
                </div>
                <div className="text-xl">
                  <h2 className="font-bold mb-2">High Score</h2>
                  <p className="text-3xl">{Math.max(highScore, gameState.score)}</p>
                </div>
                <div className="text-xl">
                  <h2 className="font-bold mb-2">Level</h2>
                  <p className="text-3xl">{gameState.level + 1}</p>
                </div>
                <div className="text-xl">
                  <h2 className="font-bold mb-2">Next Piece</h2>
                  <NextPiece tetromino={gameState.nextPiece} />
                </div>
                <div className="text-sm text-gray-400 pt-4 space-y-1">
                  <p className="font-bold mb-2 text-gray-300">Controls:</p>
                  <p>← → : Move left/right</p>
                  <p>↑ : Rotate</p>
                  <p>↓ : Soft drop</p>
                  <p>Space : Hard drop</p>
                  <p>P : Pause/Resume</p>
                  <p>R : Restart (when game over)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-gray-900 text-gray-500 text-center py-4 text-sm">
        <p>Built by David Acimovic using Cline</p>
      </footer>
    </div>
  );
}
