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

  // Verify current user on mount via /api/auth/me
  // Ensure valid session survives page refresh and only genuine 401/403 clears the session
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
        const userData = await authService.getMe();
        // Backend returns { data: { id, name, role } } so authService.getMe() returns { id, name, role }
        const verifiedUser = userData?.id ? userData : userData?.data;
        if (isMounted && verifiedUser?.id) {
          setUser(verifiedUser);
          setToken(storedToken);
          localStorage.setItem('sunflow_user', JSON.stringify(verifiedUser));
        }
      } catch (err) {
        // Only clear session when authentication genuinely fails (401 or 403), NOT on network or 500 errors
        if (err.status === 401 || err.status === 403) {
          if (isMounted) {
            authService.logout();
            setUser(null);
            setToken(null);
          }
        } else {
          // Network error or offline server: preserve existing stored user so session survives page refresh
          try {
            const cached = localStorage.getItem('sunflow_user');
            if (cached && isMounted) {
              setUser(JSON.parse(cached));
              setToken(storedToken);
            }
          } catch {
            // ignore JSON parse error
          }
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    verifySession();

    // Listen for global 401 unauthorized events from apiClient
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
   * No fake demo tokens or synthetic success fallbacks
   */
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    const verifiedUser = data?.user || data?.data?.user;
    const tokenVal = data?.token || data?.data?.token;

    if (verifiedUser && tokenVal) {
      setUser(verifiedUser);
      setToken(tokenVal);
      return data;
    }
    throw new Error('Invalid authentication response structure from backend');
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
   * Quick demo account switch that authenticates against the backend
   * No fake demo_token generation
   */
  const switchDemoRole = async (targetRole) => {
    const matched = mockUsers.find((u) => u.role === targetRole) || mockUsers[0];
    return login({ email: matched.email, password: 'demo1234' });
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
