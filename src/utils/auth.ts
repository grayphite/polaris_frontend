import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook that provides a reusable logout handler.
 * Combines logout functionality with navigation to login page.
 * 
 * @returns A handleLogout function that clears auth state and navigates to login
 */
export const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return handleLogout;
};

