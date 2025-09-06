import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, sendChatMessage, Message } from '@/hooks/useApi';
import { ArrowLeft, Send, BrainCircuit, User, Bot } from 'lucide-react';
import FormattedMessage from '@/components/FormattedMessage';

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, loading, setMessages, refetch } = useMessages(chatId || '');

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, streamingMessage]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setStreamingMessage('');

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    let fullResponse = '';
    
    const success = await sendChatMessage(
      chatId,
      inputMessage,
      (chunk) => {
        fullResponse += chunk;
        setStreamingMessage(fullResponse);
        // Don't update message content during streaming to prevent 
        // FormattedMessage from parsing incomplete content
      }
    );

    // After streaming completes, update the message immediately and sync with backend
    if (success && fullResponse) {
      // Update message immediately
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullResponse, timestamp: new Date().toISOString() }
            : msg
        )
      );
      
      // Clear streaming state
      setStreamingMessage('');
      
      // Refetch messages from backend to ensure sync (shorter delay)
      setTimeout(async () => {
        try {
          if (refetch) {
            await refetch();
          }
        } catch (error) {
          console.warn('Failed to refetch messages:', error);
        }
      }, 500);
    }

    if (!success) {
      // Remove the failed message and show error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      // Could add a toast error here
    }

    setIsLoading(false);
    setStreamingMessage('');
    
    // Focus input after a small delay to ensure UI updates
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!chatId) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-secondary flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <BrainCircuit className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold">Interview Practice Session</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <Card className="h-full flex flex-col bg-gradient-glass backdrop-blur-sm border-white/20 shadow-glass">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="mx-auto h-16 w-16 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to start your interview?</h3>
                  <p className="text-muted-foreground mb-4">
                    I'm your AI interviewer. Tell me about the position you're preparing for, 
                    and I'll help you practice with realistic questions.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Try saying: "I'm preparing for a software engineer position at a tech startup"
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 animate-fade-in ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto shadow-lg border border-primary/20'
                          : 'bg-gradient-to-br from-card/95 to-secondary/10 border-2 border-border/50 shadow-md'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        message.content ? (
                          <FormattedMessage content={message.content} />
                        ) : isLoading && streamingMessage ? (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {streamingMessage}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                              Typing...
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            I'm thinking...
                          </div>
                        )
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-3 w-3 text-primary-foreground/80" />
                            <span className="text-xs font-medium text-primary-foreground/90">You asked:</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                      )}
                      <div className={`text-xs mt-3 flex items-center gap-1 ${
                        message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/80'
                      }`}>
                        {(() => {
                          // Handle multiple timestamp formats from backend
                          let date: Date;
                          
                          if (!message.timestamp) {
                            return 'Just now';
                          }
                          
                          // Try different parsing approaches
                          if (typeof message.timestamp === 'string') {
                            // Backend might return different formats: ISO, Unix timestamp, or date string
                            if (message.timestamp.match(/^\d+$/)) {
                              // Unix timestamp (seconds or milliseconds)
                              const timestamp = parseInt(message.timestamp);
                              date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
                            } else if (message.timestamp.includes('T') || message.timestamp.includes('Z')) {
                              // ISO format
                              date = new Date(message.timestamp);
                            } else {
                              // Try parsing as regular date string
                              date = new Date(message.timestamp);
                            }
                          } else {
                            date = new Date(message.timestamp);
                          }
                          
                          if (isNaN(date.getTime())) {
                            console.warn('Invalid timestamp format:', message.timestamp);
                            return 'Just now';
                          }
                          
                          const now = new Date();
                          const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
                          
                          if (diffInMinutes < 1) return 'Just now';
                          if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
                          if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
                          
                          return date.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                        })()}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border/50 p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !inputMessage.trim()}
                variant="gradient"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;