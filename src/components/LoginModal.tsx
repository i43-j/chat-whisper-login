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
          
          // Extract token from various possible locations
          let token = data.token || data.body?.token || data.response || data.body?.response;
          
          if (token) {
            // Success! Set logged in state
            onLoginSuccess(token);
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
          </div>
        </div>
      </div>
    </div>
  );
};
