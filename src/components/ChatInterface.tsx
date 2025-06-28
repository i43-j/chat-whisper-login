import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sun, Moon, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Configuration - webhook URL from environment variables
const CHAT_WEBHOOK_URL = 'https://chat-whisper-login.vercel.app/api/chat';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onLogout: () => void;
}

const suggestions = [
  "What is the company’s attendance policy?",
  "How do I request time off or leave?",
  "What is the process for reporting sick leave?",
  "What is in the company code of conduct?"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent blank or double submits
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('chatSessionToken')}`,
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (res.status === 401) {
        onLogout();
        return;
      }

      let botResponse = `I'm a demo chatbot! I received your message: ${userMessage.text}`;

      if (res.ok) {
        const data = await res.json();
        // data.response should be a string
        if (typeof data.response === 'string') {
          botResponse = data.response;
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      // simulate typing
      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 500);

    } catch (error) {
      console.error('Chat error:', error);
      setIsLoading(false);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen chat-bg flex flex-col">
      <header className="flex-shrink-0 p-4 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="w-8" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="rounded-full"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Hello there!</h1>
              <p className="text-xl text-muted-foreground">How can I help you today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="p-4 text-left rounded-xl chat-surface border hover:border-primary/50 transition-all duration-200 hover:scale-[1.02] animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="text-sm">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${
                      msg.isUser ? 'user-bubble rounded-br-sm' : 'bot-bubble rounded-bl-sm'
                    }`}
                  >
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bot-bubble p-4 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className="flex-shrink-0 p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Send a message…"
                className="resize-none rounded-2xl"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="rounded-full flex-shrink-0 mb-2"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};
