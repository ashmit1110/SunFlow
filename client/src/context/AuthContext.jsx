import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { mockUsers } from '../services/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sunflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('sunflow_token') || null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Verify current user on mount via /api/auth/me (Phase 2 requirement)
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      const storedToken = localStorage.getItem('sunflow_token');
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsInitializing(false);
        }
        return;
      }

      try {
        const response = await authService.getMe();
        if (isMounted && response?.data) {
          setUser(response.data);
          setToken(storedToken);
          localStorage.setItem('sunflow_user', JSON.stringify(response.data));
        }
      } catch (err) {
        // If 401 unauthenticated or token expired, clean up session
        if (isMounted) {
          authService.logout();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    verifySession();

    // Listen for global 401 unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setIsInitializing(false);
    };
    window.addEventListener('sunflow:auth-unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('sunflow:auth-unauthorized', handleUnauthorized);
    };
  }, []);

  /**
   * Log in against the real backend POST /api/auth/login
   * @param {{ email: string, password: string }} credentials
   */
  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      if (data?.user && data?.token) {
        setUser(data.user);
        setToken(data.token);
        return data;
      }
      throw new Error('Malformed login response from server');
    } catch (err) {
      // Re-throw so the login form shows the exact backend error message
      throw err;
    }
  };

  /**
   * Log out and clear session tokens
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  /**
   * Demo role switcher for testing / presentation
   */
  const switchDemoRole = async (targetRole) => {
    const matched = mockUsers.find((u) => u.role === targetRole) || mockUsers[0];
    try {
      // Attempt logging in as that demo user against backend with demo1234
      await login({ email: matched.email, password: 'demo1234' });
    } catch {
      // Fallback if backend is not reachable
      setUser(matched);
      setToken(`demo_token_${matched.role}`);
      localStorage.setItem('sunflow_user', JSON.stringify(matched));
      localStorage.setItem('sunflow_token', `demo_token_${matched.role}`);
    }
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
        isAuthenticated: !!user && !!token,
        isInitializing,
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

export default AuthContext;
