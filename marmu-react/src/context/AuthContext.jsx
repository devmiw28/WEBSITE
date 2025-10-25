// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const storedUsername = localStorage.getItem('username');
    const storedFullname = localStorage.getItem('fullname');
    const storedRole = localStorage.getItem('role');
    const storedEmail = localStorage.getItem('email');

    if (storedUsername && storedFullname) {
      setUser({
        username: storedUsername,
        fullname: storedFullname,
        role: storedRole,
        email: storedEmail
      });
    }
    setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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