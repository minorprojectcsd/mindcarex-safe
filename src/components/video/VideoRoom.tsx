import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneOff,
  MessageSquare,
  Send,
  Download,
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useStompSocket, StompChatMessage, StompSignal } from '@/hooks/useStompSocket';
import { sessionService } from '@/services/sessionService';
import { ConsentSettings } from '@/types';
import { cn } from '@/lib/utils';

interface VideoRoomProps {
  sessionId: string;
  consent: ConsentSettings;
  onEnd?: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function VideoRoom({ sessionId, consent, onEnd }: VideoRoomProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Chat state
  const [messages, setMessages] = useState<StompChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Video state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(consent.cameraEnabled);
  const [isAudioEnabled, setIsAudioEnabled] = useState(consent.micEnabled);
  const [videoError, setVideoError] = useState('');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const mediaInitializedRef = useRef(false);

  // Load chat history
  useEffect(() => {
    if (!sessionId.startsWith('demo')) {
      sessionService.getChatHistory(sessionId)
        .then((history) => setMessages(history))
        .catch((err) => console.warn('Could not load chat history:', err));
    }
  }, [sessionId]);

  // Handle incoming WebRTC signal
  const handleSignal = useCallback(async (signal: StompSignal) => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      switch (signal.type) {
        case 'OFFER':
          console.log('[WebRTC] Received offer');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendAnswer(answer);
          break;
        case 'ANSWER':
          console.log('[WebRTC] Received answer');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          break;
        case 'ICE':
          console.log('[WebRTC] Received ICE candidate');
          await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
          break;
      }
    } catch (err) {
      console.error('[WebRTC] Signal handling error:', err);
    }
  }, []);

  const { sendChatMessage, sendOffer, sendAnswer, sendIceCandidate, isConnected } = useStompSocket({
    sessionId,
    userId: user?.id || '',
    userRole: user?.role || 'PATIENT',
    onChatMessage: (msg) => setMessages((prev) => [...prev, msg]),
    onSignal: handleSignal,
  });

  // Initialize media + peer connection when WebSocket connects
  useEffect(() => {
    if (!isConnected || mediaInitializedRef.current) return;
    mediaInitializedRef.current = true;
    initializeMedia();

    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [isConnected]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: consent.cameraEnabled
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          : false,
        audio: consent.micEnabled
          ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          : false,
      });

      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote track received');
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) sendIceCandidate(event.candidate.toJSON());
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] State:', pc.connectionState);
      };

      pcRef.current = pc;

      // Doctor creates offer
      if (user?.role === 'DOCTOR') {
        setTimeout(async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendOffer(offer);
          console.log('[WebRTC] Offer sent');
        }, 1000);
      }
    } catch (err: any) {
      console.error('[WebRTC] Media error:', err);
      setVideoError(
        err.name === 'NotAllowedError'
          ? 'Camera/mic access denied. Please allow access and refresh.'
          : 'Failed to access camera/mic. Check your device settings.'
      );
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  };

  const handleEndSession = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    onEnd?.();
    const role = localStorage.getItem('role');
    if (role === 'DOCTOR') navigate('/doctor/dashboard');
    else if (role === 'PATIENT') navigate('/patient/dashboard');
    else navigate('/dashboard');
  };

  const handleExport = () => {
    const content = messages
      .map((m) => `[${m.timestamp || 'N/A'}] ${m.senderRole}: ${m.message}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-transcript-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      {/* ====== VIDEO AREA ====== */}
      <div className="relative flex flex-1 flex-col bg-black">
        {/* Remote video (fullscreen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />

        {/* No remote stream placeholder */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/70">
              <Users className="mx-auto mb-3 h-16 w-16" />
              <p className="text-lg font-medium">Waiting for participant…</p>
            </div>
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute bottom-20 right-4 h-36 w-48 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <VideoOff className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-black/60 px-5 py-3 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full text-white hover:bg-white/20',
              !isVideoEnabled && 'bg-destructive/80 hover:bg-destructive/60'
            )}
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full text-white hover:bg-white/20',
              !isAudioEnabled && 'bg-destructive/80 hover:bg-destructive/60'
            )}
            onClick={toggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full"
            onClick={handleEndSession}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white hover:bg-white/20"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>

        {/* Status badge */}
        <div className="absolute left-4 top-4">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
        </div>

        {/* Error */}
        {videoError && (
          <div className="absolute left-1/2 top-12 -translate-x-1/2 rounded-lg bg-destructive/90 px-4 py-2 text-sm text-white">
            {videoError}
          </div>
        )}
      </div>

      {/* ====== CHAT SIDEBAR ====== */}
      {showChat && (
        <div className="flex w-80 flex-col border-l bg-background">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Chat</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExport} disabled={messages.length === 0}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowChat(false)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No messages yet</p>
              ) : (
                messages.map((message, idx) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div key={message.id || idx} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[85%] rounded-2xl px-3 py-2',
                        isOwn
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-secondary text-secondary-foreground'
                      )}>
                        {!isOwn && <p className="mb-0.5 text-[10px] font-medium opacity-70">{message.senderRole}</p>}
                        <p className="text-sm">{message.message}</p>
                        {message.timestamp && (
                          <p className={cn('mt-0.5 text-[10px]', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {format(new Date(message.timestamp), 'h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? 'Message…' : 'Reconnecting…'}
                disabled={!isConnected}
                className="flex-1 text-sm"
              />
              <Button size="icon" className="h-9 w-9" onClick={handleSend} disabled={!input.trim() || !isConnected}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
