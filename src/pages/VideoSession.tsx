import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, User, MessageSquare, X } from 'lucide-react';
import { SessionSummaryModal, SessionSummaryData } from '@/components/session/SessionSummaryModal';
import { sessionService, SessionDetails, getParticipantName } from '@/services/sessionService';
import { useIsMobile } from '@/hooks/use-mobile';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://mindcarex-backend.onrender.com';
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

export default function VideoSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('mindcarex_auth_user')
    ? JSON.parse(localStorage.getItem('mindcarex_auth_user')!).name
    : 'You';

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [chatOpen, setChatOpen] = useState(!isMobile);
  const [unreadCount, setUnreadCount] = useState(0);

  const remoteName = sessionDetails
    ? userRole === 'DOCTOR'
      ? getParticipantName(sessionDetails.appointment.patient)
      : getParticipantName(sessionDetails.appointment.doctor)
    : 'Participant';

  const localName = sessionDetails
    ? userRole === 'DOCTOR'
      ? getParticipantName(sessionDetails.appointment.doctor)
      : getParticipantName(sessionDetails.appointment.patient)
    : userName;

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track unread when chat is closed on mobile
  useEffect(() => {
    if (messages.length > 0 && !chatOpen) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages.length]);

  // Fetch session details
  useEffect(() => {
    if (!sessionId) return;
    sessionService.getSession(sessionId)
      .then(setSessionDetails)
      .catch((e) => console.log('Could not fetch session details:', e));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    initConnection();
    return () => cleanup();
  }, [sessionId]);

  useEffect(() => {
    const resume = () => remoteVideoRef.current?.play().catch(() => {});
    document.addEventListener('click', resume, { once: true });
    return () => document.removeEventListener('click', resume);
  }, []);

  const initConnection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: [
              'turn:openrelay.metered.ca:80?transport=tcp',
              'turn:openrelay.metered.ca:443?transport=tcp',
              'turns:openrelay.metered.ca:443?transport=tcp'
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      });

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        if (!remoteVideoRef.current) return;
        let rs = remoteVideoRef.current.srcObject as MediaStream | null;
        if (!rs) {
          rs = new MediaStream();
          remoteVideoRef.current.srcObject = rs;
        }
        rs.addTrack(event.track);
        setHasRemoteVideo(true);
        setTimeout(() => {
          remoteVideoRef.current?.play().catch(() => {});
        }, 500);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({ type: 'ice', candidate: event.candidate.toJSON(), from: userId });
        }
      };

      pc.oniceconnectionstatechange = () => console.log('[WebRTC] ICE:', pc.iceConnectionState);
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      peerConnectionRef.current = pc;
      connectWebSocket();
    } catch (error) {
      console.error('[WebRTC] Failed to get media:', error);
      alert('Cannot access camera/microphone. Please allow permissions.');
    }
  };

  const connectWebSocket = () => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log('[STOMP]', str),
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          setMessages((prev) => [...prev, JSON.parse(msg.body)]);
        });
        client.subscribe(`/topic/signal/${sessionId}`, (msg) => {
          const signal = JSON.parse(msg.body);
          if (signal.from === userId) return;
          handleSignal(signal);
        });
        if (userRole === 'DOCTOR') {
          setTimeout(createOffer, 1000);
        }
      },
      onDisconnect: () => setIsConnected(false),
    });
    client.activate();
    stompClientRef.current = client;
  };

  const createOffer = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      sendSignal({ type: 'offer', sdp: offer.sdp, from: userId });
    } catch (e) {
      console.error('[WebRTC] Offer error:', e);
    }
  };

  const handleSignal = async (signal: any) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
        for (const c of pendingCandidatesRef.current) await pc.addIceCandidate(c);
        pendingCandidatesRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: 'answer', sdp: answer.sdp, from: userId });
      } else if (signal.type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
          for (const c of pendingCandidatesRef.current) await pc.addIceCandidate(c);
          pendingCandidatesRef.current = [];
        }
      } else if (signal.type === 'ice' && signal.candidate) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(signal.candidate);
        } else {
          pendingCandidatesRef.current.push(signal.candidate);
        }
      }
    } catch (error) {
      console.error('[WebRTC] Signal error:', error);
    }
  };

  const sendSignal = (signal: any) => {
    if (!stompClientRef.current?.connected) return;
    stompClientRef.current.publish({
      destination: `/app/signal/${sessionId}`,
      body: JSON.stringify(signal),
    });
  };

  const toggleMute = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
  };
  const toggleVideo = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !stompClientRef.current?.connected) return;
    stompClientRef.current.publish({
      destination: `/app/chat/${sessionId}`,
      body: JSON.stringify({ sessionId, senderId: userId, senderRole: userRole, message: messageText.trim() }),
    });
    setMessageText('');
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    stompClientRef.current?.deactivate();
  };

  const handleEndSession = async (summaryData?: SessionSummaryData) => {
    setEndingSession(true);
    if (userRole === 'DOCTOR') {
      try {
        const body = summaryData?.aiSummary ? summaryData : undefined;
        await fetch(`${API_BASE}/api/sessions/${sessionId}/end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (e) {
        console.log('Could not end session:', e);
      }
    }
    cleanup();
    navigate('/dashboard');
  };

  const handleEndClick = () => {
    if (userRole === 'DOCTOR') setShowSummaryModal(true);
    else handleEndSession();
  };

  const handleOpenChat = () => {
    setChatOpen(true);
    setUnreadCount(0);
  };

  /* ─── Chat Panel (shared between desktop sidebar & mobile overlay) ─── */
  const ChatPanel = (
    <div className={`flex flex-col bg-background ${isMobile ? 'fixed inset-0 z-50' : 'h-full w-80 border-l'}`}>
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Session Chat</h2>
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setChatOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No messages yet</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.senderId === userId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {msg.senderId !== userId && (
                <p className="mb-0.5 text-[10px] font-medium opacity-70">
                  {msg.senderName || msg.senderRole}
                </p>
              )}
              <p>{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t p-3">
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          disabled={!isConnected}
          className="flex-1 text-sm h-9"
        />
        <Button size="icon" className="h-9 w-9" onClick={handleSendMessage} disabled={!messageText.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Video Session</h1>
          <span className="text-xs">{isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
          <span className="text-xs text-muted-foreground">WebRTC: {connectionState}</span>
          {hasRemoteVideo && <span className="text-xs text-green-500">📹 Remote active</span>}
        </div>
        <Button variant="destructive" size="sm" onClick={handleEndClick}>
          <PhoneOff className="mr-1 h-4 w-4" />
          {userRole === 'DOCTOR' ? 'End Session' : 'Leave'}
        </Button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area — takes full width; shrinks when chat sidebar is open on desktop */}
        <div className="relative flex flex-1 items-center justify-center bg-black">
          {/* Remote name overlay */}
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-sm">
            <User className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">{remoteName}</span>
            {hasRemoteVideo && <span className="h-2 w-2 rounded-full bg-green-400" />}
          </div>

          {!hasRemoteVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/70">
                <User className="mx-auto mb-2 h-16 w-16" />
                <p className="font-medium">{remoteName}</p>
                <p className="text-sm">Waiting to connect…</p>
              </div>
            </div>
          )}

          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />

          {/* Local video PIP */}
          <div className="absolute bottom-20 right-3 h-24 w-32 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg sm:h-28 sm:w-36 md:bottom-20 md:right-4 md:h-36 md:w-48">
            <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
              {localName.split(' ')[0]} (You)
            </div>
          </div>

          {/* Controls bar */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-black/60 px-4 py-2 backdrop-blur-md">
            <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-full text-white hover:bg-white/20 ${isMuted ? 'bg-destructive/80' : ''}`} onClick={toggleMute}>
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-full text-white hover:bg-white/20 ${isVideoOff ? 'bg-destructive/80' : ''}`} onClick={toggleVideo}>
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={handleEndClick}>
              <PhoneOff className="h-5 w-5" />
            </Button>
            {/* Chat toggle — always visible in controls */}
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full text-white hover:bg-white/20" onClick={() => chatOpen ? setChatOpen(false) : handleOpenChat()}>
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && !chatOpen && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Desktop: sidebar chat */}
        {!isMobile && chatOpen && ChatPanel}
      </div>

      {/* Mobile: fullscreen chat overlay */}
      {isMobile && chatOpen && ChatPanel}

      <SessionSummaryModal
        open={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onSubmit={(data) => handleEndSession(data)}
        loading={endingSession}
      />
    </div>
  );
}
