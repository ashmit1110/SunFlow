import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../services/mockData';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize with admin user for development/demo ease, or stored user
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sunflow_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    // Default to Administrator for demo convenience
    return mockUsers[0];
  });

  const [token, setToken] = useState(() => localStorage.getItem('sunflow_token') || 'demo_jwt_token');

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('sunflow:auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('sunflow:auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      setToken(data.token);
      return data;
    } catch (err) {
      // Fallback demo matching for hackathon preview if backend is offline
      const matched = mockUsers.find(
        (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
      );
      if (matched) {
        setUser(matched);
        setToken(`mock_token_${matched.role}`);
        localStorage.setItem('sunflow_user', JSON.stringify(matched));
        localStorage.setItem('sunflow_token', `mock_token_${matched.role}`);
        return { user: matched, token: `mock_token_${matched.role}` };
      }
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  // Helper for judges / presenters to quickly switch roles in one click during demo
  const switchDemoRole = (role) => {
    const targetUser = mockUsers.find((u) => u.role === role) || mockUsers[0];
    setUser(targetUser);
    setToken(`demo_token_${targetUser.role}`);
    localStorage.setItem('sunflow_user', JSON.stringify(targetUser));
    localStorage.setItem('sunflow_token', `demo_token_${targetUser.role}`);
  };

  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        switchDemoRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
