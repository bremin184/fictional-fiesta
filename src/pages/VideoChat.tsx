import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Zap } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { useApp } from '@/context/AppContext';
import { games } from '@/data/games';
import { DeviceCheck } from '@/components/ui/DeviceCheck';
import { SearchingOverlay } from '@/components/ui/SearchingOverlay';
import { VideoCall } from '@/components/ui/VideoCall';
import { useMatchFinding } from '@/hooks/useMatchFinding';
import { useLayoutEngine } from '@/hooks/useLayoutEngine';
import { getSocket } from '@/lib/socket';
import { ChatSidebar, ChatMessage } from '@/components/chat/ChatSidebar';
import { GamesSidebar } from '@/components/chat/GamesSidebar';
import { VideoChatControls } from '@/components/chat/VideoChatControls';
import { GameOverlay } from '@/components/games/GameOverlay';
import { GameInvitePopup } from '@/components/games/GameInvitePopup';
import { getGameById } from '@/data/games';

const VideoChat: React.FC = () => {
  const navigate = useNavigate();
  const { odId } = useParams();
  const { videoState, setVideoState, connectedUser, setConnectedUser } = useApp();
  const { findMatch, cancelSearch, isSearching, match } = useMatchFinding();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [devicesSelected, setDevicesSelected] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{ gameId: string; gameName: string } | null>(null);
  const [waitingForResponse, setWaitingForResponse] = useState<string | null>(null);
  const [isGameInviter, setIsGameInviter] = useState(false);

  // Smart layout engine
  const { layoutMode, gridTemplate, videoCompact, isMobile } = useLayoutEngine({
    activeGameId,
    showChat,
    showGames,
  });

  // Refs for cleanup in useEffect
  const matchRef = useRef(match);
  const isSearchingRef = useRef(isSearching);
  const localStreamRef = useRef(localStream);

  useEffect(() => {
    matchRef.current = match;
    isSearchingRef.current = isSearching;
    localStreamRef.current = localStream;
  }, [match, isSearching, localStream]);

  // Listen for real chat messages from Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingMessage = ({ senderId, text }: { senderId: string; text: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId,
          text,
          timestamp: new Date(),
          type: 'text',
        },
      ]);
    };

    socket.on('chatMessage', handleIncomingMessage);
    return () => {
      socket.off('chatMessage', handleIncomingMessage);
    };
  }, []);

  // Listen for game invite events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleGameInvite = ({ gameId, gameName }: { gameId: string; gameName: string }) => {
      setPendingInvite({ gameId, gameName });
    };

    const handleInviteResponse = ({ gameId, accepted }: { gameId: string; accepted: boolean }) => {
      setWaitingForResponse(null);
      if (accepted) {
        setIsGameInviter(true); // I sent the invite, I call game:start
        setActiveGameId(gameId);
        addSystemMessage('Game invite accepted! Starting game...');
      } else {
        addSystemMessage('Game invite was declined.');
      }
    };

    socket.on('game:invite', handleGameInvite);
    socket.on('game:invite-response', handleInviteResponse);

    return () => {
      socket.off('game:invite', handleGameInvite);
      socket.off('game:invite-response', handleInviteResponse);
    };
  }, []);

  const handlePeerDisconnect = useCallback(() => {
    addSystemMessage('Partner disconnected.');
    setConnectedUser(null);
  }, []);

  const handleDevicesReady = async (cameraId: string, micId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: cameraId },
        audio: { deviceId: micId },
      });
      setLocalStream(stream);
      setDevicesSelected(true);
      findMatch();
    } catch (err: any) {
      console.error('[VideoChat] getUserMedia failed:', {
        name: err?.name,
        message: err?.message,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
      });

      if (err?.name === 'NotAllowedError' && !window.isSecureContext) {
        addSystemMessage('⚠️ Camera blocked: HTTPS required for LAN access. See DeviceCheck for instructions.');
      } else if (err?.name === 'NotAllowedError') {
        addSystemMessage('⚠️ Camera permission denied. Please allow access in browser settings.');
      } else if (err?.name === 'NotFoundError') {
        addSystemMessage('⚠️ No camera or microphone found.');
      } else {
        addSystemMessage(`⚠️ Camera error: ${err?.message || 'Unknown error'}`);
      }
    }
  };

  useEffect(() => {
    if (match) {
      setConnectedUser({
        id: match.peerInfo.socketId,
        name: 'Stranger',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.peerInfo.socketId}`,
        status: 'online',
        country: 'Unknown',
        interests: [],
      });
      addSystemMessage('Connected with a new match!');
    } else {
      setConnectedUser(null);
    }
  }, [match, setConnectedUser]);

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: 'system',
        text,
        timestamp: new Date(),
        type: 'system',
      },
    ]);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add to local messages
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: 'me',
        text,
        timestamp: new Date(),
        type: 'text',
      },
    ]);

    // Send via Socket.io to peer
    if (match) {
      const socket = getSocket();
      if (socket) {
        socket.emit('chatMessage', { roomId: match.roomId, text });
      }
    }
  };

  const handleSkip = () => {
    // Clean up current call before finding new match
    if (match) {
      const socket = getSocket();
      if (socket) {
        socket.emit('endCall', { roomId: match.roomId });
      }
    }
    setConnectedUser(null);
    setMessages([]);
    findMatch();
    addSystemMessage('Searching for new match...');
  };

  const handleEndCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (isSearching) {
      cancelSearch();
    }

    const socket = getSocket();
    if (socket && match) {
      socket.emit('endCall', { roomId: match.roomId });
    }

    navigate('/lobby');
  }, [localStream, isSearching, cancelSearch, match, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const socket = getSocket();
      if (socket) {
        if (isSearchingRef.current) socket.emit('leaveQueue');
        if (matchRef.current) socket.emit('endCall', { roomId: matchRef.current.roomId });
      }
    };
  }, []);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  // Close games sidebar when a game activates
  const handleGameSelect = (gameId: string) => {
    setShowGames(false);
    if (connectedUser && match) {
      // Multiplayer: send invite to peer
      const game = getGameById(gameId);
      const socket = getSocket();
      if (socket && game) {
        socket.emit('game:invite', {
          roomId: match.roomId,
          gameId,
          gameName: game.name,
        });
        setWaitingForResponse(gameId);
        addSystemMessage(`Sent game invite: ${game.name}. Waiting for response...`);
      }
    } else {
      // AI mode: open directly
      setActiveGameId(gameId);
    }
  };

  // Determine grid classes based on layout engine
  const getGridClasses = () => {
    const base = 'h-screen bg-background flex flex-col lg:grid lg:gap-4 lg:p-4 overflow-hidden transition-all duration-300 ease-out';

    if (layoutMode === 'split') {
      // Game gets its own column in split mode
      if (showChat) return `${base} lg:grid-cols-[1fr_minmax(320px,40%)_20rem]`;
      return `${base} lg:grid-cols-[1fr_minmax(320px,40%)]`;
    }

    // For float, dominant, and no-game modes
    if (showGames) return `${base} lg:grid-cols-[1fr_20rem]`;
    if (showChat) return `${base} lg:grid-cols-[1fr_20rem]`;
    return `${base} lg:grid-cols-[1fr]`;
  };

  return (
    <div className={getGridClasses()}>
      {/* Main Video Area */}
      <div className="flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="sticky top-0 left-0 right-0 z-[var(--z-controls)] px-4 py-3 lg:px-6 lg:py-4 bg-background/50 backdrop-blur-sm border-b border-border/50 flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/50 backdrop-blur-sm text-sm hover:bg-background/70 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {connectedUser && (
            <GlassPanel className="px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-sm font-medium">{connectedUser.name}</span>
            </GlassPanel>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-neon rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Remote Video / Searching State */}
        <div className="flex-1 relative bg-gradient-to-br from-muted to-card flex items-center justify-center">
          {!devicesSelected && (
            <DeviceCheck
              onDevicesReady={handleDevicesReady}
              isLoading={isSearching}
              className="z-10"
            />
          )}

          {isSearching && <SearchingOverlay onCancel={cancelSearch} />}

          {match && (
            <VideoCall
              match={match}
              localStream={localStream}
              onEndCall={handleEndCall}
              onPeerDisconnect={handlePeerDisconnect}
              compact={videoCompact}
            />
          )}

          {/* Game Overlay — FLOAT mode renders as floating panel (portal-like, above this container) */}
          {/* DOMINANT mode renders as absolute overlay here */}
          {activeGameId && layoutMode === 'dominant' && (
            <GameOverlay
              gameId={activeGameId}
              isAI={!match}
              roomId={match?.roomId || null}
              isInitiator={isGameInviter}
              onClose={() => { setActiveGameId(null); setIsGameInviter(false); }}
              layoutMode={layoutMode}
            />
          )}

          {/* Game Invite Popup - shown to the receiver */}
          {pendingInvite && (
            <GameInvitePopup
              gameId={pendingInvite.gameId}
              gameName={pendingInvite.gameName}
              onAccept={() => {
                const socket = getSocket();
                if (socket && match) {
                  socket.emit('game:invite-response', {
                    roomId: match.roomId,
                    gameId: pendingInvite.gameId,
                    accepted: true,
                  });
                }
                setIsGameInviter(false); // I'm the receiver, don't call game:start
                setActiveGameId(pendingInvite.gameId);
                setPendingInvite(null);
              }}
              onDecline={() => {
                const socket = getSocket();
                if (socket && match) {
                  socket.emit('game:invite-response', {
                    roomId: match.roomId,
                    gameId: pendingInvite.gameId,
                    accepted: false,
                  });
                }
                setPendingInvite(null);
              }}
            />
          )}

          {/* Waiting for invite response toast */}
          {waitingForResponse && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[var(--z-popup)]">
              <GlassPanel className="px-6 py-3 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Waiting for response...</span>
                <button
                  onClick={() => setWaitingForResponse(null)}
                  className="text-xs text-muted-foreground hover:text-foreground ml-2"
                >
                  Cancel
                </button>
              </GlassPanel>
            </div>
          )}
        </div>

        {/* Control Bar — always accessible, z above game panels */}
        {match && (
          <VideoChatControls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            showChat={showChat}
            showGames={showGames}
            hasConnectedUser={!!connectedUser}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleChat={() => setShowChat(!showChat)}
            onToggleGames={() => setShowGames(!showGames)}
            onSkip={handleSkip}
            onEndCall={handleEndCall}
          />
        )}
      </div>

      {/* SPLIT MODE: Game as a grid column alongside video */}
      {activeGameId && layoutMode === 'split' && (
        <GameOverlay
          gameId={activeGameId}
          isAI={!match}
          roomId={match?.roomId || null}
          isInitiator={isGameInviter}
          onClose={() => { setActiveGameId(null); setIsGameInviter(false); }}
          layoutMode={layoutMode}
        />
      )}

      {/* FLOAT MODE: Game as a draggable floating panel (rendered outside grid flow) */}
      {activeGameId && layoutMode === 'float' && (
        <GameOverlay
          gameId={activeGameId}
          isAI={!match}
          roomId={match?.roomId || null}
          isInitiator={isGameInviter}
          onClose={() => { setActiveGameId(null); setIsGameInviter(false); }}
          layoutMode={layoutMode}
        />
      )}

      {/* Chat Sidebar */}
      {showChat && (
        <ChatSidebar
          messages={messages}
          onSendMessage={handleSendMessage}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Games Sidebar */}
      {showGames && (
        <GamesSidebar
          games={games}
          connectedUser={!!connectedUser}
          onSelectGame={handleGameSelect}
          onClose={() => setShowGames(false)}
        />
      )}
    </div>
  );
};

export default VideoChat;
