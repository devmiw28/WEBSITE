// components/SignupModal.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../App';

export default function SignupModal({ isOpen, onClose, switchToLogin }) {
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fullname: '',
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        otp: ''
      });
      setError('');
      setOtpSent(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const sendOTP = async () => {
    if (!/^[^\s@]+@gmail\.com$/i.test(formData.email)) {
      setError('Please enter a valid Gmail address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup/send_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { }

      if (!res.ok)
        throw new Error(data.error || `Failed to send OTP (${res.status})`);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: data.message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
          container: 'swal-top-layer'
        }
      });

      setOtpSent(true);
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (Object.values(formData).some((v) => !v)) {
      setError('All fields are required');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    const hasLetter = /[A-Za-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    if (formData.password.length < 8 || !hasLetter || !hasNumber) {
      setError('Password must be at least 8 characters and include letters and numbers');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { }

      if (!res.ok)
        throw new Error(data.error || `Signup failed (${res.status})`);

      Swal.fire({
        position: 'center',
        icon: 'success',
        title: 'Signup Successful!',
        text: data.message,
        showConfirmButton: true,
        customClass: {
          container: 'swal-top-layer'
        }
      }).then(() => {
        onClose();
        switchToLogin();
      });
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Signup Failed',
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="signup-modal-overlay" onClick={onClose}>
      <div className="signup-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="signup-modal-title">Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="signup-modal-form-group">
            <label>Full Name</label>
            <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} />
          </div>

          <div className="signup-modal-form-group">
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} />
          </div>

          <div className="signup-modal-form-group">
            <label>Email</label>
            <div className="otp-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Gmail address"
              />
              <button
                type="button"
                onClick={sendOTP}
                className="signup-modal-otp-btn"
                disabled={loading || otpSent}
              >
                {otpSent ? 'Sent!' : 'Send OTP'}
              </button>
            </div>
          </div>

          <div className="signup-modal-form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 chars, letters & numbers"
            />
          </div>

          <div className="signup-modal-form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirm_password"
              placeholder="Re-enter password"
              value={formData.confirm_password}
              onChange={handleChange}
            />
          </div>

          <div className="signup-modal-form-group">
            <label>OTP Code</label>
            <input
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              maxLength="6"
            />
          </div>

          {error && <div className="signup-modal-error">{error}</div>}

          <button type="submit" className="signup-modal-button" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="signup-modal-link" onClick={switchToLogin}>
          Back to Login
        </p>
      </div>
    </div>
  );
}
