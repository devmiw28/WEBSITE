// components/ChangePasswordModal.jsx
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../App';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm({ current_password: '', new_password: '', confirm_password: '' });
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.current_password || !form.new_password || !form.confirm_password) {
      setError('Please fill in all fields');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('New password and confirm do not match');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/send_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const text = await resp.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`Unexpected response (${resp.status}): ${text?.slice(0,200) || 'empty body'}`); }
      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to change password');
      setSuccess('Password updated successfully');
      setTimeout(() => onClose?.(), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="login-modal-title">Change Password</h2>
        <form onSubmit={onSubmit}>
          <div className="login-modal-form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="current_password"
              value={form.current_password}
              onChange={onChange}
              placeholder="Enter current password"
            />
          </div>
          <div className="login-modal-form-group">
            <label>New Password</label>
            <input
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={onChange}
              placeholder="At least 8 chars, letters & numbers"
            />
          </div>
          <div className="login-modal-form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={onChange}
              placeholder="Re-enter new password"
            />
          </div>

          {error && <div className="login-modal-error">{error}</div>}
          {success && <div className="signup-modal-success">{success}</div>}

          <button type="submit" className="login-modal-button" disabled={loading}>
            {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
        <button className="login-modal-button" onClick={onClose} type="button">Close</button>
      </div>
    </div>
  );
}
