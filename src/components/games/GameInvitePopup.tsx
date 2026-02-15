import React, { useEffect, useState, useRef } from 'react';
import { Gamepad2, Check, X } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';

interface GameInvitePopupProps {
    gameName: string;
    gameId: string;
    onAccept: () => void;
    onDecline: () => void;
}

export const GameInvitePopup: React.FC<GameInvitePopupProps> = ({
    gameName,
    gameId,
    onAccept,
    onDecline,
}) => {
    const [timeLeft, setTimeLeft] = useState(15);

    // Stable ref so timer doesn't restart on parent re-renders
    const onDeclineRef = useRef(onDecline);
    onDeclineRef.current = onDecline;

    // Auto-decline after 15 seconds — empty deps so timer runs exactly once
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onDeclineRef.current();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top duration-300">
            <div className="bg-card/95 backdrop-blur-xl border border-primary/40 rounded-2xl shadow-2xl shadow-primary/20 p-5 min-w-[320px] max-w-[400px]">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />

                <div className="relative">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
                            <Gamepad2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-base">Game Invite!</h3>
                            <p className="text-xs text-muted-foreground">Your partner wants to play</p>
                        </div>
                    </div>

                    {/* Game info */}
                    <div className="bg-muted/50 rounded-xl p-3 mb-4 text-center">
                        <p className="text-lg font-display font-bold text-primary">{gameName}</p>
                    </div>

                    {/* Timer bar */}
                    <div className="w-full h-1 bg-muted rounded-full mb-4 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeLeft / 15) * 100}%` }}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <NeonButton
                            variant="secondary"
                            onClick={onDecline}
                            className="flex-1 text-sm"
                        >
                            <X className="w-4 h-4" />
                            Decline
                        </NeonButton>
                        <NeonButton
                            onClick={onAccept}
                            className="flex-1 text-sm"
                        >
                            <Check className="w-4 h-4" />
                            Accept ({timeLeft}s)
                        </NeonButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
