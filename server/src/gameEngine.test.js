/**
 * Game Engine Unit Tests
 * Run with: node --test server/src/gameEngine.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
    createGame,
    makeMove,
    resetGame,
    endGame,
    tttCheckWinner,
    c4CheckWinner,
    rpsGetWinner,
} = require('./gameEngine');

// ── TIC TAC TOE ────────────────────────────────────────────────────────────

describe('TicTacToe Engine', () => {
    it('should create a new game', () => {
        const session = createGame('tic-tac-toe', 'room-1', 'p1', 'p2');
        assert.ok(session);
        assert.strictEqual(session.gameId, 'tic-tac-toe');
        assert.strictEqual(session.currentTurn, 'X');
        assert.strictEqual(session.status, 'playing');
        assert.deepStrictEqual(session.board, Array(9).fill(null));
    });

    it('should reject move on wrong turn', () => {
        createGame('tic-tac-toe', 'room-2', 'p1', 'p2');
        // p2 is O, but X goes first
        const result = makeMove('room-2', 'p2', { cell: 0 });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'Not your turn');
        endGame('room-2');
    });

    it('should reject move on occupied cell', () => {
        createGame('tic-tac-toe', 'room-3', 'p1', 'p2');
        makeMove('room-3', 'p1', { cell: 4 }); // X plays center
        makeMove('room-3', 'p2', { cell: 0 }); // O plays
        // X tries to play on O's cell
        const result = makeMove('room-3', 'p1', { cell: 0 });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'Cell is already occupied');
        endGame('room-3');
    });

    it('should detect a winner', () => {
        createGame('tic-tac-toe', 'room-4', 'p1', 'p2');
        makeMove('room-4', 'p1', { cell: 0 }); // X
        makeMove('room-4', 'p2', { cell: 3 }); // O
        makeMove('room-4', 'p1', { cell: 1 }); // X
        makeMove('room-4', 'p2', { cell: 4 }); // O
        const result = makeMove('room-4', 'p1', { cell: 2 }); // X wins top row

        assert.ok(result.state);
        assert.strictEqual(result.state.status, 'won');
        assert.strictEqual(result.state.winner, 'X');
        endGame('room-4');
    });

    it('should detect a draw', () => {
        createGame('tic-tac-toe', 'room-5', 'p1', 'p2');
        // X O X
        // X X O
        // O X O
        const moves = [
            ['p1', 0], ['p2', 1], ['p1', 2],
            ['p1', 3], ['p1', 4], ['p2', 5],
            ['p2', 6], ['p1', 7], ['p2', 8],
        ];
        // Sequence: X(0), O(1), X(2), X(3)... wait, turns alternate
        // Let me fix: p1=X, p2=O alternating:
        endGame('room-5');
        createGame('tic-tac-toe', 'room-5', 'p1', 'p2');
        makeMove('room-5', 'p1', { cell: 0 }); // X
        makeMove('room-5', 'p2', { cell: 1 }); // O
        makeMove('room-5', 'p1', { cell: 2 }); // X
        makeMove('room-5', 'p2', { cell: 4 }); // O
        makeMove('room-5', 'p1', { cell: 3 }); // X
        makeMove('room-5', 'p2', { cell: 5 }); // O
        makeMove('room-5', 'p1', { cell: 7 }); // X
        makeMove('room-5', 'p2', { cell: 6 }); // O
        const result = makeMove('room-5', 'p1', { cell: 8 }); // X → draw
        // Board: X O X / X O O / O X X
        assert.ok(result.state);
        assert.strictEqual(result.state.status, 'draw');
        endGame('room-5');
    });

    it('should reject move after game is over', () => {
        createGame('tic-tac-toe', 'room-6', 'p1', 'p2');
        makeMove('room-6', 'p1', { cell: 0 });
        makeMove('room-6', 'p2', { cell: 3 });
        makeMove('room-6', 'p1', { cell: 1 });
        makeMove('room-6', 'p2', { cell: 4 });
        makeMove('room-6', 'p1', { cell: 2 }); // X wins

        const result = makeMove('room-6', 'p2', { cell: 5 });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'Game is already over');
        endGame('room-6');
    });

    it('should reject invalid cell index', () => {
        createGame('tic-tac-toe', 'room-7', 'p1', 'p2');
        const result = makeMove('room-7', 'p1', { cell: 99 });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'Invalid cell index');
        endGame('room-7');
    });

    it('tttCheckWinner should find row wins', () => {
        assert.strictEqual(tttCheckWinner(['X', 'X', 'X', null, null, null, null, null, null]), 'X');
        assert.strictEqual(tttCheckWinner([null, null, null, 'O', 'O', 'O', null, null, null]), 'O');
    });

    it('should reset game and swap sides', () => {
        createGame('tic-tac-toe', 'room-8', 'p1', 'p2');
        const newSession = resetGame('room-8');
        assert.ok(newSession);
        // After reset, O (p2) becomes X (first mover)
        assert.strictEqual(newSession.players.X, 'p2');
        assert.strictEqual(newSession.players.O, 'p1');
        endGame('room-8');
    });
});

// ── CONNECT FOUR ────────────────────────────────────────────────────────────

describe('ConnectFour Engine', () => {
    it('should create a 6x7 board', () => {
        const session = createGame('connect-four', 'c4-1', 'p1', 'p2');
        assert.ok(session);
        assert.strictEqual(session.board.length, 6);
        assert.strictEqual(session.board[0].length, 7);
        assert.strictEqual(session.currentTurn, 'red');
        endGame('c4-1');
    });

    it('should drop piece to bottom row', () => {
        createGame('connect-four', 'c4-2', 'p1', 'p2');
        const result = makeMove('c4-2', 'p1', { column: 3 });
        assert.ok(result.state);
        assert.strictEqual(result.state.board[5][3], 'red');
        assert.strictEqual(result.state.currentTurn, 'yellow');
        endGame('c4-2');
    });

    it('should stack pieces in same column', () => {
        createGame('connect-four', 'c4-3', 'p1', 'p2');
        makeMove('c4-3', 'p1', { column: 0 }); // red at row 5
        makeMove('c4-3', 'p2', { column: 0 }); // yellow at row 4
        const result = makeMove('c4-3', 'p1', { column: 0 }); // red at row 3
        assert.strictEqual(result.state.board[5][0], 'red');
        assert.strictEqual(result.state.board[4][0], 'yellow');
        assert.strictEqual(result.state.board[3][0], 'red');
        endGame('c4-3');
    });

    it('should reject move on full column', () => {
        createGame('connect-four', 'c4-4', 'p1', 'p2');
        for (let i = 0; i < 6; i++) {
            const player = i % 2 === 0 ? 'p1' : 'p2';
            makeMove('c4-4', player, { column: 0 });
        }
        const result = makeMove('c4-4', 'p1', { column: 0 });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'Column is full');
        endGame('c4-4');
    });

    it('should detect horizontal win', () => {
        createGame('connect-four', 'c4-5', 'p1', 'p2');
        // Red plays columns 0,1,2,3; Yellow plays columns 0,1,2 (row above)
        makeMove('c4-5', 'p1', { column: 0 }); // red row5 col0
        makeMove('c4-5', 'p2', { column: 0 }); // yellow row4 col0
        makeMove('c4-5', 'p1', { column: 1 }); // red row5 col1
        makeMove('c4-5', 'p2', { column: 1 }); // yellow row4 col1
        makeMove('c4-5', 'p1', { column: 2 }); // red row5 col2
        makeMove('c4-5', 'p2', { column: 2 }); // yellow row4 col2
        const result = makeMove('c4-5', 'p1', { column: 3 }); // red row5 col3 → WIN

        assert.ok(result.state);
        assert.strictEqual(result.state.status, 'won');
        assert.strictEqual(result.state.winner, 'red');
        endGame('c4-5');
    });

    it('should reject invalid column', () => {
        createGame('connect-four', 'c4-6', 'p1', 'p2');
        const result = makeMove('c4-6', 'p1', { column: 10 });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'Invalid column');
        endGame('c4-6');
    });
});

// ── ROCK PAPER SCISSORS ─────────────────────────────────────────────────────

describe('RPS Engine', () => {
    it('should create a game in choosing status', () => {
        const session = createGame('rock-paper-scissors', 'rps-1', 'p1', 'p2');
        assert.ok(session);
        assert.strictEqual(session.status, 'choosing');
        assert.strictEqual(session.choices['p1'], null);
        assert.strictEqual(session.choices['p2'], null);
        endGame('rps-1');
    });

    it('should lock in a choice without revealing', () => {
        createGame('rock-paper-scissors', 'rps-2', 'p1', 'p2');
        const result = makeMove('rps-2', 'p1', { choice: 'rock' });
        assert.ok(result.state);
        assert.strictEqual(result.state.status, 'choosing'); // still choosing
        assert.strictEqual(result.state.choices['p1'], 'rock');
        assert.strictEqual(result.state.choices['p2'], null);
        endGame('rps-2');
    });

    it('should reveal when both choose', () => {
        createGame('rock-paper-scissors', 'rps-3', 'p1', 'p2');
        makeMove('rps-3', 'p1', { choice: 'rock' });
        const result = makeMove('rps-3', 'p2', { choice: 'scissors' });
        assert.ok(result.state);
        assert.strictEqual(result.state.status, 'reveal');
        assert.strictEqual(result.state.result, 'player1');
        assert.strictEqual(result.state.winner, 'p1');
        endGame('rps-3');
    });

    it('should handle a draw', () => {
        createGame('rock-paper-scissors', 'rps-4', 'p1', 'p2');
        makeMove('rps-4', 'p1', { choice: 'paper' });
        const result = makeMove('rps-4', 'p2', { choice: 'paper' });
        assert.ok(result.state);
        assert.strictEqual(result.state.result, 'draw');
        assert.strictEqual(result.state.winner, null);
        endGame('rps-4');
    });

    it('should reject double choice', () => {
        createGame('rock-paper-scissors', 'rps-5', 'p1', 'p2');
        makeMove('rps-5', 'p1', { choice: 'rock' });
        const result = makeMove('rps-5', 'p1', { choice: 'paper' });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'You already made your choice');
        endGame('rps-5');
    });

    it('should reject invalid choice', () => {
        createGame('rock-paper-scissors', 'rps-6', 'p1', 'p2');
        const result = makeMove('rps-6', 'p1', { choice: 'lizard' });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'Invalid choice. Must be rock, paper, or scissors');
        endGame('rps-6');
    });

    it('rpsGetWinner should determine all outcomes', () => {
        assert.strictEqual(rpsGetWinner('rock', 'scissors'), 'player1');
        assert.strictEqual(rpsGetWinner('scissors', 'paper'), 'player1');
        assert.strictEqual(rpsGetWinner('paper', 'rock'), 'player1');
        assert.strictEqual(rpsGetWinner('scissors', 'rock'), 'player2');
        assert.strictEqual(rpsGetWinner('rock', 'rock'), 'draw');
    });
});

// ── GENERAL ENGINE ──────────────────────────────────────────────────────────

describe('Game Engine Facade', () => {
    it('should return error for unknown game', () => {
        const result = createGame('chess', 'unknown-1', 'p1', 'p2');
        assert.strictEqual(result, null);
    });

    it('should return error for non-existent room', () => {
        const result = makeMove('nonexistent', 'p1', { cell: 0 });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'No active game in this room');
    });

    it('endGame should remove session', () => {
        createGame('tic-tac-toe', 'end-1', 'p1', 'p2');
        endGame('end-1');
        const result = makeMove('end-1', 'p1', { cell: 0 });
        assert.ok(result.error);
        assert.strictEqual(result.error, 'No active game in this room');
    });
});
