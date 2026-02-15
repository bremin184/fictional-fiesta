import React from 'react';
import { Square } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import { cn } from '@/lib/utils';

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

    return (
        <button
            className={cn(
                'relative aspect-square flex items-center justify-center transition-colors duration-150',
                // Base colors
                isLight ? 'bg-amber-100' : 'bg-amber-800',
                // States
                isSelected && 'ring-2 ring-inset ring-sky-400 bg-sky-300/60',
                isLastMove && !isSelected && (isLight ? 'bg-yellow-200' : 'bg-yellow-700'),
                isCheck && 'bg-red-500/70 ring-2 ring-inset ring-red-400',
                // Hover
                !isSelected && !isCheck && 'hover:brightness-110',
            )}
            onClick={() => onClick(square)}
            aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
        >
            {/* Legal move indicator */}
            {isLegalMove && !piece && (
                <div className="absolute w-[30%] h-[30%] rounded-full bg-black/20" />
            )}
            {isLegalMove && piece && (
                <div className="absolute inset-0 rounded-sm ring-[3px] ring-inset ring-black/20" />
            )}

            {/* Piece */}
            {piece && <ChessPiece type={piece.type} color={piece.color} />}

            {/* Coordinate labels */}
            {col === 0 && (
                <span className={cn(
                    'absolute top-0.5 left-0.5 text-[0.55rem] font-bold leading-none',
                    isLight ? 'text-amber-800/60' : 'text-amber-100/60',
                )}>
                    {8 - row}
                </span>
            )}
            {row === 7 && (
                <span className={cn(
                    'absolute bottom-0.5 right-0.5 text-[0.55rem] font-bold leading-none',
                    isLight ? 'text-amber-800/60' : 'text-amber-100/60',
                )}>
                    {String.fromCharCode(97 + col)}
                </span>
            )}
        </button>
    );
};
