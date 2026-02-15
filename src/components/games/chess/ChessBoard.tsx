import React, { useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessSquare } from './ChessSquare';
import { PieceColor, ChessGameState } from './useChessGame';

interface ChessBoardProps {
    gameState: ChessGameState;
    myColor: PieceColor;
    selectedSquare: Square | null;
    legalMoves: Square[];
    onSquareClick: (square: Square) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
    gameState, myColor, selectedSquare, legalMoves, onSquareClick,
}) => {
    const chess = useMemo(() => new Chess(gameState.fen), [gameState.fen]);

    // Board is flipped for black
    const rows = useMemo(() => {
        const r = Array.from({ length: 8 }, (_, i) => i);
        return myColor === 'b' ? r : r;
    }, [myColor]);

    const cols = useMemo(() => {
        const c = Array.from({ length: 8 }, (_, i) => i);
        return myColor === 'b' ? c.reverse() : c;
    }, [myColor]);

    // Find the king square if in check
    const checkSquare = useMemo(() => {
        if (!gameState.isCheck) return null;
        const turn = gameState.turn;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;
                const piece = chess.get(sq);
                if (piece && piece.type === 'k' && piece.color === turn) {
                    return sq;
                }
            }
        }
        return null;
    }, [gameState.fen, gameState.isCheck, gameState.turn]);

    const renderRows = myColor === 'b' ? [...rows].reverse() : rows;

    return (
        <div className="w-full max-w-[min(100%,60vh)] aspect-square mx-auto">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden shadow-xl border-2 border-amber-900/50">
                {renderRows.map(row =>
                    cols.map(col => {
                        const square = (String.fromCharCode(97 + col) + (8 - row)) as Square;
                        const piece = chess.get(square);
                        const isSelected = selectedSquare === square;
                        const isLegalMove = legalMoves.includes(square);
                        const isLastMove = gameState.lastMove?.from === square || gameState.lastMove?.to === square;
                        const isCheck = checkSquare === square;

                        return (
                            <ChessSquare
                                key={square}
                                square={square}
                                row={row}
                                col={col}
                                piece={piece ? { type: piece.type, color: piece.color } : null}
                                isSelected={isSelected}
                                isLegalMove={isLegalMove}
                                isLastMove={isLastMove}
                                isCheck={isCheck}
                                onClick={onSquareClick}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
