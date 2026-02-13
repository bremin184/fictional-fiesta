import React, { useState } from 'react';
import { X, RotateCcw, Trophy, Bot, Users } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { getGameById } from '@/data/games';

// Game Components
import { TicTacToe } from '@/components/games/TicTacToe';
import { RockPaperScissors } from '@/components/games/RockPaperScissors';
import { Hangman } from '@/components/games/Hangman';
import { ConnectFour } from '@/components/games/ConnectFour';
import { MemoryMatch } from '@/components/games/MemoryMatch';
import { TriviaGame } from '@/components/games/TriviaGame';
import { WouldYouRather } from '@/components/games/WouldYouRather';
import { WordChain } from '@/components/games/WordChain';

interface GameOverlayProps {
    gameId: string;
    isAI: boolean;
    roomId: string | null;
    isInitiator?: boolean;
    onClose: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ gameId, isAI, roomId, isInitiator = false, onClose }) => {
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
            default: return (
                <div className="text-center py-8">
                    <div className="text-5xl mb-3">{game.icon}</div>
                    <h3 className="text-lg font-bold mb-1">{game.name}</h3>
                    <p className="text-sm text-muted-foreground">Coming soon!</p>
                </div>
            );
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
            {/* Header */}
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

            {/* Game Area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                {renderGame()}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3 px-4 pb-4">
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
        </div>
    );
};
