import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [captain, setCaptain] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem('htu_captain_session');
    if (saved) {
      try {
        setCaptain(JSON.parse(saved));
      } catch {
        localStorage.removeItem('htu_captain_session');
      }
    }
    setLoading(false);
  }, []);

  const login = (captainData) => {
    setCaptain(captainData);
    localStorage.setItem('htu_captain_session', JSON.stringify(captainData));
  };

  const logout = () => {
    setCaptain(null);
    localStorage.removeItem('htu_captain_session');
  };

  return (
    <AuthContext.Provider value={{ captain, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}