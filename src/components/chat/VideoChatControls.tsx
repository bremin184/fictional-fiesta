import React from 'react';
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    PhoneOff,
    MessageSquare,
    Gamepad2,
    SkipForward,
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';

interface VideoChatControlsProps {
    isMuted: boolean;
    isVideoOff: boolean;
    showChat: boolean;
    showGames: boolean;
    hasConnectedUser: boolean;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onToggleChat: () => void;
    onToggleGames: () => void;
    onSkip: () => void;
    onEndCall: () => void;
}

export const VideoChatControls: React.FC<VideoChatControlsProps> = ({
    isMuted,
    isVideoOff,
    showChat,
    showGames,
    hasConnectedUser,
    onToggleMute,
    onToggleVideo,
    onToggleChat,
    onToggleGames,
    onSkip,
    onEndCall,
}) => {
    return (
        <div className="sticky bottom-0 left-0 right-0 z-[var(--z-controls)] flex justify-center py-4 lg:py-6 bg-background/50 backdrop-blur-sm border-t border-border/50">
            <GlassPanel className="px-6 py-4 flex items-center gap-4">
                <button
                    onClick={onToggleMute}
                    className={`control-btn ${isMuted ? 'active' : ''}`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                    onClick={onToggleVideo}
                    className={`control-btn ${isVideoOff ? 'active' : ''}`}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>

                <button
                    onClick={onToggleChat}
                    className={`control-btn ${showChat ? 'active' : ''}`}
                >
                    <MessageSquare className="w-6 h-6" />
                </button>

                <button
                    onClick={onToggleGames}
                    className={`control-btn ${showGames ? 'active' : ''}`}
                >
                    <Gamepad2 className="w-6 h-6" />
                </button>

                {hasConnectedUser && (
                    <button onClick={onSkip} className="control-btn">
                        <SkipForward className="w-6 h-6" />
                    </button>
                )}

                <button onClick={onEndCall} className="control-btn danger">
                    <PhoneOff className="w-6 h-6" />
                </button>
            </GlassPanel>
        </div>
    );
};
