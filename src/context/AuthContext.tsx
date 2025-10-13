import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerUser, loginUser, forgotPassword as forgotPasswordAPI, resetPassword as resetPasswordAPI } from '../services/authService';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'member';
  companyId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has a token in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Restore user data from localStorage
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await loginUser(email, password);
      
      if (response.success && response.token && response.user) {
        const userData = {
          id: response.user.id || '1',
          username: `${response.user.first_name} ${response.user.last_name}`.trim(),
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          email: response.user.email,
          role: (response.user.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
          companyId: response.user.companyId
        };
        
        // Store both token and user data in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
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

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await registerUser({
        email,
        senha: password,
        first_name: firstName,
        last_name: lastName
      });
      
      if (response.success && response.token && response.user) {
        const userData = {
          id: response.user.id || '1',
          username: `${response.user.first_name} ${response.user.last_name}`.trim(),
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          email: response.user.email,
          role: (response.user.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
          companyId: response.user.companyId
        };
        
        // Store both token and user data in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
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
    localStorage.removeItem('user');
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

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
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
    resetPassword,
    updateUser
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

