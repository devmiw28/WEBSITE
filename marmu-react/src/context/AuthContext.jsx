import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../App';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/current_user`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            _syncLocalStorage(data.user);
          } else {
            setUser(null);
            localStorage.clear();
          }
        } else {
          setUser(null);
          localStorage.clear();
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        setUser(null);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const _syncLocalStorage = (userData) => {
    localStorage.setItem('username', userData.username);
    localStorage.setItem('fullname', userData.fullname);
    localStorage.setItem('role', userData.role);
    if (userData.email) localStorage.setItem('email', userData.email);
  };

  const login = (userData) => {
    setUser(userData);
    _syncLocalStorage(userData);
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      localStorage.clear();
      navigate('/'); // safe place to redirect
    }
  };

  const loginRequest = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Login failed (${res.status})`);
      }

      const data = await res.json();
      login(data.user);

      // 🔹 navigate based on role after login
      const role = data.user.role.toLowerCase();
      if (role === 'admin' || role === 'staff') navigate('/admin');
      else navigate('/');

      return { success: true, user: data.user };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  };

  const hasAnyRole = (roles = []) => {
    if (!user || !user.role) return false;
    return roles.map(r => r.toLowerCase()).includes(user.role.toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginRequest, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
