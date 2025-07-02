import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Sun, Moon, LogOut } from 'lucide-react';

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

// Custom Markdown Component
const MarkdownRenderer = ({ children, isStreaming, messageId, streamingMessageId }) => {
  const text = children || '';
  
  const parseMarkdown = (text) => {
    let html = text;
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-base font-medium mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-3">$1</h1>');
    
    // Code blocks
    html = html.replace(/```([^`]+)```/g, '<pre class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto my-3"><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li>.*<\/li>(\n<li>.*<\/li>)*)/g, '<ul class="list-disc list-inside mb-3 space-y-1">$1</ul>');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-3">$1</blockquote>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    if (html && !html.includes('<p>') && !html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<h3>') && !html.includes('<ul>') && !html.includes('<pre>') && !html.includes('<blockquote>')) {
      html = `<p class="mb-3">${html}</p>`;
    }
    
    return html;
  };

  const formattedText = parseMarkdown(text);
  
  return (
    <div 
      className="text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ 
        __html: formattedText + (isStreaming && messageId === streamingMessageId ? 
          '<span class="inline-block w-1 h-5 bg-current ml-1 animate-pulse align-text-bottom"></span>' : 
          ''
        ) 
      }}
    />
  );
};

// Login Modal Component
const LoginModal = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);
  
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (isOpen && usernameRef.current) {
      usernameRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(LOGIN_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.status === 200) {
        const responseText = await response.text();
        
        try {
          const data = JSON.parse(responseText);
          
          let token = data.token || data.body?.token || data.response || data.body?.response;
          
          if (token) {
            onLoginSuccess(token, username);
          } else {
            setError('No authentication token received from server');
            setShouldShake(true);
            setTimeout(() => setShouldShake(false), 500);
          }
          
        } catch (parseError) {
          setError('Invalid response format from server');
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 500);
        }
      } else if (response.status === 401) {
        setError('Invalid username or password');
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
      } else {
        setError(`Server returned status: ${response.status}`);
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
      }
    } catch (error) {
      setError(`Connection failed: ${error.message}`);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.target === usernameRef.current && password.trim()) {
        handleSubmit(e);
      } else if (e.target === usernameRef.current) {
        passwordRef.current?.focus();
      } else if (e.target === passwordRef.current) {
        handleSubmit(e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className={`relative w-full max-w-md bg-white dark:bg-gray-800 border rounded-xl shadow-2xl ${shouldShake ? 'animate-pulse' : ''}`}>
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-400">Please sign in to continue</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                ref={usernameRef}
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your username"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
