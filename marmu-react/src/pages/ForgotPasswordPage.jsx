// pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../App';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
      const response = await fetch(`${API_BASE_URL}/api/send_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        alert('OTP sent! Please check your email.');
        setStatusMsg(`OTP sent to ${email}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const { email, otp, newPassword, confirmPassword } = formData;

    if (!email || !otp || !newPassword || !confirmPassword) {
      alert('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Password reset successful. You can now login with your new password.');
        navigate('/login');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h2>Forgot Password</h2>

        <div className="form-group">
          <label htmlFor="email">Registered Email (Gmail only):</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your Gmail"
          />
        </div>

        <button onClick={sendOTP} disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>

        <div className="form-group">
          <label htmlFor="otp">OTP Code (6 digits):</label>
          <input
            type="text"
            id="otp"
            name="otp"
            value={formData.otp}
            onChange={handleChange}
            maxLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <button onClick={resetPassword} disabled={loading}>
          {loading ? 'Processing...' : 'Reset Password'}
        </button>

        {statusMsg && <p className="status-msg">{statusMsg}</p>}

        <p
          className="link"
          onClick={() => {
            navigate('/', { state: { openLoginModal: true } });
          }}
        >
          Back to Login
        </p>
      </div>
    </div>
  );
}
