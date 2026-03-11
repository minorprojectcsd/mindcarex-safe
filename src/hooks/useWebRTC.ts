import { useCallback, useEffect, useRef, useState } from 'react';
import { ConsentSettings } from '@/types';

interface WebRTCConfig {
  sessionId: string;
  userId: string;
  consent: ConsentSettings;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onFrameCapture?: (frame: ImageData) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(config: WebRTCConfig) {
  const { consent, onRemoteStream, onConnectionStateChange, onFrameCapture } = config;
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize local media stream
  const initializeMedia = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: consent.micEnabled,
        video: consent.cameraEnabled ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('[WebRTC] Media access error:', error);
      throw error;
    }
  }, [consent.cameraEnabled, consent.micEnabled]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate:', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received');
      if (event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      onConnectionStateChange(pc.connectionState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [onRemoteStream, onConnectionStateChange]);

  // Start video call
  const startCall = useCallback(async () => {
    try {
      const stream = await initializeMedia();
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('[WebRTC] Call started, offer created');
      return offer;
    } catch (error) {
      console.error('[WebRTC] Start call error:', error);
      throw error;
    }
  }, [initializeMedia, createPeerConnection]);

  // Answer incoming call
  const answerCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      const stream = await initializeMedia();
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('[WebRTC] Call answered');
      return answer;
    } catch (error) {
      console.error('[WebRTC] Answer call error:', error);
      throw error;
    }
  }, [initializeMedia, createPeerConnection]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  }, [localStream, isAudioMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [localStream, isVideoOff]);

  // End call
  const endCall = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setConnectionState('closed');
    console.log('[WebRTC] Call ended');
  }, [localStream]);

  // Start frame capture for emotion analysis
  const startFrameCapture = useCallback((videoElement: HTMLVideoElement, intervalMs: number = 1000) => {
    if (!consent.emotionTrackingEnabled || !onFrameCapture) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    frameIntervalRef.current = setInterval(() => {
      if (videoElement.readyState >= 2 && ctx) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        onFrameCapture(imageData);
      }
    }, intervalMs);
  }, [consent.emotionTrackingEnabled, onFrameCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    localVideoRef,
    isAudioMuted,
    isVideoOff,
    connectionState,
    startCall,
    answerCall,
    toggleAudio,
    toggleVideo,
    endCall,
    startFrameCapture,
  };
}
