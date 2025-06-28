import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Configuration - webhook URL from environment variables
const LOGIN_WEBHOOK_URL = 'https://i43-j.app.n8n.cloud/webhook-test/chat/login/1';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap elements
  const focusableElements = [usernameRef, passwordRef, submitButtonRef];

  useEffect(() => {
    if (isOpen && usernameRef.current) {
      usernameRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleTabKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const currentIndex = focusableElements.findIndex(ref => ref.current === document.activeElement);
      
      if (e.shiftKey) {
        // Shift + Tab (backwards)
        const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        focusableElements[prevIndex].current?.focus();
      } else {
        // Tab (forwards)
        const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        focusableElements[nextIndex].current?.focus();
      }
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.status === 200) {
        const data = await response.json();
        const token = data.body.token;
        
        // Store session
        localStorage.setItem('chatSessionToken', token);
        onLoginSuccess(token);
      } else if (response.status === 401) {
        // Login failed - trigger shake animation and show error
        setError('Invalid username or password');
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
      } else {
        // Other error status codes
        setError('Login failed. Please try again.');
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to login service. Please try again.');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`relative w-full max-w-md bg-card border rounded-xl shadow-2xl animate-scale-in ${shouldShake ? 'animate-shake' : ''}`}
        onKeyDown={handleTabKey}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 id="login-title" className="text-2xl font-bold mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Please sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full"
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
                className="w-full"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div 
                className="p-3 text-sm rounded-lg error-bg animate-fade-in" 
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <Button
              ref={submitButtonRef}
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
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
