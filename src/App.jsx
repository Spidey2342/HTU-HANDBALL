import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerSignup from './pages/PlayerSignup';
import CaptainLogin from './pages/CaptainLogin';
import CaptainDashboard from './pages/CaptainDashboard';


function ProtectedCaptain({ children }) {
  const { captain, loading } = useAuth();
  if (loading) return null;
  if (!captain) return <Navigate to="/captain/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/player" element={<PlayerDashboard />} />
          <Route path="/player/signup" element={<PlayerSignup />} />
          <Route path="/captain/login" element={<CaptainLogin />} />
          <Route path="/captain/dashboard" element={
            <ProtectedCaptain>
              <CaptainDashboard />
            </ProtectedCaptain>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}