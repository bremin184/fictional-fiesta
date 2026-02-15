import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { getSocket } from '@/lib/socket';

export type PieceColor = 'w' | 'b';

export interface ChessGameState {
    fen: string;
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
    isGameOver: boolean;
    turn: PieceColor;
    lastMove: { from: Square; to: Square } | null;
    moveHistory: string[];
    capturedPieces: { w: string[]; b: string[] };
}

interface UseChessGameOptions {
    roomId: string | null;
    isAI: boolean;
    isInitiator: boolean;
    onGameEnd?: (winner: 'player' | 'opponent' | 'draw') => void;
}

export function useChessGame({ roomId, isAI, isInitiator, onGameEnd }: UseChessGameOptions) {
    const gameRef = useRef(new Chess());
    const [gameState, setGameState] = useState<ChessGameState>(deriveState(gameRef.current, null));
    const [myColor, setMyColor] = useState<PieceColor>(isInitiator ? 'w' : 'b');
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [legalMoves, setLegalMoves] = useState<Square[]>([]);
    const [isGameStarted, setIsGameStarted] = useState(isAI);
    const onGameEndRef = useRef(onGameEnd);
    onGameEndRef.current = onGameEnd;

    // Derive full state from chess instance
    function deriveState(chess: Chess, lastMove: { from: Square; to: Square } | null): ChessGameState {
        return {
            fen: chess.fen(),
            isCheck: chess.isCheck(),
            isCheckmate: chess.isCheckmate(),
            isStalemate: chess.isStalemate(),
            isDraw: chess.isDraw(),
            isGameOver: chess.isGameOver(),
            turn: chess.turn(),
            lastMove,
            moveHistory: chess.history(),
            capturedPieces: getCapturedPieces(chess),
        };
    }

    function getCapturedPieces(chess: Chess): { w: string[]; b: string[] } {
        const initial: Record<string, number> = { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 };
        const remaining = { w: { ...initial }, b: { ...initial } };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = String.fromCharCode(97 + c) + (8 - r) as Square;
                const piece = chess.get(sq);
                if (piece) {
                    remaining[piece.color][piece.type]--;
                }
            }
        }

        const pieceSymbols: Record<string, Record<string, string>> = {
            w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕' },
            b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛' },
        };

        const captured: { w: string[]; b: string[] } = { w: [], b: [] };
        for (const color of ['w', 'b'] as const) {
            for (const [type, count] of Object.entries(remaining[color])) {
                if (type === 'k') continue;
                for (let i = 0; i < count; i++) {
                    captured[color].push(pieceSymbols[color][type]);
                }
            }
        }
        return captured;
    }

    const updateState = useCallback((lastMove: { from: Square; to: Square } | null) => {
        const chess = gameRef.current;
        const state = deriveState(chess, lastMove);
        setGameState(state);

        if (state.isGameOver) {
            if (state.isCheckmate) {
                // The side whose turn it is lost (they're in checkmate)
                const loser = state.turn;
                onGameEndRef.current?.(loser === myColor ? 'opponent' : 'player');
            } else {
                onGameEndRef.current?.('draw');
            }
        }
    }, [myColor]);

    // ── Socket sync for multiplayer ──
    useEffect(() => {
        if (isAI || !roomId) return;
        const socket = getSocket();

        const handleStarted = (data: any) => {
            if (data.gameId !== 'chess') return;
            setIsGameStarted(true);
            setMyColor(data.yourColor as PieceColor);
            gameRef.current = new Chess();
            updateState(null);
        };

        const handleState = (data: any) => {
            if (!data.fen) return;
            gameRef.current = new Chess(data.fen);
            const lastMove = data.lastMove || null;
            updateState(lastMove);
        };

        const handleEnd = (data: any) => {
            if (data.winner) {
                onGameEndRef.current?.(data.winner === myColor ? 'player' : 'opponent');
            } else {
                onGameEndRef.current?.('draw');
            }
        };

        const handleError = (data: any) => {
            console.error('[Chess] Game error:', data.message);
        };

        socket.on('game:started', handleStarted);
        socket.on('game:state', handleState);
        socket.on('game:end', handleEnd);
        socket.on('game:error', handleError);

        return () => {
            socket.off('game:started', handleStarted);
            socket.off('game:state', handleState);
            socket.off('game:end', handleEnd);
            socket.off('game:error', handleError);
        };
    }, [roomId, isAI, myColor, updateState]);

    // Start game (initiator sends game:start)
    useEffect(() => {
        if (!isAI && roomId && isInitiator) {
            const socket = getSocket();
            socket.emit('game:start', { roomId, gameId: 'chess' });
        }
    }, [isAI, roomId, isInitiator]);

    const selectSquare = useCallback((square: Square) => {
        const chess = gameRef.current;

        // Not player's turn
        if (!isAI && chess.turn() !== myColor) return;
        if (isAI && chess.turn() !== 'w') return; // Player is always white in AI mode

        if (selectedSquare) {
            // Try to make a move
            const move = tryMove(selectedSquare, square);
            if (move) {
                setSelectedSquare(null);
                setLegalMoves([]);
                return;
            }
        }

        // Select a new piece
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
            setSelectedSquare(square);
            const moves = chess.moves({ square, verbose: true });
            setLegalMoves(moves.map(m => m.to as Square));
        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    }, [selectedSquare, myColor, isAI]);

    const tryMove = useCallback((from: Square, to: Square): Move | null => {
        const chess = gameRef.current;

        // Check if this is a pawn promotion
        const piece = chess.get(from);
        const isPromotion = piece?.type === 'p' &&
            ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

        try {
            const move = chess.move({ from, to, promotion: isPromotion ? 'q' : undefined });
            if (move) {
                updateState({ from, to });

                if (!isAI && roomId) {
                    // Send move to server
                    const socket = getSocket();
                    socket.emit('game:move', {
                        roomId,
                        move: { from, to, promotion: isPromotion ? 'q' : undefined, fen: chess.fen() },
                    });
                }

                // AI response
                if (isAI && !chess.isGameOver()) {
                    setTimeout(() => makeAIMove(), 400);
                }

                return move;
            }
        } catch {
            // Invalid move
        }
        return null;
    }, [isAI, roomId, updateState]);

    const makeAIMove = useCallback(() => {
        const chess = gameRef.current;
        if (chess.isGameOver()) return;

        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) return;

        // Simple AI: prioritize captures and checks, then random
        const captures = moves.filter(m => m.captured);
        const checks = moves.filter(m => {
            const testChess = new Chess(chess.fen());
            testChess.move(m);
            return testChess.isCheck();
        });

        let chosen: Move;
        if (checks.length > 0) {
            chosen = checks[Math.floor(Math.random() * checks.length)];
        } else if (captures.length > 0) {
            chosen = captures[Math.floor(Math.random() * captures.length)];
        } else {
            chosen = moves[Math.floor(Math.random() * moves.length)];
        }

        chess.move(chosen);
        updateState({ from: chosen.from as Square, to: chosen.to as Square });
    }, [updateState]);

    const resetGame = useCallback(() => {
        gameRef.current = new Chess();
        setSelectedSquare(null);
        setLegalMoves([]);
        updateState(null);

        if (!isAI && roomId) {
            const socket = getSocket();
            socket.emit('game:reset', { roomId });
        }
    }, [isAI, roomId, updateState]);

    return {
        gameState,
        myColor,
        selectedSquare,
        legalMoves,
        isGameStarted,
        selectSquare,
        resetGame,
    };
}
