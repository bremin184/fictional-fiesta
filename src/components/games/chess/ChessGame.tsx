import React from 'react';
import { ChessBoard } from './ChessBoard';
import { useChessGame } from './useChessGame';
import { cn } from '@/lib/utils';

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

    return (
        <div className="flex flex-col h-full gap-2 p-1">
            {/* Top info bar — opponent */}
            <PlayerBar
                color={myColor === 'w' ? 'b' : 'w'}
                label={isAI ? 'AI' : 'Opponent'}
                captured={gameState.capturedPieces[myColor]} /* pieces captured BY opponent = my color */
                isActive={!isMyTurn && !gameState.isGameOver}
            />

            {/* Board */}
            <div className="flex-1 flex items-center justify-center min-h-0">
                <ChessBoard
                    gameState={gameState}
                    myColor={myColor}
                    selectedSquare={selectedSquare}
                    legalMoves={legalMoves}
                    onSquareClick={selectSquare}
                />
            </div>

            {/* Bottom info bar — player */}
            <PlayerBar
                color={myColor}
                label="You"
                captured={gameState.capturedPieces[myColor === 'w' ? 'b' : 'w']} /* pieces captured BY me = opponent color */
                isActive={isMyTurn && !gameState.isGameOver}
            />

            {/* Game status */}
            {gameState.isGameOver && (
                <div className="text-center py-2 space-y-2">
                    <p className="text-sm font-bold">
                        {gameState.isCheckmate
                            ? (isMyTurn ? '💀 Checkmate — You lost!' : '🏆 Checkmate — You win!')
                            : gameState.isStalemate
                                ? '🤝 Stalemate — Draw!'
                                : '🤝 Draw!'}
                    </p>
                    <button
                        onClick={resetGame}
                        className="px-4 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium transition-colors"
                    >
                        Play Again
                    </button>
                </div>
            )}

            {/* Turn indicator when not game over */}
            {!gameState.isGameOver && (
                <div className="text-center">
                    <span className={cn(
                        'text-xs font-medium px-3 py-1 rounded-full',
                        isMyTurn
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-muted text-muted-foreground'
                    )}>
                        {isMyTurn ? 'Your turn' : "Opponent's turn"}
                        {gameState.isCheck && ' · Check!'}
                    </span>
                </div>
            )}
        </div>
    );
};

// ── Player bar ──

interface PlayerBarProps {
    color: 'w' | 'b';
    label: string;
    captured: string[];
    isActive: boolean;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ color, label, captured, isActive }) => (
    <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
        isActive ? 'bg-primary/15 border border-primary/30' : 'bg-muted/50',
    )}>
        <div className={cn(
            'w-3 h-3 rounded-full border-2',
            color === 'w' ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-600',
        )} />
        <span className="text-xs font-semibold flex-1">{label}</span>
        {captured.length > 0 && (
            <span className="text-xs opacity-70 tracking-tight">{captured.join('')}</span>
        )}
        {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        )}
    </div>
);
