'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Trophy,
  Apple,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play
} from 'lucide-react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const [gameState, setGameState] = useState<
    'idle' | 'playing' | 'paused' | 'ended'
  >('idle');
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef<Direction>('RIGHT');

  useEffect(() => {
    const saved = localStorage.getItem('snakeGameBestScore');
    if (saved) setBestScore(parseInt(saved));
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      const newDirection = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
          if (newDirection !== 'DOWN') {
            directionRef.current = 'UP';
          }
          break;
        case 'ArrowDown':
          if (newDirection !== 'UP') {
            directionRef.current = 'DOWN';
          }
          break;
        case 'ArrowLeft':
          if (newDirection !== 'RIGHT') {
            directionRef.current = 'LEFT';
          }
          break;
        case 'ArrowRight':
          if (newDirection !== 'LEFT') {
            directionRef.current = 'RIGHT';
          }
          break;
        case ' ':
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (
      currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    setSnake((currentSnake) => {
      if (gameState !== 'playing') return currentSnake;

      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      switch (directionRef.current) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        endGame();
        return currentSnake;
      }

      // Check self collision
      if (
        newSnake.some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        endGame();
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore((prev) => prev + 10);
        setFood(generateFood(newSnake));
        // Increase speed slightly
        setSpeed((prev) => Math.max(50, prev - 5));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food, gameState, generateFood]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, speed, moveSnake]);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    directionRef.current = 'RIGHT';
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState('playing');
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  };

  const endGame = useCallback(() => {
    setGameState('ended');
    if (!bestScore || score > bestScore) {
      setBestScore(score);
      localStorage.setItem('snakeGameBestScore', score.toString());
    }
  }, [score, bestScore]);

  // Touch controls for mobile
  const handleDirectionClick = (newDirection: Direction) => {
    if (gameState !== 'playing') return;

    const currentDir = directionRef.current;
    if (
      (newDirection === 'UP' && currentDir !== 'DOWN') ||
      (newDirection === 'DOWN' && currentDir !== 'UP') ||
      (newDirection === 'LEFT' && currentDir !== 'RIGHT') ||
      (newDirection === 'RIGHT' && currentDir !== 'LEFT')
    ) {
      directionRef.current = newDirection;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-card/90 border-primary/10">
        <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600">
          <h6 className="text-white font-semibold flex items-center gap-2">
            <Gamepad2 size={20} /> Snake Game
          </h6>
        </div>

        <CardContent className="pt-4">
          {gameState === 'idle' && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gamepad2 className="text-primary mb-4" size={48} />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">
                Classic Snake Game!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use arrow keys or buttons to control the snake
              </p>
              <Button onClick={startGame} className="rounded-full">
                Start Game
              </Button>
              {bestScore && (
                <p className="text-sm text-muted-foreground mt-4">
                  Best Score:{' '}
                  <span className="font-bold text-primary">{bestScore}</span>
                </p>
              )}
            </div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-semibold">Score: {score}</div>
                <Button
                  onClick={togglePause}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  {gameState === 'paused' ? (
                    <Play size={16} />
                  ) : (
                    <Pause size={16} />
                  )}
                </Button>
              </div>

              <div
                className="relative mx-auto"
                style={{
                  width: GRID_SIZE * CELL_SIZE,
                  height: GRID_SIZE * CELL_SIZE
                }}
              >
                {/* Game Board */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg border-2 border-border">
                  {/* Grid pattern */}
                  <svg className="absolute inset-0 w-full h-full opacity-10">
                    <pattern
                      id="grid"
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      patternUnits="userSpaceOnUse"
                    >
                      <rect
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Snake */}
                <AnimatePresence>
                  {snake.map((segment, index) => (
                    <motion.div
                      key={`${segment.x}-${segment.y}-${index}`}
                      className={`absolute rounded-sm ${
                        index === 0
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 z-20'
                          : 'bg-gradient-to-br from-green-600 to-green-700'
                      }`}
                      style={{
                        left: segment.x * CELL_SIZE,
                        top: segment.y * CELL_SIZE,
                        width: CELL_SIZE - 2,
                        height: CELL_SIZE - 2
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {index === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full opacity-80" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Food */}
                <motion.div
                  key={`${food.x}-${food.y}`}
                  className="absolute z-10"
                  style={{
                    left: food.x * CELL_SIZE,
                    top: food.y * CELL_SIZE,
                    width: CELL_SIZE - 2,
                    height: CELL_SIZE - 2
                  }}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  <Apple className="w-full h-full text-red-500 fill-red-500" />
                </motion.div>

                {/* Pause overlay */}
                {gameState === 'paused' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg z-30"
                  >
                    <div className="text-center">
                      <Pause className="mx-auto mb-2 text-primary" size={48} />
                      <p className="text-lg font-semibold">Game Paused</p>
                      <p className="text-sm text-muted-foreground">
                        Press Space to continue
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Mobile Controls */}
              <div className="mt-4 grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                <div />
                <Button
                  onClick={() => handleDirectionClick('UP')}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <ArrowUp size={16} />
                </Button>
                <div />
                <Button
                  onClick={() => handleDirectionClick('LEFT')}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <ArrowLeft size={16} />
                </Button>
                <div />
                <Button
                  onClick={() => handleDirectionClick('RIGHT')}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <ArrowRight size={16} />
                </Button>
                <div />
                <Button
                  onClick={() => handleDirectionClick('DOWN')}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <ArrowDown size={16} />
                </Button>
                <div />
              </div>
            </div>
          )}

          {gameState === 'ended' && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Trophy className="text-yellow-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">Game Over!</h3>
              <p className="text-2xl font-bold text-primary mb-2">
                Score: {score}
              </p>
              {bestScore === score && score > 0 && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-sm text-green-600 font-semibold mb-4"
                >
                  New Best Score! 🎉
                </motion.p>
              )}
              <Button onClick={startGame} className="rounded-full">
                Play Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
