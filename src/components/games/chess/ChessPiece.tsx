import React from 'react';

const PIECE_UNICODE: Record<string, Record<string, string>> = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

interface ChessPieceProps {
    type: string;
    color: 'w' | 'b';
    isAnimating?: boolean;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, isAnimating = false }) => {
    const symbol = PIECE_UNICODE[color]?.[type] || '';

    return (
        <span
            className={`
        select-none pointer-events-none text-[clamp(1.5rem,3.5vw,2.8rem)] leading-none
        drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]
        ${isAnimating ? 'animate-piece-place' : ''}
        ${color === 'w' ? 'text-white' : 'text-gray-900'}
      `}
            style={{ filter: color === 'w' ? 'drop-shadow(0 0 1px rgba(0,0,0,0.8))' : 'drop-shadow(0 0 1px rgba(255,255,255,0.4))' }}
        >
            {symbol}
        </span>
    );
};
