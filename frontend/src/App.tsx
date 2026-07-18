import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyOtp } from './pages/VerifyOtp';
import { Dashboard } from './pages/Dashboard';
import { Planner } from './pages/Planner';
import { ItineraryView } from './pages/ItineraryView';
import { ChatAssistant } from './pages/ChatAssistant';
import { AdminPanel } from './pages/AdminPanel';

// Private routing protection
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-dark flex justify-center items-center text-slate-400">Loading session...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Admin routing protection
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-dark flex justify-center items-center text-slate-400">Loading session...</div>;
  return user && user.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/planner" element={<PrivateRoute><Planner /></PrivateRoute>} />
      <Route path="/itinerary/:id" element={<PrivateRoute><ItineraryView /></PrivateRoute>} />
      <Route path="/chat" element={<PrivateRoute><ChatAssistant /></PrivateRoute>} />
      
      <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
