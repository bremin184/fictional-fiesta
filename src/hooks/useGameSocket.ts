import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';

export interface GameState {
    board?: any;
    currentTurn?: string;
    status?: string;
    winner?: string | null;
    choices?: Record<string, string>;
    result?: string | null;
}

interface UseGameSocketOptions {
    roomId: string | null;
    gameId: string;
    isAI: boolean;
}

interface UseGameSocketReturn {
    gameState: GameState | null;
    myRole: string | null;       // 'X'/'O' for TTT, 'red'/'yellow' for C4, playerId for RPS
    isGameStarted: boolean;
    isGameOver: boolean;
    error: string | null;
    choiceLocked: boolean;
    startGame: () => void;
    makeMove: (move: any) => void;
    resetGame: () => void;
}

export function useGameSocket({ roomId, gameId, isAI }: UseGameSocketOptions): UseGameSocketReturn {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [myRole, setMyRole] = useState<string | null>(null);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [choiceLocked, setChoiceLocked] = useState(false);
    const errorTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (isAI || !roomId) return;

        const socket = getSocket();
        if (!socket) return;

        const handleStarted = (data: any) => {
            setIsGameStarted(true);
            setIsGameOver(false);
            setChoiceLocked(false);
            setError(null);
            setGameState(data.state);

            // Set player role
            if (data.yourSymbol) setMyRole(data.yourSymbol);      // TicTacToe
            else if (data.yourColor) setMyRole(data.yourColor);    // ConnectFour
            else if (data.playerId) setMyRole(data.playerId);      // RPS
        };

        const handleState = (state: GameState) => {
            setGameState(state);
        };

        const handleEnd = (data: any) => {
            setIsGameOver(true);
            if (data.status === 'opponent_disconnected') {
                setError('Opponent disconnected');
            }
        };

        const handleError = (data: { message: string }) => {
            setError(data.message);
            // Auto-clear errors after 3 seconds
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => setError(null), 3000);
        };

        const handleChoiceLocked = () => {
            setChoiceLocked(true);
        };

        socket.on('game:started', handleStarted);
        socket.on('game:state', handleState);
        socket.on('game:end', handleEnd);
        socket.on('game:error', handleError);
        socket.on('game:choiceLocked', handleChoiceLocked);

        return () => {
            socket.off('game:started', handleStarted);
            socket.off('game:state', handleState);
            socket.off('game:end', handleEnd);
            socket.off('game:error', handleError);
            socket.off('game:choiceLocked', handleChoiceLocked);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        };
    }, [roomId, isAI]);

    const startGame = useCallback(() => {
        if (isAI || !roomId) return;
        const socket = getSocket();
        if (socket) {
            socket.emit('game:start', { roomId, gameId });
        }
    }, [roomId, gameId, isAI]);

    const makeMove = useCallback((move: any) => {
        if (isAI || !roomId) return;
        const socket = getSocket();
        if (socket) {
            socket.emit('game:move', { roomId, move });
        }
    }, [roomId, isAI]);

    const resetGame = useCallback(() => {
        if (isAI || !roomId) return;
        const socket = getSocket();
        if (socket) {
            setIsGameOver(false);
            setChoiceLocked(false);
            socket.emit('game:reset', { roomId });
        }
    }, [roomId, isAI]);

    return {
        gameState,
        myRole,
        isGameStarted,
        isGameOver,
        error,
        choiceLocked,
        startGame,
        makeMove,
        resetGame,
    };
}
