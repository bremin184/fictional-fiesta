import React, { useState, useEffect } from 'react';
import { useGameSocket } from '@/hooks/useGameSocket';

interface ConnectFourProps {
  isAI: boolean;
  onGameEnd: (winner: 'player' | 'opponent' | 'draw') => void;
  roomId?: string | null;
  isInitiator?: boolean;
}

type Cell = 'player' | 'opponent' | null;
type ServerCell = 'red' | 'yellow' | null;

const ROWS = 6;
const COLS = 7;

export const ConnectFour: React.FC<ConnectFourProps> = ({ isAI, onGameEnd, roomId = null, isInitiator = false }) => {
  // ── AI mode: local state ──
  const [localBoard, setLocalBoard] = useState<Cell[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<'player' | 'opponent' | 'draw' | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  // ── Multiplayer mode: server state ──
  const {
    gameState, myRole, isGameStarted, isGameOver, error, startGame, makeMove
  } = useGameSocket({ roomId, gameId: 'connect-four', isAI });

  // Start multiplayer game (only the inviter)
  useEffect(() => {
    if (!isAI && roomId && isInitiator) {
      startGame();
    }
  }, [isAI, roomId, isInitiator]);

  // Handle server game end
  useEffect(() => {
    if (!isAI && isGameOver && gameState) {
      if (gameState.status === 'draw') {
        onGameEnd('draw');
        setWinner('draw');
      } else if (gameState.winner === myRole) {
        onGameEnd('player');
        setWinner('player');
      } else {
        onGameEnd('opponent');
        setWinner('opponent');
      }
    }
  }, [isGameOver, isAI]);

  // ── AI logic (unchanged) ──
  const checkWinner = (b: Cell[][]): Cell | 'draw' | null => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const cell = b[r][c];
        if (cell && cell === b[r][c + 1] && cell === b[r][c + 2] && cell === b[r][c + 3]) return cell;
      }
    }
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const cell = b[r][c];
        if (cell && cell === b[r + 1][c] && cell === b[r + 2][c] && cell === b[r + 3][c]) return cell;
      }
    }
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const cell = b[r][c];
        if (cell && cell === b[r + 1][c + 1] && cell === b[r + 2][c + 2] && cell === b[r + 3][c + 3]) return cell;
      }
    }
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const cell = b[r][c];
        if (cell && cell === b[r - 1][c + 1] && cell === b[r - 2][c + 2] && cell === b[r - 3][c + 3]) return cell;
      }
    }
    if (b.every((row) => row.every((cell) => cell !== null))) return 'draw';
    return null;
  };

  const getLowestRow = (col: number, board: Cell[][]): number => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === null) return r;
    }
    return -1;
  };

  const dropPiece = (col: number, player: Cell) => {
    const row = getLowestRow(col, localBoard);
    if (row === -1) return false;
    const newBoard = localBoard.map((r) => [...r]);
    newBoard[row][col] = player;
    setLocalBoard(newBoard);
    const result = checkWinner(newBoard);
    if (result) {
      if (result === 'draw') { setWinner('draw'); onGameEnd('draw'); }
      else { setWinner(result); onGameEnd(result); }
      return true;
    }
    return false;
  };

  const handleClickAI = (col: number) => {
    if (winner || !isPlayerTurn || getLowestRow(col, localBoard) === -1) return;
    const gameEnded = dropPiece(col, 'player');
    if (!gameEnded) setIsPlayerTurn(false);
  };

  const handleClickMultiplayer = (col: number) => {
    if (!gameState || isGameOver) return;
    if (gameState.currentTurn !== myRole) return;
    makeMove({ column: col });
  };

  useEffect(() => {
    if (isAI && !isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        const validCols = [];
        for (let c = 0; c < COLS; c++) {
          if (getLowestRow(c, localBoard) !== -1) validCols.push(c);
        }
        if (validCols.length > 0) {
          const col = validCols[Math.floor(Math.random() * validCols.length)];
          const gameEnded = dropPiece(col, 'opponent');
          if (!gameEnded) setIsPlayerTurn(true);
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, isAI]);

  // ── Determine render state ──
  const board: (string | null)[][] = isAI
    ? localBoard
    : (gameState?.board || Array.from({ length: ROWS }, () => Array(COLS).fill(null)));

  const isMyTurn = isAI ? isPlayerTurn : (gameState?.currentTurn === myRole);
  const gameEnded = isAI ? winner : (isGameOver ? winner : null);
  const opponentLabel = isAI ? 'AI' : 'Opponent';
  const handleClick = isAI ? handleClickAI : handleClickMultiplayer;

  // Map server cell colors for rendering
  const getCellColor = (cell: string | null, r: number, c: number) => {
    if (isAI) {
      if (cell === 'player') return 'bg-red-500';
      if (cell === 'opponent') return 'bg-yellow-400';
    } else {
      if (cell === 'red') return 'bg-red-500';
      if (cell === 'yellow') return 'bg-yellow-400';
    }
    // Hover preview
    const previewBoard = isAI ? localBoard : board;
    const lowestRow = (() => { for (let row = ROWS - 1; row >= 0; row--) { if (previewBoard[row][c] === null) return row; } return -1; })();
    if (hoverCol === c && r === lowestRow && isMyTurn && !gameEnded) return 'bg-red-500/30';
    return 'bg-blue-900';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-4">
        {error && <p className="text-destructive text-sm mb-2">{error}</p>}
        {gameEnded ? (
          <h3 className="text-xl font-display font-bold">
            {gameEnded === 'draw' ? "It's a Draw!" : gameEnded === 'player' ? 'You Win! 🎉' : `${opponentLabel} Wins!`}
          </h3>
        ) : !isAI && !isGameStarted ? (
          <h3 className="text-lg font-semibold">Waiting for game to start...</h3>
        ) : (
          <h3 className="text-lg font-semibold">
            {isMyTurn ? `Your Turn (${myRole === 'red' || isAI ? 'Red' : 'Yellow'})` : `${opponentLabel} ${isAI ? 'Thinking...' : "'s Turn"}`}
          </h3>
        )}
      </div>

      <div className="bg-blue-600 p-3 rounded-xl">
        <div className="grid grid-cols-7 gap-1.5">
          {board.map((row, r) =>
            (row as (string | null)[]).map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(c)}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
                disabled={!!gameEnded || !isMyTurn}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full transition-all bg-blue-800"
              >
                <div className={`w-full h-full rounded-full transition-all ${getCellColor(cell, r, c)}`} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
