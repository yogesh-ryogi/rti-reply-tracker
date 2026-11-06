import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('rti_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persist = (token, userData) => {
    if (token) localStorage.setItem('rti_token', token);
    if (userData) {
      localStorage.setItem('rti_user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('rti_token');
    localStorage.removeItem('rti_user');
    setUser(null);
  }, []);

  const login = async (payload) => {
    const { data } = await client.post('/auth/login', payload);
    persist(data.token, data.data.user);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await client.post('/auth/register', payload);
    persist(data.token, data.data.user);
    return data.data.user;
  };

  useEffect(() => {
    const token = localStorage.getItem('rti_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.data.user);
        localStorage.setItem('rti_user', JSON.stringify(res.data.data.user));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
