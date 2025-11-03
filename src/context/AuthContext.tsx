import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerUser, loginUser, forgotPassword as forgotPasswordAPI, resetPassword as resetPasswordAPI, TeamSubscription } from '../services/authService';
import { createTeam } from '../services/teamService';
import { showErrorToast, showSuccessToast } from '../utils/toast';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner' | 'member';
  companyId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscription: TeamSubscription | null;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string, invitationToken?: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshSubscription: (subscriptions: TeamSubscription[] | undefined) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUBSCRIPTION_STORAGE_KEY = 'team_subscriptions';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to safely parse and get subscription from localStorage
  const getStoredSubscription = (): TeamSubscription | null => {
    try {
      const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (!stored) return null;
      
      const subscriptions = JSON.parse(stored);
      // Return first subscription if array exists and has items
      if (Array.isArray(subscriptions) && subscriptions.length > 0) {
        return subscriptions[0];
      }
      return null;
    } catch (error) {
      console.error('Failed to parse stored subscription data:', error);
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      return null;
    }
  };

  // Helper to store subscription
  const storeSubscription = (subscriptions: TeamSubscription[] | undefined) => {
    if (!subscriptions || subscriptions.length === 0) {
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscriptions));
  };

  const [subscription, setSubscription] = useState<TeamSubscription | null>(() => getStoredSubscription());

  useEffect(() => {
    // Check if user has a token in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Restore user data from localStorage
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Restore subscription data from localStorage
        const storedSubscription = getStoredSubscription();
        setSubscription(storedSubscription);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
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
          role: (response.user.role === 'owner' ? 'owner' : 'member') as 'owner' | 'member',
          companyId: response.user.companyId
        };
        
        // Store both token and user data in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Store subscription data
        storeSubscription(response.team_subscriptions);
        const storedSub = getStoredSubscription();
        setSubscription(storedSub);
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

  const register = async (firstName: string, lastName: string, email: string, password: string, invitationToken?: string) => {
    setIsLoading(true);
    
    try {
      const response = await registerUser({
        email,
        senha: password,
        first_name: firstName,
        last_name: lastName,
        invitation_token: invitationToken
      });
      
      if (response.success && response.token && response.user) {
        const userData = {
          id: response.user.id || '1',
          username: `${response.user.first_name} ${response.user.last_name}`.trim(),
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          email: response.user.email,
          role: (response.user.role === 'owner' ? 'owner' : 'member') as 'owner' | 'member',
          companyId: response.user.companyId
        };
        
        // Store both token and user data in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Store subscription data
        storeSubscription(response.team_subscriptions);
        const storedSub = getStoredSubscription();
        setSubscription(storedSub);
        
        // Only create a team for owners
        if (userData.role === 'owner') {
          await createTeamWithRetry(userData.firstName);
        }
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

  // Helper function to create team with retry logic
  const createTeamWithRetry = async (firstName: string, maxRetries = 3) => {
    const teamName = `${firstName} Team 1`;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const team = await createTeam({ name: teamName, description: '' });
        console.log(`Team "${teamName}" created successfully`);
        
        // Store teamId in localStorage
        if (team && team.id) {
          localStorage.setItem('teamId', team.id.toString());
        }
        
        // Optional: Show subtle success message
        // showSuccessToast('Team created successfully');
        return; // Success, exit the function
      } catch (error) {
        console.error(`Team creation attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          // All retries exhausted
          showErrorToast('Failed to create team. You can create one from the dashboard.');
          return; // Exit gracefully, allow user to proceed
        }
        
        // Wait before retrying with exponential backoff (1s, 2s, 4s)
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('teamId');
    localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    setUser(null);
    setSubscription(null);
  };

  const refreshSubscription = (subscriptions: TeamSubscription[] | undefined) => {
    storeSubscription(subscriptions);
    const storedSub = getStoredSubscription();
    setSubscription(storedSub);
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
    subscription,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
    refreshSubscription
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

