import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://mindcarex-backend.onrender.com';
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

export default function VideoSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ── Bootstrap ──
  useEffect(() => {
    if (!sessionId) return;
    initConnection();
    return () => cleanup();
  }, [sessionId]);

  // Resume autoplay on first click
  useEffect(() => {
    const resume = () => remoteVideoRef.current?.play().catch(() => {});
    document.addEventListener('click', resume, { once: true });
    return () => document.removeEventListener('click', resume);
  }, []);

  // ── 1. Get media then create PC then connect WS ──
  const initConnection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      console.log('[WebRTC] Got local stream');

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // ── Remote tracks ──
      pc.ontrack = (event) => {
        console.log('[WebRTC] 🎥 GOT REMOTE TRACK:', event.track.kind);
        if (!remoteVideoRef.current) return;

        let rs = remoteVideoRef.current.srcObject as MediaStream | null;
        if (!rs) {
          rs = new MediaStream();
          remoteVideoRef.current.srcObject = rs;
        }
        rs.addTrack(event.track);
        setHasRemoteVideo(true);

        setTimeout(() => {
          remoteVideoRef.current
            ?.play()
            .then(() => console.log('[WebRTC] ✅ Remote video playing'))
            .catch((e) => console.log('[WebRTC] Play error:', e.message));
        }, 500);
      };

      // ── ICE candidates ──
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({ type: 'ice', candidate: event.candidate.toJSON(), from: userId });
        }
      };

      pc.oniceconnectionstatechange = () => console.log('[WebRTC] ICE:', pc.iceConnectionState);
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection:', pc.connectionState);
        setConnectionState(pc.connectionState);
      };

      peerConnectionRef.current = pc;

      // Connect WebSocket after PC is ready
      connectWebSocket();
    } catch (error) {
      console.error('[WebRTC] Failed to get media:', error);
      alert('Cannot access camera/microphone. Please allow permissions.');
    }
  };

  // ── 2. WebSocket (STOMP) ──
  const connectWebSocket = () => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log('[STOMP]', str),

      onConnect: () => {
        console.log('[STOMP] ✅ Connected');
        setIsConnected(true);

        client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          setMessages((prev) => [...prev, JSON.parse(msg.body)]);
        });

        client.subscribe(`/topic/signal/${sessionId}`, (msg) => {
          const signal = JSON.parse(msg.body);
          if (signal.from !== userId) handleSignal(signal);
        });

        // Doctor sends offer after connection
        if (userRole === 'DOCTOR') setTimeout(createOffer, 1000);
      },

      onDisconnect: () => {
        console.log('[STOMP] Disconnected');
        setIsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;
  };

  // ── 3. Create offer (doctor only) ──
  const createOffer = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      sendSignal({ type: 'offer', sdp: offer.sdp, from: userId });
      console.log('[WebRTC] 📤 Offer sent');
    } catch (e) {
      console.error('[WebRTC] Offer error:', e);
    }
  };

  // ── 4. Handle incoming signals ──
  const handleSignal = async (signal: any) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (signal.type === 'offer') {
        console.log('[WebRTC] 📥 Got offer');
        await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });

        // Flush pending ICE candidates
        for (const c of pendingCandidatesRef.current) await pc.addIceCandidate(c);
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: 'answer', sdp: answer.sdp, from: userId });
        console.log('[WebRTC] 📤 Answer sent');
      } else if (signal.type === 'answer') {
        console.log('[WebRTC] 📥 Got answer');
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
    console.log('[WebRTC] Sending:', signal.type);
    stompClientRef.current.publish({
      destination: `/app/signal/${sessionId}`,
      body: JSON.stringify(signal),
    });
  };

  // ── Controls ──
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

  const handleEndSession = async () => {
    if (userRole === 'DOCTOR') {
      try {
        await fetch(`${API_BASE}/api/sessions/${sessionId}/end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.log('Could not end session:', e);
      }
    }
    cleanup();
    navigate('/dashboard');
  };

  // ── Render ──
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
        <Button variant="destructive" size="sm" onClick={handleEndSession}>
          <PhoneOff className="mr-1 h-4 w-4" />
          {userRole === 'DOCTOR' ? 'End Session' : 'Leave'}
        </Button>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Video area */}
        <div className="relative flex flex-1 items-center justify-center bg-black">
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />

          {!hasRemoteVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/70">
                <p className="text-5xl mb-2">👥</p>
                <p>Waiting for other participant…</p>
              </div>
            </div>
          )}

          {/* Local PiP */}
          <div className="absolute bottom-20 right-3 h-24 w-32 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg sm:h-28 sm:w-36 md:bottom-20 md:right-4 md:h-36 md:w-48">
            <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-black/60 px-4 py-2 backdrop-blur-md">
            <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-full text-white hover:bg-white/20 ${isMuted ? 'bg-destructive/80' : ''}`} onClick={toggleMute}>
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-full text-white hover:bg-white/20 ${isVideoOff ? 'bg-destructive/80' : ''}`} onClick={toggleVideo}>
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={handleEndSession}>
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="flex h-[40vh] w-full flex-col border-t bg-background md:h-full md:w-80 md:border-l md:border-t-0">
          <div className="flex-1 overflow-y-auto p-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.senderId === userId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {msg.senderId !== userId && <p className="mb-0.5 text-[10px] font-medium opacity-70">{msg.senderRole}</p>}
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t p-3">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="flex-1 text-sm"
            />
            <Button size="icon" className="h-9 w-9" onClick={handleSendMessage} disabled={!messageText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
