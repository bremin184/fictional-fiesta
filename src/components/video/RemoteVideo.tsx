import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RemoteVideoProps {
    stream: MediaStream | null;
    className?: string;
}

export const RemoteVideo: React.FC<RemoteVideoProps> = ({ stream, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={cn("relative w-full h-full bg-black overflow-hidden rounded-xl", className)}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            />
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    <p className="text-sm">Connecting...</p>
                </div>
            )}
        </div>
    );
};
