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
  const [showChat, setShowChat] = useState(false);
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
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Load chat history
  useEffect(() => {
    if (!sessionId.startsWith('demo')) {
      sessionService.getChatHistory(sessionId)
        .then((history) => setMessages(history))
        .catch((err) => console.warn('Could not load chat history:', err));
    }
  }, [sessionId]);

  // Handle incoming WebRTC signal — filter own signals by checking senderId
  const handleSignal = useCallback(async (signal: StompSignal & { senderId?: string }) => {
    // Ignore our own signals echoed back
    if (signal.senderId && signal.senderId === user?.id) {
      return;
    }

    const pc = pcRef.current;
    if (!pc) return;

    try {
      switch (signal.type) {
        case 'OFFER':
          console.log('[WebRTC] Received offer');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          // Flush any ICE candidates that arrived before the offer
          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendAnswer(answer);
          console.log('[WebRTC] Answer sent');
          break;

        case 'ANSWER':
          console.log('[WebRTC] Received answer');
          // Only set if we're in have-local-offer state
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            // Flush any ICE candidates that arrived before the answer
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];
          } else {
            console.warn('[WebRTC] Ignoring ANSWER in state:', pc.signalingState);
          }
          break;

        case 'ICE':
          console.log('[WebRTC] Received ICE candidate');
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
          } else {
            // Queue candidates until remote description is set
            pendingCandidatesRef.current.push(signal.payload);
          }
          break;
      }
    } catch (err) {
      console.error('[WebRTC] Signal handling error:', err);
    }
  }, [user?.id]);

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

      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote track received:', event.track.kind);
        
        if (remoteVideoRef.current) {
          // Create or reuse remote stream on the video element
          if (!remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = new MediaStream();
          }
          const rs = remoteVideoRef.current.srcObject as MediaStream;
          // Only add if not already present
          if (!rs.getTracks().find(t => t.id === event.track.id)) {
            rs.addTrack(event.track);
            console.log('[WebRTC] Added remote track to video element:', event.track.kind);
          }
          setRemoteStream(rs);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) sendIceCandidate(event.candidate.toJSON());
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection State:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE State:', pc.iceConnectionState);
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

  const unreadCount = messages.length;

  return (
    <div className="flex h-full flex-col md:flex-row">
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
              <Users className="mx-auto mb-3 h-12 w-12 md:h-16 md:w-16" />
              <p className="text-sm font-medium md:text-lg">Waiting for participant…</p>
            </div>
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute bottom-20 right-3 h-24 w-32 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg sm:h-28 sm:w-36 md:bottom-20 md:right-4 md:h-36 md:w-48">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <VideoOff className="h-6 w-6 text-muted-foreground md:h-8 md:w-8" />
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-black/60 px-3 py-2 backdrop-blur-md md:gap-3 md:px-5 md:py-3">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-10 w-10 rounded-full text-white hover:bg-white/20',
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
              'h-10 w-10 rounded-full text-white hover:bg-white/20',
              !isAudioEnabled && 'bg-destructive/80 hover:bg-destructive/60'
            )}
            onClick={toggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handleEndSession}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full text-white hover:bg-white/20"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-5 w-5" />
            {!showChat && unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Status badge */}
        <div className="absolute left-3 top-3 md:left-4 md:top-4">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
        </div>

        {/* Error */}
        {videoError && (
          <div className="absolute left-1/2 top-12 -translate-x-1/2 rounded-lg bg-destructive/90 px-3 py-2 text-xs text-white md:px-4 md:text-sm">
            {videoError}
          </div>
        )}
      </div>

      {/* ====== CHAT SIDEBAR / BOTTOM SHEET ====== */}
      {showChat && (
        <div className="flex h-[45vh] w-full flex-col border-t bg-background md:h-full md:w-80 md:border-l md:border-t-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-3 py-2 md:px-4 md:py-3">
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
          <ScrollArea className="flex-1 p-2 md:p-3" ref={scrollRef}>
            <div className="space-y-2 md:space-y-3">
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
          <div className="border-t p-2 md:p-3">
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
