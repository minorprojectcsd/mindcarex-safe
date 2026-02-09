import { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { UserRole } from '@/types';

export interface StompChatMessage {
  id?: string;
  sessionId: string;
  senderId: string;
  senderRole: string;
  message: string;
  timestamp?: string;
}

export interface StompSignal {
  type: 'OFFER' | 'ANSWER' | 'ICE';
  payload: any;
}

interface UseStompSocketOptions {
  sessionId: string;
  userId: string;
  userRole: UserRole;
  onChatMessage?: (msg: StompChatMessage) => void;
  onSignal?: (signal: StompSignal) => void;
}

const WS_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function useStompSocket({
  sessionId,
  userId,
  userRole,
  onChatMessage,
  onSignal,
}: UseStompSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const handlersRef = useRef({ onChatMessage, onSignal });
  handlersRef.current = { onChatMessage, onSignal };

  useEffect(() => {
    if (!sessionId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        console.log('[STOMP] Connected to session:', sessionId);

        // Subscribe to chat messages
        client.subscribe(`/topic/chat/${sessionId}`, (message: IMessage) => {
          const chatMsg: StompChatMessage = JSON.parse(message.body);
          handlersRef.current.onChatMessage?.(chatMsg);
        });

        // Subscribe to WebRTC signals
        client.subscribe(`/topic/signal/${sessionId}`, (message: IMessage) => {
          const signal: StompSignal = JSON.parse(message.body);
          handlersRef.current.onSignal?.(signal);
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('[STOMP] Disconnected');
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers['message']);
        setIsConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [sessionId]);

  // Send chat message to /app/chat/{sessionId}
  const sendChatMessage = useCallback(
    (message: string) => {
      if (!clientRef.current?.connected) return;
      clientRef.current.publish({
        destination: `/app/chat/${sessionId}`,
        body: JSON.stringify({
          senderId: userId,
          senderRole: userRole,
          message,
        }),
      });
    },
    [sessionId, userId, userRole]
  );

  // Send WebRTC signal to /app/signal/{sessionId}
  const sendSignal = useCallback(
    (signal: StompSignal) => {
      if (!clientRef.current?.connected) return;
      clientRef.current.publish({
        destination: `/app/signal/${sessionId}`,
        body: JSON.stringify(signal),
      });
    },
    [sessionId]
  );

  const sendOffer = useCallback(
    (offer: RTCSessionDescriptionInit) => {
      sendSignal({ type: 'OFFER', payload: offer });
    },
    [sendSignal]
  );

  const sendAnswer = useCallback(
    (answer: RTCSessionDescriptionInit) => {
      sendSignal({ type: 'ANSWER', payload: answer });
    },
    [sendSignal]
  );

  const sendIceCandidate = useCallback(
    (candidate: RTCIceCandidateInit) => {
      sendSignal({ type: 'ICE', payload: candidate });
    },
    [sendSignal]
  );

  return {
    isConnected,
    sendChatMessage,
    sendSignal,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };
}
