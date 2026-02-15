/**
 * Server-authoritative game engine.
 * Manages game state, validates moves, detects winners.
 */

// Active game sessions: roomId -> GameSession
const activeGames = new Map();

// ─── TIC TAC TOE ENGINE ─────────────────────────────────────────────────────

const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
];

function createTicTacToe(player1, player2) {
    return {
        gameId: 'tic-tac-toe',
        board: Array(9).fill(null),
        players: { X: player1, O: player2 },
        currentTurn: 'X',
        status: 'playing', // 'playing' | 'won' | 'draw'
        winner: null,
    };
}

function tttCheckWinner(board) {
    for (const [a, b, c] of WINNING_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // 'X' or 'O'
        }
    }
    if (board.every(cell => cell !== null)) return 'draw';
    return null;
}

function tttMakeMove(state, socketId, move) {
    const { cell } = move;

    // Validate cell index
    if (typeof cell !== 'number' || cell < 0 || cell > 8) {
        return { error: 'Invalid cell index' };
    }

    // Validate turn
    const playerSymbol = state.players.X === socketId ? 'X' :
        state.players.O === socketId ? 'O' : null;
    if (!playerSymbol) {
        return { error: 'You are not in this game' };
    }
    if (playerSymbol !== state.currentTurn) {
        return { error: 'Not your turn' };
    }

    // Validate cell is empty
    if (state.board[cell] !== null) {
        return { error: 'Cell is already occupied' };
    }

    // Apply move
    state.board[cell] = playerSymbol;

    // Check result
    const result = tttCheckWinner(state.board);
    if (result === 'draw') {
        state.status = 'draw';
        state.winner = null;
    } else if (result) {
        state.status = 'won';
        state.winner = result;
    } else {
        state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
    }

    return { state };
}

// ─── CONNECT FOUR ENGINE ────────────────────────────────────────────────────

const C4_ROWS = 6;
const C4_COLS = 7;

function createConnectFour(player1, player2) {
    return {
        gameId: 'connect-four',
        board: Array.from({ length: C4_ROWS }, () => Array(C4_COLS).fill(null)),
        players: { red: player1, yellow: player2 },
        currentTurn: 'red',
        status: 'playing',
        winner: null,
    };
}

function c4CheckWinner(board) {
    // Horizontal
    for (let r = 0; r < C4_ROWS; r++) {
        for (let c = 0; c <= C4_COLS - 4; c++) {
            const cell = board[r][c];
            if (cell && cell === board[r][c + 1] && cell === board[r][c + 2] && cell === board[r][c + 3]) {
                return cell;
            }
        }
    }
    // Vertical
    for (let c = 0; c < C4_COLS; c++) {
        for (let r = 0; r <= C4_ROWS - 4; r++) {
            const cell = board[r][c];
            if (cell && cell === board[r + 1][c] && cell === board[r + 2][c] && cell === board[r + 3][c]) {
                return cell;
            }
        }
    }
    // Diagonal down-right
    for (let r = 0; r <= C4_ROWS - 4; r++) {
        for (let c = 0; c <= C4_COLS - 4; c++) {
            const cell = board[r][c];
            if (cell && cell === board[r + 1][c + 1] && cell === board[r + 2][c + 2] && cell === board[r + 3][c + 3]) {
                return cell;
            }
        }
    }
    // Diagonal up-right
    for (let r = 3; r < C4_ROWS; r++) {
        for (let c = 0; c <= C4_COLS - 4; c++) {
            const cell = board[r][c];
            if (cell && cell === board[r - 1][c + 1] && cell === board[r - 2][c + 2] && cell === board[r - 3][c + 3]) {
                return cell;
            }
        }
    }
    // Draw
    if (board.every(row => row.every(cell => cell !== null))) {
        return 'draw';
    }
    return null;
}

function c4GetLowestRow(board, col) {
    for (let r = C4_ROWS - 1; r >= 0; r--) {
        if (board[r][col] === null) return r;
    }
    return -1;
}

function c4MakeMove(state, socketId, move) {
    const { column } = move;

    // Validate column
    if (typeof column !== 'number' || column < 0 || column >= C4_COLS) {
        return { error: 'Invalid column' };
    }

    // Validate turn
    const playerColor = state.players.red === socketId ? 'red' :
        state.players.yellow === socketId ? 'yellow' : null;
    if (!playerColor) {
        return { error: 'You are not in this game' };
    }
    if (playerColor !== state.currentTurn) {
        return { error: 'Not your turn' };
    }

    // Find lowest empty row
    const row = c4GetLowestRow(state.board, column);
    if (row === -1) {
        return { error: 'Column is full' };
    }

    // Apply move
    state.board[row][column] = playerColor;

    // Check result
    const result = c4CheckWinner(state.board);
    if (result === 'draw') {
        state.status = 'draw';
        state.winner = null;
    } else if (result) {
        state.status = 'won';
        state.winner = result;
    } else {
        state.currentTurn = state.currentTurn === 'red' ? 'yellow' : 'red';
    }

    return { state };
}

// ─── ROCK PAPER SCISSORS ENGINE ─────────────────────────────────────────────

function createRPS(player1, player2) {
    return {
        gameId: 'rock-paper-scissors',
        players: { player1, player2 },
        choices: { [player1]: null, [player2]: null },
        status: 'choosing', // 'choosing' | 'reveal'
        winner: null,
        result: null,
    };
}

const RPS_VALID = ['rock', 'paper', 'scissors'];

function rpsGetWinner(choice1, choice2) {
    if (choice1 === choice2) return 'draw';
    if (
        (choice1 === 'rock' && choice2 === 'scissors') ||
        (choice1 === 'paper' && choice2 === 'rock') ||
        (choice1 === 'scissors' && choice2 === 'paper')
    ) {
        return 'player1';
    }
    return 'player2';
}

function rpsMakeMove(state, socketId, move) {
    const { choice } = move;

    // Validate choice
    if (!RPS_VALID.includes(choice)) {
        return { error: 'Invalid choice. Must be rock, paper, or scissors' };
    }

    // Validate player
    if (socketId !== state.players.player1 && socketId !== state.players.player2) {
        return { error: 'You are not in this game' };
    }

    // Validate not already chosen
    if (state.choices[socketId] !== null) {
        return { error: 'You already made your choice' };
    }

    // Lock in choice
    state.choices[socketId] = choice;

    // Check if both have chosen
    const p1Choice = state.choices[state.players.player1];
    const p2Choice = state.choices[state.players.player2];

    if (p1Choice && p2Choice) {
        state.status = 'reveal';
        const result = rpsGetWinner(p1Choice, p2Choice);
        state.result = result;
        if (result !== 'draw') {
            state.winner = result === 'player1' ? state.players.player1 : state.players.player2;
        }
    }

    return { state };
}

// ─── CHESS ENGINE (thin relay — chess.js validates on client) ────────────────

function createChess(player1, player2) {
    return {
        gameId: 'chess',
        // Starting FEN position
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        players: { w: player1, b: player2 },
        currentTurn: 'w',
        status: 'playing',
        winner: null,
        lastMove: null,
        moveHistory: [],
    };
}

function chessMakeMove(state, socketId, move) {
    // Validate player
    const playerColor = state.players.w === socketId ? 'w' :
        state.players.b === socketId ? 'b' : null;
    if (!playerColor) return { error: 'You are not in this game' };
    if (playerColor !== state.currentTurn) return { error: 'Not your turn' };

    // Client sends validated FEN — accept it
    if (!move.fen) return { error: 'Missing FEN in move' };

    state.fen = move.fen;
    state.lastMove = { from: move.from, to: move.to };
    state.moveHistory.push(`${move.from}-${move.to}`);
    state.currentTurn = state.currentTurn === 'w' ? 'b' : 'w';

    // Check for game end conditions (sent by client)
    if (move.isCheckmate) {
        state.status = 'won';
        state.winner = playerColor; // The player who made the checkmate move wins
    } else if (move.isDraw || move.isStalemate) {
        state.status = 'draw';
    }

    return { state };
}

// ─── ENGINE FACADE ──────────────────────────────────────────────────────────

const GAME_FACTORIES = {
    'tic-tac-toe': createTicTacToe,
    'connect-four': createConnectFour,
    'rock-paper-scissors': createRPS,
    'chess': createChess,
};

const MOVE_HANDLERS = {
    'tic-tac-toe': tttMakeMove,
    'connect-four': c4MakeMove,
    'rock-paper-scissors': rpsMakeMove,
    'chess': chessMakeMove,
};

function createGame(gameId, roomId, player1, player2) {
    const factory = GAME_FACTORIES[gameId];
    if (!factory) return null;

    const session = factory(player1, player2);
    session.roomId = roomId;
    activeGames.set(roomId, session);
    return session;
}

function makeMove(roomId, socketId, move) {
    const session = activeGames.get(roomId);
    if (!session) return { error: 'No active game in this room' };

    if (session.status === 'won' || session.status === 'draw') {
        return { error: 'Game is already over' };
    }

    const handler = MOVE_HANDLERS[session.gameId];
    if (!handler) return { error: 'Unknown game type' };

    return handler(session, socketId, move);
}

function getState(roomId) {
    return activeGames.get(roomId) || null;
}

function resetGame(roomId) {
    const session = activeGames.get(roomId);
    if (!session) return null;

    const factory = GAME_FACTORIES[session.gameId];
    if (!factory) return null;

    // Re-create with same players, potentially swap who goes first
    let newSession;
    if (session.gameId === 'tic-tac-toe') {
        // Swap X and O
        newSession = factory(session.players.O, session.players.X);
    } else if (session.gameId === 'connect-four') {
        newSession = factory(session.players.yellow, session.players.red);
    } else if (session.gameId === 'chess') {
        // Swap colors
        newSession = factory(session.players.b, session.players.w);
    } else {
        // RPS: same players
        newSession = factory(session.players.player1, session.players.player2);
    }

    newSession.roomId = roomId;
    activeGames.set(roomId, newSession);
    return newSession;
}

function endGame(roomId) {
    activeGames.delete(roomId);
}

module.exports = {
    createGame,
    makeMove,
    getState,
    resetGame,
    endGame,
    activeGames,
    // Exported for testing
    tttCheckWinner,
    c4CheckWinner,
    rpsGetWinner,
};
