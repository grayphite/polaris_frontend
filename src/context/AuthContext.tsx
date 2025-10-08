import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerUser, loginUser, forgotPassword as forgotPasswordAPI, resetPassword as resetPasswordAPI } from '../services/authService';

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
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Set a basic user object - actual user data will be fetched by individual components
      // and 401 errors will be handled globally by the API service
      setUser({
        id: '1', // Placeholder - will be updated when real API calls are made
        username: 'User',
        email: 'user@example.com',
        role: 'user',
        companyId: '1'
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await loginUser(email, password);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        setUser({
          id: response.user.id || '1',
          username: response.user.username || response.user.email,
          email: response.user.email,
          role: response.user.role || 'user',
          companyId: response.user.companyId
        });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await registerUser({
        email,
        senha: password,
        nome: fullName
      });
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        setUser({
          id: response.user.id || '1',
          username: response.user.username || response.user.email,
          email: response.user.email,
          role: response.user.role || 'user',
          companyId: response.user.companyId
        });
      } else {
        throw new Error(response.error || 'Registration failed');
      }
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
      const response = await forgotPasswordAPI(email);
      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset email');
      }
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
      const response = await resetPasswordAPI(token, newPassword);
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }
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

