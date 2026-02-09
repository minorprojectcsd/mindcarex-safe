import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, X, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useStompSocket, StompChatMessage } from '@/hooks/useStompSocket';
import { sessionService } from '@/services/sessionService';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  sessionId: string;
  onClose: () => void;
}

export function ChatPanel({ sessionId, onClose }: ChatPanelProps) {
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
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
        <CardTitle className="text-base">Session Chat</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleExport} title="Download transcript" disabled={messages.length === 0}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">
                  No messages yet.<br />Start the conversation!
                </p>
              </div>
            ) : (
              messages.map((message, idx) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div key={message.id || idx} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5',
                      isOwn
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-secondary text-secondary-foreground'
                    )}>
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

        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || !isConnected}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {!isConnected && (
            <p className="mt-2 text-center text-xs text-muted-foreground">Connecting to chat...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
