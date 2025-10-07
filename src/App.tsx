import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import AuthLayout from './layouts/AuthLayout';
import { AuthProvider } from './context/AuthContext';
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

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // This is a placeholder for actual authentication logic
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
            
            {/* Members routes */}
            <Route path="/members" element={<MembersList />} />
            
            {/* Profile routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/company-profile" element={<CompanyProfile />} />
            
            {/* Subscription routes */}
            <Route path="/subscription" element={<Subscription />} />
          </Route>
          
          {/* Not found route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;