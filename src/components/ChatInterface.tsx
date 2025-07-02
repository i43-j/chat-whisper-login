import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Sun, Moon, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Configuration
const LOGIN_WEBHOOK_URL = 'https://chat-whisper-login.vercel.app/api/chat-login';
const CHAT_WEBHOOK_URL = 'https://chat-whisper-login.vercel.app/api/chat';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

// Chat Interface Component
const ChatInterface = ({ isLoggedIn, authToken, currentUser, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamingIntervalRef = useRef(null);

  const suggestions = [
    "What is the company's attendance policy?",
    "How do I request time off or leave?",
    "What is the process for reporting sick leave?",
    "What is in the company code of conduct?"
  ];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const streamText = (fullText, messageId) => {
    let currentIndex = 0;
    const streamingSpeed = 25;
    
    setStreamingMessageId(messageId);
    
    const streamInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        currentIndex += 1;
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: fullText.substring(0, currentIndex), isStreaming: true }
            : msg
        ));
      } else {
        clearInterval(streamInterval);
        setStreamingMessageId(null);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isStreaming: false }
            : msg
        ));
      }
    }, streamingSpeed);
    
    streamingIntervalRef.current = streamInterval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn || !authToken) {
      console.log('Not logged in - cannot send message');
      onLogout();
      return;
    }

    if (!inputValue.trim() || isLoading) return;

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      setStreamingMessageId(null);
    }

    const userMsg = {
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
      console.log(`User: ${currentUser}`);
      console.log(`Message: "${userMsg.text}"`);
      console.log(`Timestamp: ${userMsg.timestamp.toISOString()}`);
      console.log('Webhook URL:', CHAT_WEBHOOK_URL);
      
      const res = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ 
          message: userMsg.text,
          user: currentUser,
          timestamp: userMsg.timestamp.toISOString()
        }),
      });

      if (res.status === 401) {
        console.log('Unauthorized - logging out');
        onLogout();
        return;
      }

      const responseText = await res.text();
      let botText = '';

      if (res.ok) {
        try {
          const data = JSON.parse(responseText);
          botText = data.response || data.body?.response || data.body?.message || 'No response received from server';
        } catch (parseError) {
          botText = 'Invalid response format from server';
        }
      } else {
        botText = `Server error: ${res.status}`;
      }

      const botMsgId = (Date.now() + 1).toString();
      const botMsg = {
        id: botMsgId,
        text: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);

      setTimeout(() => {
        streamText(botText, botMsgId);
      }, 400);

    } catch (err) {
      console.error('Chat request error:', err);
      setIsLoading(false);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: `Connection error: ${err.message}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (!isLoggedIn) {
      console.log('Not logged in - cannot use suggestions');
      return;
    }
    
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Logged in as: <span className="font-medium">{currentUser}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDark(!isDark)} className="rounded-full">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Hello there!</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">How can I help you today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="p-4 text-left rounded-xl bg-white dark:bg-gray-800 border hover:border-blue-500 transition-all duration-200 hover:scale-[1.02]"
                >
                  <span className="text-sm">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 pb-0">
            <div className="space-y-4 pb-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${
                    msg.isUser 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                  }`}>
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.text || (msg.isStreaming ? '' : 'Loading...')}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t bg-white dark:bg-gray-800">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                placeholder="Send a message…"
                className="rounded-2xl"
                disabled={isLoading || streamingMessageId !== null || !isLoggedIn}
              />
            </div>
            <Button
              onClick={handleSubmit}
              size="sm"
              className="rounded-full flex-shrink-0"
              disabled={!inputValue.trim() || isLoading || streamingMessageId !== null || !isLoggedIn}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(true);

  const handleLoginSuccess = (token, username) => {
    setAuthToken(token);
    setCurrentUser(username);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    console.log(`Login successful! User "${username}" is now authenticated.`);
  };

  const handleLogout = () => {
    console.log(`User "${currentUser}" logged out. Authentication cleared.`);
    setIsLoggedIn(false);
    setAuthToken('');
    setCurrentUser('');
    setShowLoginModal(true);
  };

  return (
    <div className="min-h-screen">
      <LoginModal 
        isOpen={showLoginModal} 
        onLoginSuccess={handleLoginSuccess} 
      />
      
      <ChatInterface 
        isLoggedIn={isLoggedIn}
        authToken={authToken}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    </div>
  );
}
