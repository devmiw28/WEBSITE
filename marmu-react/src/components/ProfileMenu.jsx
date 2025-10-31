// src/components/ProfileMenu.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import { API_BASE_URL } from '../App';

export default function ProfileMenu({ onClose, onToggleTheme, theme }) {
  const navigate = useNavigate();
  const { user, logout, hasAnyRole } = useAuth();
  const isAdminOrStaff = hasAnyRole && hasAnyRole(['admin', 'barber', 'tattooartist']);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChangePw, setShowChangePw] = useState(false);

  useEffect(() => {
    if (user?.username) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${user.username}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      let data = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch (e) {
        throw new Error(`Unexpected response (${response.status}): ${text?.slice(0,120)}`);
      }

      const upcoming = data
        .filter(apt => apt.status !== 'Cancelled')
        .slice(0, 5);

      setAppointments(upcoming);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      onClose();
      navigate('/');
    }
  };

  return (
    <>
      <div className="profile-menu-overlay" onClick={onClose} />
      <div className="profile-menu visible">
        <div className="profile-header">
          <h2>👤 User Profile</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="profile-body">
          <p><strong>Welcome,</strong> {user?.fullname || 'Guest'}</p>
          <p>Username: {user?.username || '-'}</p>
          <p>Email: {user?.email || '-'}</p>
          <hr />
          <button onClick={() => setShowChangePw(true)} className="change-password-btn" style={{marginBottom: '10px'}}>
            Change Password
          </button>
          
          <h3>📅 Your Appointments</h3>
          <ul>
            {loading ? (
              <li>Loading...</li>
            ) : appointments.length === 0 ? (
              <li>You have no appointments found.</li>
            ) : (
              appointments.map((apt, index) => (
                <li key={index}>
                  <strong>{apt.service}</strong> - {apt.appointment_date} at {apt.time}
                  <br />
                  <small>Status: {apt.status}</small>
                </li>
              ))
            )}
          </ul>

          <button onClick={onToggleTheme}>
            🌙 Toggle Theme
          </button>
          {isAdminOrStaff && (
            <button
              onClick={() => {
                onClose();
                navigate('/admin');
              }}
              className="admin-dashboard-btn"
              style={{ marginTop: '8px' }}
            >
              🛠️ Admin Dashboard
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
      <ChangePasswordModal isOpen={showChangePw} onClose={() => setShowChangePw(false)} />
    </>
  );
}
