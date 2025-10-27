// src/components/ProfileMenu.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://127.0.0.1:5000';

export default function ProfileMenu({ onClose, onToggleTheme, theme }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.username) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${user.username}`);
      const data = await response.json();
      
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
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}
