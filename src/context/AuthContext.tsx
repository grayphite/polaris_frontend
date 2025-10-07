import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  companyId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // This would be an API call to validate the token and get user data
          // For now, we'll simulate it
          setTimeout(() => {
            setUser({
              id: '1',
              username: 'demouser',
              email: 'demo@example.com',
              role: 'admin',
              companyId: '123'
            });
            setIsLoading(false);
          }, 500);
        } catch (error) {
          console.error('Authentication error:', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // This would be an API call to your backend
      // For now, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate successful login
      const mockUser = {
        id: '1',
        username: 'demouser',
        email: email,
        role: 'admin' as const,
        companyId: '123'
      };
      
      // Store token in localStorage
      localStorage.setItem('token', 'mock-jwt-token');
      setUser(mockUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // This would be an API call to your backend
      // For now, we'll simulate a successful registration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // After registration, automatically log the user in
      const mockUser = {
        id: '1',
        username: username,
        email: email,
        role: 'user' as const
      };
      
      localStorage.setItem('token', 'mock-jwt-token');
      setUser(mockUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    
    try {
      // This would be an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 800));
      // Success is handled by the component
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    
    try {
      // This would be an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 800));
      // Success is handled by the component
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

