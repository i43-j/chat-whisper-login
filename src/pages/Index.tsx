
import React, { useState, useEffect } from 'react';
import { LoginModal } from '@/components/LoginModal';
import { ChatInterface } from '@/components/ChatInterface';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on page load
    const checkSession = () => {
      const token = localStorage.getItem('chatSessionToken');
      if (token) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (token: string) => {
    console.log('Login successful with token:', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('chatSessionToken');
    sessionStorage.removeItem('chatSessionToken');
    setIsAuthenticated(false);
  };

  // Show loading spinner during initial session check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Chat Interface - always rendered but blurred when not authenticated */}
      <div 
        className={`transition-all duration-300 ${
          !isAuthenticated ? 'filter blur-sm pointer-events-none' : ''
        }`}
      >
        <ChatInterface onLogout={handleLogout} />
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={!isAuthenticated} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </div>
  );
};

export default Index;
