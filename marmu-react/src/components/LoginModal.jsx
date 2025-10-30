// components/LoginModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';

export default function LoginModal({ isOpen, onClose, switchToSignup, switchToForgot }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setLoading(false);
      setFormData({ username: '', password: '' });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please fill in both fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      // Try to parse JSON; if it fails, surface raw text for debugging
      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Unexpected response (${response.status}): ${text?.slice(0,200) || 'empty body'}`);
      }
      if (!response.ok) throw new Error(data.error || 'Login failed');

      login({
        username: data.username,
        fullname: data.fullname,
        role: data.role,
        email: data.email
      });

      onClose();
      navigate(data.role === 'Admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div
        className="login-modal-content"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >

        <img src="/assets/Logo.png" alt="Barber Ink Logo" className="login-modal-logo" />
        <h2 className="login-modal-title">Marmu Barber & Tattoo Shop</h2>

        <form onSubmit={handleSubmit}>
          <div className="login-modal-form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
            />
          </div>

          <div className="login-modal-form-group password-input-wrapper">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </div>

          <p
            className="login-modal-link"
            onClick={() => {
              onClose?.();
              switchToForgot?.();
            }}
          >
            Forgot Password?
          </p>

          {error && <div className="login-modal-error">{error}</div>}

          <button type="submit" className="login-modal-button" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>
        </form>

        <p className="login-modal-link" onClick={switchToSignup}>
          Create Account
        </p>
      </div>
    </div>
  );
}
