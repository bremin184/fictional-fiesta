import React, { useState, useEffect } from 'react';
import { useGameSocket } from '@/hooks/useGameSocket';

interface TicTacToeProps {
  isAI: boolean;
  onGameEnd: (winner: 'player' | 'opponent' | 'draw') => void;
  roomId?: string | null;
  isInitiator?: boolean;
}

type Cell = 'X' | 'O' | null;

export const TicTacToe: React.FC<TicTacToeProps> = ({ isAI, onGameEnd, roomId = null, isInitiator = false }) => {
  // ── AI mode: local state ──
  const [localBoard, setLocalBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<'player' | 'opponent' | 'draw' | null>(null);

  // ── Multiplayer mode: server state ──
  const {
    gameState, myRole, isGameStarted, isGameOver, error, startGame, makeMove, resetGame
  } = useGameSocket({ roomId, gameId: 'tic-tac-toe', isAI });

  // Start multiplayer game when component mounts (only the inviter)
  useEffect(() => {
    if (!isAI && roomId && isInitiator) {
      startGame();
    }
  }, [isAI, roomId, isInitiator]);

  // Handle server game end
  useEffect(() => {
    if (!isAI && isGameOver && gameState) {
      const serverWinner = gameState.winner;
      if (gameState.status === 'draw') {
        onGameEnd('draw');
        setWinner('draw');
      } else if (serverWinner === myRole) {
        onGameEnd('player');
        setWinner('player');
      } else {
        onGameEnd('opponent');
        setWinner('opponent');
      }
    }
  }, [isGameOver, isAI]);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const checkWinner = (squares: Cell[]): Cell | 'draw' | null => {
    for (const [a, b, c] of winningCombinations) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every((cell) => cell !== null)) return 'draw';
    return null;
  };

  // ── AI click handler ──
  const handleClickAI = (index: number) => {
    if (localBoard[index] || winner || !isPlayerTurn) return;

    const newBoard = [...localBoard];
    newBoard[index] = 'X';
    setLocalBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      const gameResult = result === 'X' ? 'player' : result === 'O' ? 'opponent' : 'draw';
      setWinner(gameResult);
      onGameEnd(gameResult);
    } else {
      setIsPlayerTurn(false);
    }
  };

  // ── Multiplayer click handler ──
  const handleClickMultiplayer = (index: number) => {
    if (!gameState || isGameOver) return;
    // Only allow clicks on your turn
    if (gameState.currentTurn !== myRole) return;
    // Only allow clicks on empty cells
    if (gameState.board && gameState.board[index] !== null) return;

    makeMove({ cell: index });
  };

  // AI Move Effect
  useEffect(() => {
    if (isAI && !isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        const emptyIndices = localBoard
          .map((cell, index) => (cell === null ? index : -1))
          .filter((index) => index !== -1);

        if (emptyIndices.length > 0) {
          let move = -1;

          // Try to win
          for (const idx of emptyIndices) {
            const testBoard = [...localBoard];
            testBoard[idx] = 'O';
            if (checkWinner(testBoard) === 'O') {
              move = idx;
              break;
            }
          }

          // Try to block
          if (move === -1) {
            for (const idx of emptyIndices) {
              const testBoard = [...localBoard];
              testBoard[idx] = 'X';
              if (checkWinner(testBoard) === 'X') {
                move = idx;
                break;
              }
            }
          }

          // Center or random
          if (move === -1) {
            if (emptyIndices.includes(4)) move = 4;
            else move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          }

          const newBoard = [...localBoard];
          newBoard[move] = 'O';
          setLocalBoard(newBoard);

          const result = checkWinner(newBoard);
          if (result) {
            const gameResult = result === 'X' ? 'player' : result === 'O' ? 'opponent' : 'draw';
            setWinner(gameResult);
            onGameEnd(gameResult);
          } else {
            setIsPlayerTurn(true);
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, localBoard, isAI, winner]);

  // ── Determine render state ──
  const board: Cell[] = isAI ? localBoard : (gameState?.board || Array(9).fill(null));
  const isMyTurn = isAI ? isPlayerTurn : (gameState?.currentTurn === myRole);
  const gameEnded = isAI ? winner : (isGameOver ? winner : null);
  const opponentLabel = isAI ? 'AI' : 'Opponent';

  const handleClick = isAI ? handleClickAI : handleClickMultiplayer;

  const getCellStyle = (cell: Cell) => {
    if (cell === 'X') return 'text-primary';
    if (cell === 'O') return 'text-secondary';
    return '';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6">
        {error && (
          <p className="text-destructive text-sm mb-2">{error}</p>
        )}
        {gameEnded ? (
          <h3 className="text-xl font-display font-bold">
            {gameEnded === 'draw' ? "It's a Draw!" : gameEnded === 'player' ? 'You Win! 🎉' : `${opponentLabel} Wins!`}
          </h3>
        ) : !isAI && !isGameStarted ? (
          <h3 className="text-lg font-semibold">Waiting for game to start...</h3>
        ) : (
          <h3 className="text-lg font-semibold">
            {isMyTurn ? `Your Turn (${myRole || 'X'})` : `${opponentLabel} ${isAI ? 'Thinking...' : "'s Turn"}`}
          </h3>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-xs">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            disabled={!!cell || !!gameEnded || !isMyTurn}
            className={`w-24 h-24 text-5xl font-bold rounded-xl bg-muted border-2 border-border 
              hover:border-primary/50 transition-all disabled:cursor-not-allowed
              ${getCellStyle(cell)}
              ${!cell && isMyTurn && !gameEnded ? 'hover:bg-muted/80' : ''}`}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
};
