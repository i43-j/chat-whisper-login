import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sun, Moon, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  "What is the company's attendance policy?",
  "How do I request time off or leave?",
  "What is the process for reporting sick leave?",
  "What is in the company code of conduct?"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout }) => {
  /* ───────────────────────── state ───────────────────────── */
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

  /* ───────────────────── effects / helpers ────────────────── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTheme = () => setIsDark(!isDark);
  const handleSuggestionClick = (s: string) => {
    setInputValue(s);
    inputRef.current?.focus();
  };

  /* ──────────────────────── submit ────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // push user bubble
    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('=== CHAT REQUEST DEBUG ===');
      console.log('Sending message:', userMsg.text);
      console.log('Webhook URL:', CHAT_WEBHOOK_URL);
      
      const res = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('chatSessionToken')}`,
        },
        body: JSON.stringify({ message: userMsg.text }),
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (res.status === 401) {
        console.log('Unauthorized - logging out');
        onLogout();
        return;
      }

      // Get raw response text for debugging
      const responseText = await res.text();
      console.log('Raw response text:', responseText);

      let botText = '';

      if (res.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
          console.log('Data structure:', Object.keys(data));

          // Handle n8n response format - check multiple possible locations
          if (data.response) {
            botText = data.response;
            console.log('Found response in data.response:', botText);
          } else if (data.body?.response) {
            botText = data.body.response;
            console.log('Found response in data.body.response:', botText);
          } else if (data.body?.message) {
            botText = data.body.message;
            console.log('Found response in data.body.message:', botText);
          } else {
            console.error('No response found in expected locations');
            console.log('Full response structure:', JSON.stringify(data, null, 2));
            botText = 'No response received from server';
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          botText = 'Invalid response format from server';
        }
      } else {
        console.error('Non-200 response:', res.status);
        botText = `Server error: ${res.status}`;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        isUser: false,
        timestamp: new Date(),
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
      }, 400);
    } catch (err) {
      console.error('Chat request error:', err);
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  /* ───────────────────────── JSX ──────────────────────────── */
  return (
    <div className="min-h-screen chat-bg flex flex-col">
      {/* header */}
      <header className="flex-shrink-0 p-4 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="w-8" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="rounded-full">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* main */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          /* welcome */
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
          /* chat bubbles */
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div
                    className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${
                      msg.isUser ? 'user-bubble rounded-br-sm' : 'bot-bubble rounded-bl-sm'
                    }`}
                  >
                   
<div className="markdown-content text-sm">
  <ReactMarkdown 
    remarkPlugins={[]}
    rehypePlugins={[]}
    skipHtml={false}
    components={{
      code: ({node, inline, className, children, ...props}) => {
        const match = /language-(\w+)/.exec(className || '');
        
        if (!inline && match) {
          return (
            <pre className="bg-muted border rounded-lg p-4 overflow-x-auto mb-4">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          );
        }
        
        if (inline) {
          return (
            <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          );
        }
        
        return <span {...props}>{children}</span>;
      },
      
      a: ({node, children, href, ...props}) => (
        <a 
          href={href}
          className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer"
          target="_blank" 
          rel="noopener noreferrer" 
          {...props}
        >
          {children}
        </a>
      ),
      
      p: ({node, children, ...props}) => (
        <p className="mb-4 leading-relaxed" {...props}>{children}</p>
      )
    }}
  >
    {msg.text}
  </ReactMarkdown>
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

        {/* input */}
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
