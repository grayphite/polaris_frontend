import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthLayout from './layouts/AuthLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChatInterface from './pages/chat/ChatInterface';
import CompanyProfile from './pages/profile/CompanyProfile';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/auth/ForgotPassword';
// Pages
import Login from './pages/auth/Login';
// Layouts
import MainLayout from './layouts/MainLayout';
import MembersList from './pages/members/MembersList';
import NotFound from './pages/NotFound';
import Profile from './pages/profile/Profile';
import ProjectDetail from './pages/projects/ProjectDetail';
import ProjectsList from './pages/projects/ProjectsList';
import React from 'react';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import Subscription from './pages/subscription/Subscription';
import { canAccessRoute } from './utils/permissions';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // This is a placeholder for actual authentication logic
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Role-based route protection
const RoleProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if user has permission to access this route
  if (!canAccessRoute(user, location.pathname)) {
    return <Navigate to="/404" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          
          {/* Protected routes */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            
            {/* Projects routes */}
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/projects/:projectId/chat/:chatId" element={<ChatInterface />} />
            
            {/* Profile routes */}
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin-only routes */}
            <Route path="/members" element={
              <RoleProtectedRoute>
                <MembersList />
              </RoleProtectedRoute>
            } />
            
            <Route path="/company-profile" element={
              <RoleProtectedRoute>
                <CompanyProfile />
              </RoleProtectedRoute>
            } />
            
            <Route path="/subscription" element={
              <RoleProtectedRoute>
                <Subscription />
              </RoleProtectedRoute>
            } />
          </Route>
          
          {/* Not found route */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Toast Container */}
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;