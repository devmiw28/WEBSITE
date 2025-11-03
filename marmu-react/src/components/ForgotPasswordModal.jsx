// components/ForgotPasswordModal.jsx
import { useState } from 'react';
import { API_BASE_URL } from '../App';

export default function ForgotPasswordModal({ isOpen, onClose, switchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const sendOTP = async () => {
    const { email } = formData;
    if (!email || !email.endsWith('@gmail.com')) {
      alert('Please enter a valid Gmail address.');
      return;
    }
    setLoading(true);
    setStatusMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        alert('OTP sent! Please check your email.');
        setStatusMsg(`OTP sent to ${email}`);
      } else {
        alert(data.message || `Failed to send OTP (${response.status})`);
      }
    } catch (error) {
      alert(`Error sending OTP: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const { email, otp, newPassword, confirmPassword } = formData;
    
    // Match change password strength: >=8 chars, includes letters and numbers
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (newPassword.length < 8 || !hasLetter || !hasNumber) {
      alert('Password must be at least 8 characters and include letters and numbers.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        alert('Password reset successful. You can now login with your new password.');
        setFormData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
        setStatusMsg('');
        onClose?.();
        switchToLogin?.();
      } else {
        alert(data.message || `Failed to reset password (${response.status})`);
      }
    } catch (error) {
      alert(`Error resetting password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div
        className="login-modal-content"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <img src="/assets/Logo.png" alt="Barber Ink Logo" className="login-modal-logo" />
        <h2 className="login-modal-title">Forgot Password</h2>

        <div className="login-modal-form-group">
          <label htmlFor="email">Registered Email (Gmail only)</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your Gmail"
          />
        </div>

        <button className="login-modal-button" onClick={sendOTP} disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>

        <div className="login-modal-form-group">
          <label htmlFor="otp">OTP Code (6 digits)</label>
          <input
            type="text"
            id="otp"
            name="otp"
            value={formData.otp}
            onChange={handleChange}
            maxLength="6"
          />
        </div>

        <div className="login-modal-form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="At least 8 chars, letters & numbers"
          />
        </div>

        <div className="login-modal-form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Re-enter new password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <button className="login-modal-button" onClick={resetPassword} disabled={loading}>
          {loading ? 'Processing...' : 'Reset Password'}
        </button>

        {statusMsg && <p className="login-modal-info">{statusMsg}</p>}

        <p
          className="login-modal-link"
          onClick={() => {
            onClose?.();
            switchToLogin?.();
          }}
        >
          Back to Login
        </p>
      </div>
    </div>
  );
}
