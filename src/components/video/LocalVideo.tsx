import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LocalVideoProps {
    stream: MediaStream | null;
    className?: string;
}

export const LocalVideo: React.FC<LocalVideoProps> = ({ stream, className }) => {
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
                muted
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
            />
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    <p className="text-sm">Your camera</p>
                </div>
            )}
        </div>
    );
};
