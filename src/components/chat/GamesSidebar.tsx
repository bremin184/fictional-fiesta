import React from 'react';
import { Gamepad2, X } from 'lucide-react';
import { Game } from '@/types';

interface GamesSidebarProps {
    games: Game[];
    connectedUser: boolean;
    onSelectGame: (gameId: string) => void;
    onClose: () => void;
}

export const GamesSidebar: React.FC<GamesSidebarProps> = ({
    games,
    connectedUser,
    onSelectGame,
    onClose,
}) => {
    const displayGames = connectedUser
        ? games
        : games.filter((g) => g.supportsAI);

    return (
        <div className="w-full lg:w-auto flex flex-col overflow-hidden bg-gradient-to-br from-muted/20 to-card/50 border-l border-border/30 animate-slide-in-right transition-opacity duration-300 ease-out">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-secondary" />
                    Games
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                    {displayGames.map((game) => (
                        <button
                            key={game.id}
                            onClick={() => onSelectGame(game.id)}
                            className="p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-primary/50 transition-all text-left group"
                        >
                            <div className="text-2xl mb-1">{game.icon}</div>
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                {game.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                {game.description}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
