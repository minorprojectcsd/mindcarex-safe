import { useCallback, useEffect, useRef, useState } from 'react';
import { Message, RiskIndicator, WebRTCSignal, EmotionFrameResponse, UserRole } from '@/types';

// Socket.IO event names matching backend specification
const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  
  // Chat
  CHAT_MESSAGE: 'chat_message',
  CHAT_TYPING: 'chat_typing',
  CHAT_END: 'chat_end',
  
  // WebRTC Signaling
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  
  // Analytics & Alerts
  EMOTION_UPDATE: 'emotion_update',
  RISK_ALERT: 'risk_alert',
  SESSION_SUMMARY_READY: 'session_summary_ready',
} as const;

interface SocketEventHandlers {
  onMessage?: (message: Message) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  onChatEnd?: (sessionId: string) => void;
  onRiskAlert?: (alert: RiskIndicator & { sessionId: string }) => void;
  onEmotionUpdate?: (data: EmotionFrameResponse & { sessionId: string; userId: string }) => void;
  onWebRTCOffer?: (signal: WebRTCSignal) => void;
  onWebRTCAnswer?: (signal: WebRTCSignal) => void;
  onWebRTCIceCandidate?: (signal: WebRTCSignal) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onSessionSummaryReady?: (data: { sessionId: string; summary: string }) => void;
}

// Mock Socket implementation for development
// Replace with actual Socket.IO client in production:
// import { io, Socket } from 'socket.io-client';

export function useSocket(
  sessionId: string,
  userId: string,
  userRole: UserRole,
  handlers: SocketEventHandlers
) {
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // In production, replace with actual Socket.IO connection:
  // const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Mock connection simulation
    // In production:
    // socketRef.current = io(SOCKET_SERVER_URL, { query: { sessionId, userId } });
    
    const connectTimeout = setTimeout(() => {
      setIsConnected(true);
      console.log(`[Socket] Connected to session: ${sessionId}`);
      console.log(`[Socket] User: ${userId} (${userRole})`);
    }, 500);

    return () => {
      clearTimeout(connectTimeout);
      setIsConnected(false);
      console.log(`[Socket] Disconnected from session: ${sessionId}`);
      // In production: socketRef.current?.disconnect();
    };
  }, [sessionId, userId, userRole]);

  // Join room
  const joinRoom = useCallback(() => {
    if (!isConnected) return;
    console.log(`[Socket] ${SOCKET_EVENTS.JOIN_ROOM}:`, { roomId: sessionId, userId });
    // In production: socketRef.current?.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: sessionId, userId });
    handlersRef.current.onUserJoined?.(userId);
  }, [isConnected, sessionId, userId]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!isConnected) return;
    console.log(`[Socket] ${SOCKET_EVENTS.LEAVE_ROOM}:`, { roomId: sessionId, userId });
    // In production: socketRef.current?.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId: sessionId, userId });
    handlersRef.current.onUserLeft?.(userId);
  }, [isConnected, sessionId, userId]);

  // Send chat message
  const sendMessage = useCallback((content: string) => {
    if (!isConnected) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      session_id: sessionId,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      senderRole: userRole,
      isRead: false,
    };

    console.log(`[Socket] ${SOCKET_EVENTS.CHAT_MESSAGE}:`, content);
    // In production: socketRef.current?.emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
    
    // Mock: echo message back
    setTimeout(() => {
      handlersRef.current.onMessage?.(message);
    }, 100);
  }, [isConnected, sessionId, userId, userRole]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!isConnected) return;
    console.log(`[Socket] ${SOCKET_EVENTS.CHAT_TYPING}:`, { sessionId, userId, isTyping });
    // In production: socketRef.current?.emit(SOCKET_EVENTS.CHAT_TYPING, { sessionId, userId, isTyping });
  }, [isConnected, sessionId, userId]);

  // End chat
  const endChat = useCallback(() => {
    if (!isConnected) return;
    console.log(`[Socket] ${SOCKET_EVENTS.CHAT_END}:`, { sessionId });
    // In production: socketRef.current?.emit(SOCKET_EVENTS.CHAT_END, { sessionId });
    handlersRef.current.onChatEnd?.(sessionId);
  }, [isConnected, sessionId]);

  // WebRTC: Send offer
  const sendWebRTCOffer = useCallback((offer: RTCSessionDescriptionInit, to: string) => {
    if (!isConnected) return;
    const signal: WebRTCSignal = {
      type: 'offer',
      payload: offer,
      from: userId,
      to,
    };
    console.log(`[Socket] ${SOCKET_EVENTS.WEBRTC_OFFER}:`, signal.type);
    // In production: socketRef.current?.emit(SOCKET_EVENTS.WEBRTC_OFFER, signal);
  }, [isConnected, userId]);

  // WebRTC: Send answer
  const sendWebRTCAnswer = useCallback((answer: RTCSessionDescriptionInit, to: string) => {
    if (!isConnected) return;
    const signal: WebRTCSignal = {
      type: 'answer',
      payload: answer,
      from: userId,
      to,
    };
    console.log(`[Socket] ${SOCKET_EVENTS.WEBRTC_ANSWER}:`, signal.type);
    // In production: socketRef.current?.emit(SOCKET_EVENTS.WEBRTC_ANSWER, signal);
  }, [isConnected, userId]);

  // WebRTC: Send ICE candidate
  const sendICECandidate = useCallback((candidate: RTCIceCandidateInit, to: string) => {
    if (!isConnected) return;
    const signal: WebRTCSignal = {
      type: 'ice-candidate',
      payload: candidate,
      from: userId,
      to,
    };
    console.log(`[Socket] ${SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE}`);
    // In production: socketRef.current?.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, signal);
  }, [isConnected, userId]);

  return {
    isConnected,
    // Room management
    joinRoom,
    leaveRoom,
    // Chat
    sendMessage,
    sendTyping,
    endChat,
    // WebRTC signaling
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,
  };
}
