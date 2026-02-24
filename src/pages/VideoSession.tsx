import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send } from 'lucide-react';

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

  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ── WebSocket ──
  useEffect(() => {
    if (!sessionId) return;

    const client = new Client({
      brokerURL: 'wss://mindcarex-backend.onrender.com/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log('[STOMP]', str),

      onConnect: () => {
        console.log('[STOMP] Connected to session:', sessionId);
        setIsConnected(true);

        client.subscribe(`/topic/chat/${sessionId}`, (message) => {
          setMessages((prev) => [...prev, JSON.parse(message.body)]);
        });

        client.subscribe(`/topic/signal/${sessionId}`, (message) => {
          handleSignal(JSON.parse(message.body));
        });

        initWebRTC();
      },

      onDisconnect: () => {
        console.log('[STOMP] Disconnected');
        setIsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      cleanup();
      client.deactivate();
    };
  }, [sessionId]);

  // Resume autoplay on first user interaction
  useEffect(() => {
    const resume = () => {
      remoteVideoRef.current?.play().catch(() => {});
    };
    document.addEventListener('click', resume, { once: true });
    return () => document.removeEventListener('click', resume);
  }, []);

  // ── WebRTC ──
  const initWebRTC = async () => {
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
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log('[WebRTC] Added local track:', track.kind);
      });

      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote track received:', event.track.kind);
        if (remoteVideoRef.current) {
          if (!remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = new MediaStream();
          }
          const rs = remoteVideoRef.current.srcObject as MediaStream;
          if (!rs.getTracks().find((t) => t.id === event.track.id)) {
            rs.addTrack(event.track);
            console.log('[WebRTC] Added remote track:', event.track.kind);
            setTimeout(() => {
              remoteVideoRef.current?.play().catch((e) =>
                console.log('[WebRTC] Autoplay (can ignore):', e)
              );
            }, 100);
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({ type: 'candidate', candidate: event.candidate, senderId: userId });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection State:', pc.connectionState);
        setConnectionState(pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE State:', pc.iceConnectionState);
      };

      peerConnectionRef.current = pc;

      if (userRole === 'DOCTOR') {
        setTimeout(async () => {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          sendSignal({ type: 'offer', offer, senderId: userId });
          console.log('[WebRTC] Offer sent');
        }, 1000);
      }
    } catch (error) {
      console.error('[WebRTC] Init error:', error);
    }
  };

  const handleSignal = async (signal: any) => {
    const pc = peerConnectionRef.current;
    if (!pc || signal.senderId === userId) return;

    try {
      if (signal.type === 'offer') {
        console.log('[WebRTC] Received offer');
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: 'answer', answer, senderId: userId });
        console.log('[WebRTC] Answer sent');
      } else if (signal.type === 'answer' && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
        console.log('[WebRTC] Answer accepted');
      } else if (signal.type === 'candidate' && signal.candidate && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (error) {
      console.error('[WebRTC] Signal error:', error);
    }
  };

  const sendSignal = (signal: any) => {
    stompClientRef.current?.publish({
      destination: `/app/signal/${sessionId}`,
      body: JSON.stringify(signal),
    });
  };

  // ── Controls ──
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !stompClientRef.current?.connected) return;
    stompClientRef.current.publish({
      destination: `/app/chat/${sessionId}`,
      body: JSON.stringify({
        sessionId,
        senderId: userId,
        senderRole: userRole,
        message: messageText.trim(),
      }),
    });
    setMessageText('');
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
  };

  const handleEndSession = async () => {
    if (userRole === 'DOCTOR') {
      try {
        await fetch(
          `https://mindcarex-backend.onrender.com/api/sessions/${sessionId}/end`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
        );
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
          <span className="text-xs">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="text-xs text-muted-foreground">
            WebRTC: {connectionState}
          </span>
        </div>
        <Button variant="destructive" size="sm" onClick={handleEndSession}>
          <PhoneOff className="mr-1 h-4 w-4" />
          {userRole === 'DOCTOR' ? 'End Session' : 'Leave'}
        </Button>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Video area */}
        <div className="relative flex flex-1 items-center justify-center bg-black">
          {/* Remote */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />

          {/* Local PiP */}
          <div className="absolute bottom-20 right-3 h-24 w-32 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg sm:h-28 sm:w-36 md:bottom-20 md:right-4 md:h-36 md:w-48">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full scale-x-[-1] object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-black/60 px-4 py-2 backdrop-blur-md">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full text-white hover:bg-white/20 ${isMuted ? 'bg-destructive/80' : ''}`}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full text-white hover:bg-white/20 ${isVideoOff ? 'bg-destructive/80' : ''}`}
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleEndSession}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="flex h-[40vh] w-full flex-col border-t bg-background md:h-full md:w-80 md:border-l md:border-t-0">
          <div className="flex-1 overflow-y-auto p-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.senderId === userId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {msg.senderId !== userId && (
                    <p className="mb-0.5 text-[10px] font-medium opacity-70">{msg.senderRole}</p>
                  )}
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
