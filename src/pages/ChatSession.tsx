import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, PhoneOff, User, MessageSquare } from 'lucide-react';
import { sessionService, SessionDetails, getParticipantName } from '@/services/sessionService';
import { SessionSummaryModal, SessionSummaryData } from '@/components/session/SessionSummaryModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://mindcarex-backend.onrender.com';
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

export default function ChatSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('mindcarex_auth_user')
    ? JSON.parse(localStorage.getItem('mindcarex_auth_user')!).name
    : 'You';

  const stompClientRef = useRef<Client | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

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

  // Fetch session details
  useEffect(() => {
    if (!sessionId) return;
    sessionService.getSession(sessionId)
      .then(setSessionDetails)
      .catch((e) => console.log('Could not fetch session details:', e));
  }, [sessionId]);

  // Connect WebSocket
  useEffect(() => {
    if (!sessionId) return;
    connectWebSocket();
    return () => cleanup();
  }, [sessionId]);

  const connectWebSocket = () => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log('[STOMP]', str),

      onConnect: () => {
        console.log('[STOMP] ✅ Connected (Chat)');
        setIsConnected(true);

        client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          setMessages((prev) => [...prev, JSON.parse(msg.body)]);
        });
      },

      onDisconnect: () => {
        console.log('[STOMP] Disconnected');
        setIsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;
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
    stompClientRef.current?.deactivate();
  };

  const handleEndSession = async (summaryData?: SessionSummaryData) => {
    setEndingSession(true);
    if (userRole === 'DOCTOR') {
      try {
        const body = summaryData?.aiSummary ? summaryData : undefined;
        await fetch(`${API_BASE}/api/sessions/${sessionId}/end`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
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
    if (userRole === 'DOCTOR') {
      setShowSummaryModal(true);
    } else {
      handleEndSession();
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <MessageSquare className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-sm font-semibold sm:text-lg truncate">Chat Session</h1>
          <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ${isConnected ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="hidden sm:inline">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </span>
        </div>
        <Button variant="destructive" size="sm" className="shrink-0 text-xs sm:text-sm" onClick={handleEndClick}>
          <PhoneOff className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{userRole === 'DOCTOR' ? 'End Session' : 'Leave'}</span>
          <span className="sm:hidden">End</span>
        </Button>
      </header>

      {/* Chat body */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Participant info panel - visible on larger screens */}
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Participants</h2>
          </div>
          <div className="flex-1 p-4 space-y-4">
            {/* Remote participant */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{remoteName}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userRole === 'DOCTOR' ? 'patient' : 'doctor'}
                </p>
              </div>
              <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 animate-pulse" />
            </div>
            {/* Local participant */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <User className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{localName} (You)</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole?.toLowerCase()}</p>
              </div>
            </div>
          </div>

          {/* Session info */}
          <div className="border-t border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Session Info</p>
            <p className="text-xs text-muted-foreground break-all">ID: {sessionId}</p>
            {sessionDetails?.startedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Started: {new Date(sessionDetails.startedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Mobile participant bar */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground truncate">{remoteName}</span>
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* Messages area */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-3 py-2 ${msg.senderId === userId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {msg.senderId !== userId && (
                    <p className="mb-0.5 text-[10px] font-medium opacity-70">
                      {remoteName}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                  <p className="text-[9px] opacity-50 mt-1 text-right">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="flex items-center gap-2 border-t border-border p-2 sm:p-3">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
            />
            <Button
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
              onClick={handleSendMessage}
              disabled={!messageText.trim() || !isConnected}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Session Summary Modal for Doctors */}
      <SessionSummaryModal
        open={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onSubmit={(data) => handleEndSession(data)}
        loading={endingSession}
      />
    </div>
  );
}
