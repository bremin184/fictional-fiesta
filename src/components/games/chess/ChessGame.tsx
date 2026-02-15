import React, { useRef, useEffect, useState } from 'react';
import { ChessBoard } from './ChessBoard';
import { useChessGame } from './useChessGame';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw, Plus, ArrowLeft } from 'lucide-react';

interface ChessGameProps {
    isAI: boolean;
    onGameEnd: (winner: 'player' | 'opponent' | 'draw') => void;
    roomId?: string | null;
    isInitiator?: boolean;
}

export const ChessGame: React.FC<ChessGameProps> = ({
    isAI, onGameEnd, roomId = null, isInitiator = false,
}) => {
    const {
        gameState, myColor, selectedSquare, legalMoves, isGameStarted, selectSquare, resetGame,
    } = useChessGame({ roomId, isAI, isInitiator, onGameEnd });

    const isMyTurn = isAI ? gameState.turn === 'w' : gameState.turn === myColor;
    const moveListRef = useRef<HTMLDivElement>(null);

    // Move navigation state — null means "live" (latest move)
    const [viewIndex, setViewIndex] = useState<number | null>(null);
    const totalMoves = gameState.moveHistory.length;
    const currentIndex = viewIndex ?? totalMoves;

    // Auto-scroll move list
    useEffect(() => {
        if (moveListRef.current && viewIndex === null) {
            moveListRef.current.scrollLeft = moveListRef.current.scrollWidth;
        }
    }, [gameState.moveHistory, viewIndex]);

    // Reset viewIndex to live when new moves come in
    useEffect(() => {
        setViewIndex(null);
    }, [totalMoves]);

    if (!isGameStarted && !isAI) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Waiting for game to start...</p>
                </div>
            </div>
        );
    }

    // Format move pairs for display
    const movePairs: { num: number; white: string; black?: string; wIdx: number; bIdx?: number }[] = [];
    for (let i = 0; i < gameState.moveHistory.length; i += 2) {
        movePairs.push({
            num: Math.floor(i / 2) + 1,
            white: gameState.moveHistory[i],
            black: gameState.moveHistory[i + 1],
            wIdx: i + 1,  // 1-indexed move number
            bIdx: gameState.moveHistory[i + 1] ? i + 2 : undefined,
        });
    }

    // Nav handlers
    const goFirst = () => setViewIndex(0);
    const goPrev = () => setViewIndex(Math.max(0, currentIndex - 1));
    const goNext = () => {
        if (currentIndex < totalMoves) {
            setViewIndex(currentIndex + 1 >= totalMoves ? null : currentIndex + 1);
        }
    };
    const goLast = () => setViewIndex(null);
    const goTo = (idx: number) => setViewIndex(idx >= totalMoves ? null : idx);

    // Determine the FEN to display for the viewed position
    // For now, we always show the live position (move replay requires FEN history in useChessGame)
    // The board always shows gameState.fen (live), but highlights the selected move in the list

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#302e2b' }}>
            {/* Thin header — opponent bar */}
            <PlayerBar
                color={myColor === 'w' ? 'b' : 'w'}
                label={isAI ? 'AI' : 'Opponent'}
                captured={gameState.capturedPieces[myColor]}
                isActive={!isMyTurn && !gameState.isGameOver}
                isCheck={gameState.isCheck && !isMyTurn}
            />

            {/* Board — gets ALL remaining vertical space */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
                <ChessBoard
                    gameState={gameState}
                    myColor={myColor}
                    selectedSquare={selectedSquare}
                    legalMoves={legalMoves}
                    onSquareClick={selectSquare}
                />
            </div>

            {/* Player bar */}
            <PlayerBar
                color={myColor}
                label="You"
                captured={gameState.capturedPieces[myColor === 'w' ? 'b' : 'w']}
                isActive={isMyTurn && !gameState.isGameOver}
                isCheck={gameState.isCheck && isMyTurn}
            />

            {/* Move navigation bar — Chess.com style: [⏮][◀] move list [▶][⏭] */}
            <div
                className="flex items-center shrink-0 border-t"
                style={{ backgroundColor: '#272522', borderColor: '#3d3a36', height: '28px' }}
            >
                <button onClick={goFirst} className="flex items-center justify-center shrink-0 text-gray-400 hover:text-white transition-colors" style={{ width: '24px', height: '28px' }} title="First move">
                    <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={goPrev} className="flex items-center justify-center shrink-0 text-gray-400 hover:text-white transition-colors" style={{ width: '24px', height: '28px' }} title="Previous move">
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div
                    ref={moveListRef}
                    className="flex-1 overflow-x-auto overflow-y-hidden flex items-center scrollbar-none"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {movePairs.length === 0 && (
                        <span className="text-gray-500 text-[10px] px-2 italic">No moves yet</span>
                    )}
                    {movePairs.map(({ num, white, black, wIdx, bIdx }) => (
                        <div key={num} className="flex items-center shrink-0">
                            <span className="text-gray-500 text-[10px] font-medium px-1">{num}.</span>
                            <button
                                onClick={() => goTo(wIdx)}
                                className={cn(
                                    'text-[10px] font-semibold px-1 rounded transition-colors',
                                    currentIndex === wIdx ? 'bg-white/15 text-white' : 'text-gray-300 hover:text-white'
                                )}
                            >
                                {white}
                            </button>
                            {black && bIdx && (
                                <button
                                    onClick={() => goTo(bIdx)}
                                    className={cn(
                                        'text-[10px] font-semibold px-1 rounded transition-colors',
                                        currentIndex === bIdx ? 'bg-white/15 text-white' : 'text-gray-300 hover:text-white'
                                    )}
                                >
                                    {black}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button onClick={goNext} className="flex items-center justify-center shrink-0 text-gray-400 hover:text-white transition-colors" style={{ width: '24px', height: '28px' }} title="Next move">
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={goLast} className="flex items-center justify-center shrink-0 text-gray-400 hover:text-white transition-colors" style={{ width: '24px', height: '28px' }} title="Last move">
                    <ChevronsRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Status + game actions bar */}
            <div
                className="flex items-center justify-between px-2 shrink-0"
                style={{ backgroundColor: '#272522', height: '28px' }}
            >
                {/* Turn status */}
                <span className={cn(
                    'text-[10px] font-semibold',
                    gameState.isGameOver
                        ? 'text-yellow-400'
                        : isMyTurn ? 'text-green-400' : 'text-gray-400'
                )}>
                    {gameState.isGameOver
                        ? (gameState.isCheckmate
                            ? (isMyTurn ? '💀 Checkmate — You lost!' : '🏆 Checkmate!')
                            : '🤝 Draw!')
                        : (isMyTurn ? '● Your turn' : "○ Opponent's turn")}
                    {!gameState.isGameOver && gameState.isCheck && ' · Check!'}
                </span>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={resetGame}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Restart"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Restart
                    </button>
                    <button
                        onClick={resetGame}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="New Game"
                    >
                        <Plus className="w-3 h-3" />
                        New
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Player bar — compact (24px) ──

interface PlayerBarProps {
    color: 'w' | 'b';
    label: string;
    captured: string[];
    isActive: boolean;
    isCheck?: boolean;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ color, label, captured, isActive, isCheck }) => (
    <div
        className="flex items-center gap-2 px-2 shrink-0"
        style={{ backgroundColor: '#272522', height: '24px' }}
    >
        <div
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{
                backgroundColor: color === 'w' ? '#f0d9b5' : '#1a1a1a',
                border: color === 'w' ? '1px solid #d4ba8c' : '1px solid #444',
            }}
        />
        <span className="text-[11px] font-semibold text-gray-200 flex-1">{label}</span>
        {captured.length > 0 && (
            <span className="text-[10px] text-gray-400 tracking-tight leading-none">
                {captured.join('')}
            </span>
        )}
        {isActive && (
            <div className={cn(
                'w-1.5 h-1.5 rounded-full animate-pulse',
                isCheck ? 'bg-red-400' : 'bg-green-400'
            )} />
        )}
    </div>
);
