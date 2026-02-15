import React from 'react';

interface ChessPieceProps {
    type: string;
    color: 'w' | 'b';
    isAnimating?: boolean;
}

/**
 * SVG chess pieces — standard Wikimedia-style design.
 * Each piece is an inline SVG that scales to fill its container.
 * White pieces: filled white with black stroke.
 * Black pieces: filled dark with lighter stroke.
 */
export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, isAnimating = false }) => {
    const svg = PIECE_SVGS[color]?.[type];
    if (!svg) return null;

    return (
        <div
            className="w-[80%] h-[80%] flex items-center justify-center select-none pointer-events-none"
            style={{
                filter: color === 'w'
                    ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                    : 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
                transition: 'transform 0.15s ease',
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

// Standard chess piece SVGs (45×45 viewBox, Wikimedia-style)
const w = { fill: '#fff', stroke: '#000', strokeWidth: '1.5' };
const b = { fill: '#1a1a1a', stroke: '#666', strokeWidth: '1.5' };

const makeSvg = (inner: string, viewBox = '0 0 45 45') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">${inner}</svg>`;

// ── White Pieces ──

const wKing = makeSvg(`
  <g fill="${w.fill}" stroke="${w.stroke}" stroke-width="${w.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6M20 8h5"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/>
    <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"/>
    <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0"/>
  </g>
`);

const wQueen = makeSvg(`
  <g fill="${w.fill}" stroke="${w.stroke}" stroke-width="${w.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-3.5-7-5.5 9-5.5-9-3.5 7L6 13.5 9 26z"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none"/>
    <circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/>
  </g>
`);

const wRook = makeSvg(`
  <g fill="${w.fill}" stroke="${w.stroke}" stroke-width="${w.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"/>
    <path d="M14 29.5v-13h17v13H14z"/>
    <path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z"/>
    <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23" fill="none" stroke="${w.stroke}" stroke-width="1"/>
  </g>
`);

const wBishop = makeSvg(`
  <g fill="${w.fill}" stroke="${w.stroke}" stroke-width="${w.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
    <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
    <path d="M25 8a2.5 2.5 0 11-5 0 2.5 2.5 0 115 0z"/>
    <path d="M17.5 26h10M15 30h15" fill="none" stroke="${w.stroke}" stroke-width="1"/>
  </g>
`);

const wKnight = makeSvg(`
  <g fill="${w.fill}" stroke="${w.stroke}" stroke-width="${w.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/>
    <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/>
    <path d="M9.5 25.5a.5.5 0 11-1 0 .5.5 0 111 0zM14.933 15.75a.5 1.5 30 11-.866-.5.5 1.5 30 11.866.5z" fill="${w.stroke}"/>
  </g>
`);

const wPawn = makeSvg(`
  <g fill="${w.fill}" stroke="${w.stroke}" stroke-width="${w.strokeWidth}" stroke-linecap="round">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39h23.5C34.5 31.58 30.09 27.09 27.09 26.03A5.98 5.98 0 0029.5 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>
  </g>
`);

// ── Black Pieces ──

const bKing = makeSvg(`
  <g fill="${b.fill}" stroke="${b.stroke}" stroke-width="${b.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6" stroke="#fff"/><path d="M20 8h5" stroke="#fff"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/>
    <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"/>
    <path d="M12.5 30c5.5-3 14.5-3 20 0" fill="none" stroke="#fff"/>
    <path d="M12.5 33.5c5.5-3 14.5-3 20 0" fill="none" stroke="#fff"/>
    <path d="M12.5 37c5.5-3 14.5-3 20 0" fill="none" stroke="#fff"/>
  </g>
`);

const bQueen = makeSvg(`
  <g fill="${b.fill}" stroke="${b.stroke}" stroke-width="${b.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="12" r="2.75" fill="${b.fill}" stroke="${b.stroke}"/>
    <circle cx="14" cy="9" r="2.75" fill="${b.fill}" stroke="${b.stroke}"/>
    <circle cx="22.5" cy="8" r="2.75" fill="${b.fill}" stroke="${b.stroke}"/>
    <circle cx="31" cy="9" r="2.75" fill="${b.fill}" stroke="${b.stroke}"/>
    <circle cx="39" cy="12" r="2.75" fill="${b.fill}" stroke="${b.stroke}"/>
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-3.5-7-5.5 9-5.5-9-3.5 7L6 13.5 9 26z" stroke-linecap="butt"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/>
    <path d="M11 38.5a35 35 1 0023 0" fill="none" stroke="#fff"/>
    <path d="M11 29a35 35 1 0023 0" fill="none" stroke="#fff" stroke-width="1"/>
    <path d="M12.5 31.5h20" fill="none" stroke="#fff" stroke-width="1"/>
    <path d="M12 33.5a35 35 1 0021 0" fill="none" stroke="#fff" stroke-width="1"/>
  </g>
`);

const bRook = makeSvg(`
  <g fill="${b.fill}" stroke="${b.stroke}" stroke-width="${b.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"/>
    <path d="M14 29.5v-13h17v13H14z"/>
    <path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z"/>
    <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23" fill="none" stroke="#fff" stroke-width="1"/>
  </g>
`);

const bBishop = makeSvg(`
  <g fill="${b.fill}" stroke="${b.stroke}" stroke-width="${b.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
    <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
    <path d="M25 8a2.5 2.5 0 11-5 0 2.5 2.5 0 115 0z"/>
    <path d="M17.5 26h10M15 30h15" fill="none" stroke="#fff" stroke-width="1"/>
  </g>
`);

const bKnight = makeSvg(`
  <g fill="${b.fill}" stroke="${b.stroke}" stroke-width="${b.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/>
    <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/>
    <path d="M9.5 25.5a.5.5 0 11-1 0 .5.5 0 111 0z" fill="#fff" stroke="#fff"/>
    <path d="M14.933 15.75a.5 1.5 30 11-.866-.5.5 1.5 30 11.866.5z" fill="#fff" stroke="#fff"/>
  </g>
`);

const bPawn = makeSvg(`
  <g fill="${b.fill}" stroke="${b.stroke}" stroke-width="${b.strokeWidth}" stroke-linecap="round">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39h23.5C34.5 31.58 30.09 27.09 27.09 26.03A5.98 5.98 0 0029.5 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>
  </g>
`);

const PIECE_SVGS: Record<string, Record<string, string>> = {
    w: { k: wKing, q: wQueen, r: wRook, b: wBishop, n: wKnight, p: wPawn },
    b: { k: bKing, q: bQueen, r: bRook, b: bBishop, n: bKnight, p: bPawn },
};
