import React, { useEffect, useRef } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { MatchResult } from '@/hooks/useMatchFinding';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  match: MatchResult;
  localStream: MediaStream | null;
  onEndCall?: () => void;
  onPeerDisconnect?: () => void;
  /** When true, the entire video call renders as a small floating PiP */
  compact?: boolean;
  /** Callback to pass remoteStream up to parent (for game-dual layout) */
  onRemoteStream?: (stream: MediaStream | null) => void;
  /** When true, VideoCall is hidden (WebRTC stays alive) — used in game-dual mode */
  hidden?: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({ match, localStream, onEndCall, onPeerDisconnect, compact = false, onRemoteStream, hidden = false }) => {
  const { remoteStream } = useWebRTC(match.roomId, localStream, match.isInitiator, onPeerDisconnect);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Re-bind srcObject whenever streams change OR compact toggles (DOM recreation)
  // Also use a no-dep effect as safety net for any DOM recreation we can't predict
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, compact]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, compact]);

  // Safety net: re-bind on every render in case refs change unexpectedly
  useEffect(() => {
    if (localVideoRef.current && localStream && localVideoRef.current.srcObject !== localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream && remoteVideoRef.current.srcObject !== remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  });

  // Pass remoteStream up to parent when available (for game-dual layout)
  useEffect(() => {
    onRemoteStream?.(remoteStream);
  }, [remoteStream, onRemoteStream]);

  // When hidden, keep WebRTC alive but render nothing visible
  if (hidden) return null;

  // ─── COMPACT / PiP MODE ───
  if (compact) {
    return (
      <FloatingPanel
        title="📹 Video"
        defaultCorner="bottom-left"
        defaultWidth={280}
        defaultHeight={220}
        minWidth={200}
        minHeight={160}
        resizable={true}
        zIndex={35}
        className="shadow-lg"
      >
        <div className="relative w-full h-full bg-black overflow-hidden">
          {/* Remote video fills the PiP */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white/50">
              <p className="text-xs">Connecting...</p>
            </div>
          )}

          {/* Local video inset — larger than before for visibility */}
          <div className="absolute bottom-2 right-2 w-20 h-[60px] overflow-hidden rounded-lg border border-white/30 bg-black/60 shadow-md">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>
        </div>
      </FloatingPanel>
    );
  }

  // ─── FULL SIZE MODE ───
  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Remote Video — fills entire container */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          <p>Connecting to peer...</p>
        </div>
      )}

      {/* Local Video PiP — properly sized and positioned */}
      <div className={cn(
        "absolute bottom-6 right-6 overflow-hidden rounded-xl",
        "border-2 border-white/20 shadow-xl bg-black/50 backdrop-blur-sm",
        "w-40 h-[120px]",  // 160x120 — comfortable 4:3 PiP
        "sm:w-48 sm:h-36", // 192x144 on larger screens
      )}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      </div>
    </div>
  );
};