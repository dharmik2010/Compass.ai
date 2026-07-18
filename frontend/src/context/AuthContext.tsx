import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export interface UserPreferences {
  diet: string;
  accessibility: string[];
  travelStyle: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  preferences: UserPreferences;
  achievements: string[];
  savedPlaces: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, otp: string, newPass: string) => Promise<any>;
  googleLogin: (email: string, name: string) => Promise<any>;
  updatePrefs: (prefs: Partial<UserPreferences>) => Promise<any>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await apiFetch('/api/auth/me');
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (name: string, email: string, password: string) => {
    return await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  };

  const verifyOtp = async (email: string, otp: string) => {
    const data = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const forgotPassword = async (email: string) => {
    return await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    return await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword })
    });
  };

  const googleLogin = async (email: string, name: string) => {
    const data = await apiFetch('/api/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    });
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const updatePrefs = async (preferences: Partial<UserPreferences>) => {
    const data = await apiFetch('/api/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences })
    });
    if (data.success && user) {
      setUser({ ...user, preferences: data.preferences });
    }
    return data;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, verifyOtp, forgotPassword, resetPassword, googleLogin, updatePrefs, logout, setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
