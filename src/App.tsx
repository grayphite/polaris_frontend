import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthLayout from './layouts/AuthLayout';
import { AuthProvider } from './context/AuthContext';
import ChatInterface from './pages/chat/ChatInterface';
import CompanyProfile from './pages/profile/CompanyProfile';
// import Dashboard from './pages/Dashboard';
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
import SetupAccount from './pages/auth/SetupAccount';
import Subscription from './pages/subscription/Subscription';
import SubscriptionSuccess from './pages/subscription/Success';
import SubscriptionFailure from './pages/subscription/Failure';
import SubscriptionGuard from './components/common/SubscriptionGuard';
import { ChatProvider } from './context/ChatContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import GuestRoute from './components/common/GuestRoute';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth routes - only accessible to unauthenticated users */}
          <Route element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invitation/setup-account/:token" element={<SetupAccount />} />
          </Route>
          
          {/* Subscription routes - Protected but WITHOUT MainLayout for owners without subscription */}
          <Route path="/subscription" element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          } />
          <Route path="/subscription/success" element={
            <ProtectedRoute>
              <SubscriptionSuccess />
            </ProtectedRoute>
          } />
          <Route path="/subscription/failure" element={
            <ProtectedRoute>
              <SubscriptionFailure />
            </ProtectedRoute>
          } />

          {/* Protected routes WITH MainLayout - Only accessible with valid subscription for owners */}
          <Route element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <ChatProvider>
                  <MainLayout />
                </ChatProvider>
              </SubscriptionGuard>
            </ProtectedRoute>
          }>
            {/* <Route path="/" element={<Dashboard />} /> */}
            <Route path="/" element={<Navigate to="/projects" replace />} />
            
            {/* Projects routes */}
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/projects/:projectId/chat/:chatId" element={<ChatInterface />} />
            
            {/* Profile routes */}
            <Route path="/profile" element={<Profile />} />
            
            {/* All routes accessible to all users */}
            <Route path="/members" element={<MembersList />} />
            <Route path="/company-profile" element={<CompanyProfile />} />
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