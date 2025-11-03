// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../App';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/current_user`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            // sync localStorage too
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('fullname', data.user.fullname);
            localStorage.setItem('role', data.user.role);
            if (data.user.email) {
              localStorage.setItem('email', data.user.email);
            }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);


  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('fullname', userData.fullname);
    localStorage.setItem('role', userData.role);
    if (userData.email) {
      localStorage.setItem('email', userData.email);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('username');
    localStorage.removeItem('fullname');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
  };

  // 🔑 New: call backend login API
  const loginRequest = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Login failed (${res.status})`);
      }

      const data = await res.json();
      // Expect backend to return { user: { username, fullname, role, email }, message: "..." }
      login(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  };

  const hasAnyRole = (roles = []) => {
    if (!user || !user.role) return false;
    const cur = user.role.toLowerCase();
    return roles.map(r => r.toLowerCase()).includes(cur);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginRequest, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
