import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId: string, localStream: MediaStream | null, isInitiator: boolean, onPeerDisconnect?: () => void) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescriptionSet = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !localStream) return;

    // Reset state for new connection
    remoteDescriptionSet.current = false;
    iceCandidateQueue.current = [];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        if (onPeerDisconnect) onPeerDisconnect();
        setRemoteStream(null);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    // Helper to flush queued ICE candidates after remote description is set
    const flushIceCandidateQueue = async () => {
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift()!;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding queued ICE candidate:', err);
        }
      }
    };

    // Socket event listeners
    const handleReceiveOffer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      if (isInitiator) return;
      try {
        console.log('[WebRTC] Received offer, setting remote description');
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        remoteDescriptionSet.current = true;
        await flushIceCandidateQueue();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { roomId, sdp: answer });
        console.log('[WebRTC] Answer sent');
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    const handleReceiveAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      if (!isInitiator) return;
      try {
        console.log('[WebRTC] Received answer, setting remote description');
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        remoteDescriptionSet.current = true;
        await flushIceCandidateQueue();
      } catch (err) {
        console.error('[WebRTC] Error handling answer:', err);
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!remoteDescriptionSet.current) {
        console.log('[WebRTC] Queuing ICE candidate (remote description not yet set)');
        iceCandidateQueue.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    const handleCallEnded = () => {
      console.log('[WebRTC] Call ended by peer');
      if (onPeerDisconnect) onPeerDisconnect();
      setRemoteStream(null);
    };

    socket.on('receiveOffer', handleReceiveOffer);
    socket.on('receiveAnswer', handleReceiveAnswer);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callEnded', handleCallEnded);

    // Initiate call if we are the initiator
    if (isInitiator) {
      const createOffer = async () => {
        try {
          console.log('[WebRTC] Creating offer (initiator)');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId, sdp: offer });
          console.log('[WebRTC] Offer sent');
        } catch (err) {
          console.error('[WebRTC] Error creating offer:', err);
        }
      };
      createOffer();
    }

    return () => {
      console.log('[WebRTC] Cleaning up peer connection');
      socket.off('receiveOffer', handleReceiveOffer);
      socket.off('receiveAnswer', handleReceiveAnswer);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callEnded', handleCallEnded);
      pc.close();
      peerConnection.current = null;
      remoteDescriptionSet.current = false;
      iceCandidateQueue.current = [];
    };
  }, [roomId, localStream, isInitiator, onPeerDisconnect]);

  return { remoteStream, connectionState };
};