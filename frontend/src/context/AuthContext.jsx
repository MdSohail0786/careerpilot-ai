/**
 * Auth Context
 * Manages global authentication state across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading while checking stored auth

  // ── On mount: restore user from localStorage ────────────────────────────────
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem('careerpilot_token');
      const storedUser = localStorage.getItem('careerpilot_user');

      if (token && storedUser) {
        try {
          // Verify token is still valid with server
          const { data } = await authAPI.getMe();
          setUser(data.user);
        } catch {
          // Token invalid - clear storage
          localStorage.removeItem('careerpilot_token');
          localStorage.removeItem('careerpilot_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreAuth();
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('careerpilot_token', data.token);
    localStorage.setItem('careerpilot_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // ── Register ────────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('careerpilot_token', data.token);
    localStorage.setItem('careerpilot_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('careerpilot_token');
    localStorage.removeItem('careerpilot_user');
    setUser(null);
  }, []);

  // ── Update user state (after profile edit, etc.) ────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('careerpilot_user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for consuming auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
