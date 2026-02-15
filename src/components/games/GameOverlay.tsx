import React, { useState } from 'react';
import { X, RotateCcw, Trophy, Bot, Users } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { getGameById } from '@/data/games';
import { LayoutMode } from '@/hooks/useLayoutEngine';

// Game Components
import { TicTacToe } from '@/components/games/TicTacToe';
import { RockPaperScissors } from '@/components/games/RockPaperScissors';
import { Hangman } from '@/components/games/Hangman';
import { ConnectFour } from '@/components/games/ConnectFour';
import { MemoryMatch } from '@/components/games/MemoryMatch';
import { TriviaGame } from '@/components/games/TriviaGame';
import { WouldYouRather } from '@/components/games/WouldYouRather';
import { WordChain } from '@/components/games/WordChain';
import { ChessGame } from '@/components/games/chess/ChessGame';

interface GameOverlayProps {
    gameId: string;
    isAI: boolean;
    roomId: string | null;
    isInitiator?: boolean;
    onClose: () => void;
    /** Layout mode from useLayoutEngine */
    layoutMode: LayoutMode;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ gameId, isAI, roomId, isInitiator = false, onClose, layoutMode }) => {
    const [score, setScore] = useState({ player: 0, opponent: 0 });
    const [gameKey, setGameKey] = useState(0);

    const game = getGameById(gameId);
    if (!game) return null;

    const handleGameEnd = (winner: 'player' | 'opponent' | 'draw') => {
        if (winner === 'player') {
            setScore((prev) => ({ ...prev, player: prev.player + 1 }));
        } else if (winner === 'opponent') {
            setScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
        }
    };

    const handleRestart = () => setGameKey((prev) => prev + 1);

    const handleNewGame = () => {
        setScore({ player: 0, opponent: 0 });
        setGameKey((prev) => prev + 1);
    };

    const renderGame = () => {
        const props = { key: gameKey, isAI, onGameEnd: handleGameEnd, roomId: isAI ? null : roomId, isInitiator };

        switch (gameId) {
            case 'tic-tac-toe': return <TicTacToe {...props} />;
            case 'rock-paper-scissors': return <RockPaperScissors {...props} />;
            case 'hangman': return <Hangman {...props} />;
            case 'connect-four': return <ConnectFour {...props} />;
            case 'memory-match': return <MemoryMatch {...props} />;
            case 'trivia': return <TriviaGame {...props} />;
            case 'would-you-rather': return <WouldYouRather {...props} />;
            case 'word-chain': return <WordChain {...props} />;
            case 'chess': return <ChessGame {...props} />;
            default: return (
                <div className="text-center py-8">
                    <div className="text-5xl mb-3">{game.icon}</div>
                    <h3 className="text-lg font-bold mb-1">{game.name}</h3>
                    <p className="text-sm text-muted-foreground">Coming soon!</p>
                </div>
            );
        }
    };

    /** Header with game info and score */
    const renderHeader = () => (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{game.icon}</span>
                <div>
                    <h2 className="text-lg font-display font-bold">{game.name}</h2>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {isAI ? (
                            <><Bot className="w-3 h-3" /> vs AI</>
                        ) : (
                            <><Users className="w-3 h-3" /> Multiplayer</>
                        )}
                    </div>
                </div>
            </div>

            {/* Score */}
            <GlassPanel className="px-4 py-1.5 flex items-center gap-4">
                <div className="text-center">
                    <div className="text-lg font-display font-bold text-primary">{score.player}</div>
                    <div className="text-[10px] text-muted-foreground">You</div>
                </div>
                <Trophy className="w-4 h-4 text-accent" />
                <div className="text-center">
                    <div className="text-lg font-display font-bold text-secondary">{score.opponent}</div>
                    <div className="text-[10px] text-muted-foreground">{isAI ? 'AI' : 'Opp'}</div>
                </div>
            </GlassPanel>

            <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Close game"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );

    /** Control buttons */
    const renderControls = () => (
        <div className="flex justify-center gap-3 px-4 pb-4 pt-2">
            <NeonButton variant="secondary" onClick={handleRestart} className="text-sm">
                <RotateCcw className="w-4 h-4" />
                Restart
            </NeonButton>
            <NeonButton variant="ghost" onClick={handleNewGame} className="text-sm">
                New Game
            </NeonButton>
            <NeonButton variant="ghost" onClick={onClose} className="text-sm">
                Back to Video
            </NeonButton>
        </div>
    );

    // ─── FLOAT MODE: Small games in a draggable floating panel ───
    if (layoutMode === 'float') {
        return (
            <FloatingPanel
                title={`${game.icon} ${game.name}`}
                defaultCorner="bottom-right"
                defaultWidth={340}
                defaultHeight={480}
                minWidth={280}
                minHeight={350}
                zIndex={40}
                headerExtra={
                    <>
                        <GlassPanel className="px-2 py-0.5 flex items-center gap-2 text-xs">
                            <span className="font-bold text-primary">{score.player}</span>
                            <Trophy className="w-3 h-3 text-accent" />
                            <span className="font-bold text-secondary">{score.opponent}</span>
                        </GlassPanel>
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-muted transition-colors"
                            onPointerDown={e => e.stopPropagation()}
                        >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                    </>
                }
            >
                <div className="flex flex-col h-full">
                    {/* Game Area */}
                    <div className="flex-1 overflow-hidden p-3 flex items-center justify-center">
                        {renderGame()}
                    </div>
                    {/* Compact controls */}
                    <div className="flex justify-center gap-2 px-3 pb-3">
                        <NeonButton variant="secondary" onClick={handleRestart} className="text-xs px-3 py-1.5">
                            <RotateCcw className="w-3 h-3" />
                            Restart
                        </NeonButton>
                        <NeonButton variant="ghost" onClick={handleNewGame} className="text-xs px-3 py-1.5">
                            New
                        </NeonButton>
                    </div>
                </div>
            </FloatingPanel>
        );
    }

    // ─── SPLIT MODE: Rendered as a grid column alongside video ───
    if (layoutMode === 'split') {
        return (
            <div className="flex flex-col h-full overflow-hidden bg-card/50 backdrop-blur-sm border-l border-border/30 animate-in slide-in-from-right duration-300">
                {renderHeader()}
                <div className="flex-1 overflow-hidden p-4 flex items-center justify-center">
                    {renderGame()}
                </div>
                {renderControls()}
            </div>
        );
    }

    // ─── GAME-DUAL MODE: Game as center column in three-column grid ───
    if (layoutMode === 'game-dual') {
        // Chess manages its own full chrome — no GameOverlay header/controls
        const isChess = gameId === 'chess';
        return (
            <div className="flex flex-col h-full overflow-hidden bg-card/50 backdrop-blur-sm border-x border-border/30 animate-in fade-in duration-200">
                {!isChess && renderHeader()}
                <div className={`flex-1 overflow-hidden flex items-center justify-center ${isChess ? '' : 'p-4'}`}>
                    {renderGame()}
                </div>
                {!isChess && renderControls()}
            </div>
        );
    }

    // ─── DOMINANT MODE: Game takes primary space, full overlay ───
    // For mobile large games (three-column not feasible)
    return (
        <div className="absolute inset-0 z-[var(--z-game-panel)] bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
            {renderHeader()}
            <div className="flex-1 overflow-hidden p-4 flex items-center justify-center">
                {renderGame()}
            </div>
            {renderControls()}
        </div>
    );
};
