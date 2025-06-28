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
  
  console.log('=== RESPONSE DEBUG ===');
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  console.log('Response headers:', [...response.headers.entries()]);
  
  // Get the raw response text
  const responseText = await response.text();
  console.log('Raw response text:', responseText);
  console.log('Response length:', responseText.length);
  
  if (response.status === 200) {
    // Try to parse the JSON
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed data:', data);
      console.log('Data structure:', Object.keys(data));
      
      // Check different possible token locations
      console.log('data.token:', data.token);
      console.log('data.body:', data.body);
      console.log('data.body?.token:', data.body?.token);
      
      // Try to extract token based on n8n response structure
      let token;
      if (data.body && data.body.token) {
        token = data.body.token;
        console.log('Token found in data.body.token:', token);
      } else if (data.token) {
        token = data.token;
        console.log('Token found in data.token:', token);
      } else {
        console.error('No token found in response!');
        console.log('Full response structure:', JSON.stringify(data, null, 2));
      }
      
      if (token) {
        localStorage.setItem('chatSessionToken', token);
        onLoginSuccess(token);
        console.log('Login successful! Token stored.');
      } else {
        setError('No token received from server');
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Response was not valid JSON:', responseText);
      setError('Invalid response from server');
    }
  } else {
    console.log('Non-200 status received:', response.status);
    setError(`Server error: ${response.status}`);
  }
  
} catch (error) {
  console.error('Network error:', error);
  setError('Unable to connect to login service');
} finally {
  setIsLoading(false);
}

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
