import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneOff,
  MessageSquare,
  Send,
  Download,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useStompSocket, StompChatMessage } from '@/hooks/useStompSocket';
import { sessionService } from '@/services/sessionService';
import { ConsentSettings } from '@/types';
import { cn } from '@/lib/utils';

interface VideoRoomProps {
  sessionId: string;
  consent: ConsentSettings;
  onEnd?: () => void;
}

export function VideoRoom({ sessionId, consent, onEnd }: VideoRoomProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<StompChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    if (!sessionId.startsWith('demo')) {
      sessionService.getChatHistory(sessionId)
        .then((history) => setMessages(history))
        .catch((err) => console.warn('Could not load chat history:', err));
    }
  }, [sessionId]);

  const { sendChatMessage, isConnected } = useStompSocket({
    sessionId,
    userId: user?.id || '',
    userRole: user?.role || 'PATIENT',
    onChatMessage: (msg) => {
      setMessages((prev) => [...prev, msg]);
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

  const handleEndSession = () => {
    onEnd?.();
    const role = localStorage.getItem('role');
    if (role === 'DOCTOR') {
      navigate('/doctor/dashboard');
    } else if (role === 'PATIENT') {
      navigate('/patient/dashboard');
    } else {
      navigate('/dashboard');
    }
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Session Chat</h2>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={messages.length === 0}
            title="Download transcript"
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndSession}
          >
            <PhoneOff className="mr-1 h-4 w-4" />
            {user?.role === 'DOCTOR' ? 'End Session' : 'Leave'}
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">No messages yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, idx) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div key={message.id || idx} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2.5',
                    isOwn
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md bg-secondary text-secondary-foreground'
                  )}>
                    {!isOwn && (
                      <p className="mb-1 text-xs font-medium opacity-70">
                        {message.senderRole}
                      </p>
                    )}
                    <p className="text-sm">{message.message}</p>
                    {message.timestamp && (
                      <p className={cn('mt-1 text-xs', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
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

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Type a message...' : 'Reconnecting...'}
            disabled={!isConnected}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || !isConnected}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!isConnected && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Reconnecting to chat...</p>
        )}
      </div>
    </div>
  );
}
