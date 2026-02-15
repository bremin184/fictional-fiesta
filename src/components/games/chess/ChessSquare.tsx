import React from 'react';
import { Square } from 'chess.js';
import { ChessPiece } from './ChessPiece';

interface ChessSquareProps {
    square: Square;
    row: number;
    col: number;
    piece: { type: string; color: 'w' | 'b' } | null;
    isSelected: boolean;
    isLegalMove: boolean;
    isLastMove: boolean;
    isCheck: boolean;
    onClick: (square: Square) => void;
}

export const ChessSquare: React.FC<ChessSquareProps> = ({
    square, row, col, piece, isSelected, isLegalMove, isLastMove, isCheck, onClick,
}) => {
    const isLight = (row + col) % 2 === 0;

    // Chess.com wood-grain palette
    const baseColor = isLight ? '#f0d9b5' : '#b58863';
    const selectedColor = isLight ? '#f7ec5a' : '#daa520';
    const lastMoveColor = isLight ? '#f7f18d' : '#cda738';
    const checkColor = '#e84040';

    let bgColor = baseColor;
    if (isSelected) bgColor = selectedColor;
    else if (isLastMove) bgColor = lastMoveColor;

    return (
        <button
            className="relative flex items-center justify-center"
            style={{
                backgroundColor: bgColor,
                boxShadow: isCheck ? `inset 0 0 12px 4px ${checkColor}` : undefined,
            }}
            onClick={() => onClick(square)}
            aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
        >
            {/* Legal move indicator — empty square */}
            {isLegalMove && !piece && (
                <div
                    className="absolute rounded-full"
                    style={{
                        width: '28%',
                        height: '28%',
                        backgroundColor: 'rgba(0,0,0,0.18)',
                    }}
                />
            )}
            {/* Legal move indicator — capture ring */}
            {isLegalMove && piece && (
                <div
                    className="absolute inset-[3px] rounded-full"
                    style={{
                        border: '3px solid rgba(0,0,0,0.18)',
                    }}
                />
            )}

            {/* Piece */}
            {piece && <ChessPiece type={piece.type} color={piece.color} />}

            {/* Coordinate labels */}
            {col === 0 && (
                <span
                    className="absolute top-[2px] left-[3px] text-[0.55rem] font-bold leading-none select-none"
                    style={{ color: isLight ? '#b58863' : '#f0d9b5', opacity: 0.8 }}
                >
                    {8 - row}
                </span>
            )}
            {row === 7 && (
                <span
                    className="absolute bottom-[2px] right-[3px] text-[0.55rem] font-bold leading-none select-none"
                    style={{ color: isLight ? '#b58863' : '#f0d9b5', opacity: 0.8 }}
                >
                    {String.fromCharCode(97 + col)}
                </span>
            )}
        </button>
    );
};
