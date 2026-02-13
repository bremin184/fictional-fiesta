import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Zap, Bot, Users, RotateCcw, Trophy, Video } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useApp } from '@/context/AppContext';
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

const GamePlay: React.FC = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const isAI = searchParams.get('ai') === 'true';
  const roomId = searchParams.get('roomId') || null;
  const { connectedUser } = useApp();

  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [gameKey, setGameKey] = useState(0);

  const game = gameId ? getGameById(gameId) : null;

  const handleGameEnd = (winner: 'player' | 'opponent' | 'draw') => {
    if (winner === 'player') {
      setScore((prev) => ({ ...prev, player: prev.player + 1 }));
    } else if (winner === 'opponent') {
      setScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
    }
  };

  const handleRestart = () => {
    setGameKey((prev) => prev + 1);
  };

  const handleNewGame = () => {
    setScore({ player: 0, opponent: 0 });
    setGameKey((prev) => prev + 1);
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassPanel className="p-8 text-center">
          <h2 className="text-2xl font-display font-bold mb-4">Game Not Found</h2>
          <NeonButton onClick={() => navigate('/games')}>Back to Games</NeonButton>
        </GlassPanel>
      </div>
    );
  }

  const renderGame = () => {
    const props = { key: gameKey, isAI, onGameEnd: handleGameEnd, roomId: isAI ? null : roomId };

    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToe {...props} />;
      case 'rock-paper-scissors':
        return <RockPaperScissors {...props} />;
      case 'hangman':
        return <Hangman {...props} />;
      case 'connect-four':
        return <ConnectFour {...props} />;
      case 'memory-match':
        return <MemoryMatch {...props} />;
      case 'trivia':
        return <TriviaGame {...props} />;
      case 'would-you-rather':
        return <WouldYouRather {...props} />;
      case 'word-chain':
        return <WordChain {...props} />;
      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{game.icon}</div>
            <h3 className="text-xl font-display font-bold mb-2">{game.name}</h3>
            <p className="text-muted-foreground mb-6">{game.description}</p>
            <p className="text-sm text-muted-foreground">
              This game is coming soon!
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col lg:grid lg:gap-4 lg:grid-cols-[12rem_1fr_12rem] lg:p-4 overflow-hidden">
      {/* Local Video Panel - Desktop Only */}
      <div className="hidden lg:flex flex-col rounded-2xl border border-primary/30 overflow-hidden bg-gradient-to-br from-muted to-card shadow-neon-purple">
        <div className="flex-1 flex items-center justify-center bg-card relative">
          {/* Placeholder for local video stream */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="w-12 h-12 text-muted-foreground opacity-30" />
          </div>
          {/* User indicator */}
          <div className="absolute top-2 left-2 right-2 text-center text-xs font-medium truncate bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1">
            You (Local)
          </div>
        </div>
      </div>

      {/* Main Game Area - Full width on mobile, center on desktop */}
      <div className="flex flex-col overflow-hidden flex-1 lg:flex-initial">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between mb-4 px-4 lg:px-0 pt-4 lg:pt-0">
            <button
              onClick={() => navigate('/games')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <h1 className="text-xl lg:text-2xl font-display font-bold text-gradient flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-neon rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:inline">VISHA</span>
            </h1>

            <div className="flex items-center gap-2 text-xs lg:text-sm">
              {isAI ? (
                <>
                  <Bot className="w-4 h-4 text-secondary" />
                  <span>vs AI</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-primary" />
                  <span>Online</span>
                </>
              )}
            </div>
          </header>

          {/* Game Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 px-4 lg:px-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl lg:text-4xl">{game.icon}</span>
              <div className="min-w-0">
                <h2 className="text-lg lg:text-2xl font-display font-bold truncate">{game.name}</h2>
                <p className="text-xs text-muted-foreground capitalize">{game.category}</p>
              </div>
            </div>

            {/* Score */}
            <GlassPanel className="px-4 lg:px-6 py-2 lg:py-3 flex items-center gap-3 lg:gap-6 flex-shrink-0">
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-display font-bold text-primary">{score.player}</div>
                <div className="text-xs text-muted-foreground">You</div>
              </div>
              <Trophy className="w-4 h-4 lg:w-6 lg:h-6 text-accent" />
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-display font-bold text-secondary">{score.opponent}</div>
                <div className="text-xs text-muted-foreground">{isAI ? 'AI' : 'Opponent'}</div>
              </div>
            </GlassPanel>
          </div>

          {/* Game Area */}
          <div className="flex-1 overflow-auto px-4 lg:px-0 pb-4">
            <GlassPanel className="p-4 lg:p-6 h-full min-h-[300px]">
              {renderGame()}
            </GlassPanel>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 px-4 lg:px-0 pb-4">
            <NeonButton variant="secondary" onClick={handleRestart} className="text-sm lg:text-base">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Restart Round</span>
            </NeonButton>
            <NeonButton variant="ghost" onClick={handleNewGame} className="text-sm lg:text-base">
              <span className="hidden sm:inline">New Game</span>
              <span className="sm:hidden">New</span>
            </NeonButton>
          </div>
        </div>
      </div>

      {/* Remote Video Panel - Desktop Only */}
      <div className="hidden lg:flex flex-col rounded-2xl border border-primary/30 overflow-hidden bg-gradient-to-br from-muted to-card shadow-neon-purple">
        {connectedUser ? (
          <>
            <div className="flex-1 flex items-center justify-center bg-card relative">
              {/* Placeholder for remote video stream */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="w-12 h-12 text-muted-foreground opacity-30" />
              </div>
              {/* User avatar */}
              <UserAvatar user={connectedUser} size="lg" showStatus={true} />
            </div>
            <div className="p-3 bg-background/50 border-t border-border text-center">
              <p className="text-sm font-medium truncate">{connectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{connectedUser.country}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Bot className="w-12 h-12 text-secondary opacity-50 mb-2" />
            <p className="text-sm font-medium">Playing vs AI</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePlay;
