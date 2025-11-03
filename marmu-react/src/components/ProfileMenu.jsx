// src/components/ProfileMenu.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import { API_BASE_URL } from '../App';
import { parse, isValid, format } from 'date-fns';

export default function ProfileMenu({ onClose, onToggleTheme, theme }) {
  const navigate = useNavigate();
  const { user, logout, hasAnyRole } = useAuth();
  const isAdminOrStaff = hasAnyRole && hasAnyRole(['admin', 'barber', 'tattooartist']);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChangePw, setShowChangePw] = useState(false);
  const [cancellingIds, setCancellingIds] = useState({});

  useEffect(() => {
    if (user?.username) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/user/${user.username}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      const upcoming = data.filter(apt => apt.status !== 'Cancelled').slice(0, 5);
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

  // helper to normalize time string
  const normalizeTime = (dateStr, timeStr) => {
    let dt = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd h:mm a', new Date());
    if (!isValid(dt)) {
      dt = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
    }
    return isValid(dt) ? format(dt, 'hh:mm a') : timeStr;
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

          <h3>Your Appointments</h3>
          <ul>
            {loading ? (
              <li>Loading...</li>
            ) : appointments.length === 0 ? (
              <li>You have no appointments found.</li>
            ) : (
              appointments.map((apt, index) => {
                let aptDt = null;
                let showCancel = false;
                try {
                  aptDt = parse(`${apt.appointment_date} ${apt.time}`, 'yyyy-MM-dd h:mm a', new Date());
                  if (!isValid(aptDt)) {
                    aptDt = parse(`${apt.appointment_date} ${apt.time}`, 'yyyy-MM-dd HH:mm', new Date());
                  }
                  const now = new Date();
                  const status = (apt.status || '').toLowerCase();
                  showCancel = isValid(aptDt) &&
                    !['cancelled','completed','abandoned','done'].includes(status) &&
                    aptDt > now;
                } catch (e) {
                  showCancel = false;
                }

                return (
                  <li key={index}>
                    <strong>{apt.service}</strong> – {apt.appointment_date} at {normalizeTime(apt.appointment_date, apt.time)}
                    <br />
                    <small>Status: {apt.status}</small>
                    <br />
                    {showCancel && (
                      <button
                        className="action-btn deny"
                        onClick={async () => {
                          if (!confirm('Cancel this appointment?')) return;
                          setCancellingIds(prev => ({ ...prev, [apt.id]: true }));
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/bookings/${apt.id}/cancel`, {
                              method: 'POST',
                              credentials: 'include',
                            });
                            if (res.ok) {
                              alert('✅ Appointment cancelled');
                              await loadAppointments();
                            } else {
                              const t = await res.text();
                              alert('❌ Failed to cancel appointment: ' + t);
                            }
                          } catch (e) {
                            alert('❌ Network error: ' + e.message);
                          } finally {
                            setCancellingIds(prev => ({ ...prev, [apt.id]: false }));
                          }
                        }}
                        disabled={!!cancellingIds[apt.id]}
                      >
                        {cancellingIds[apt.id] ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          <button onClick={() => setShowChangePw(true)} className="change-password-btn" style={{ marginBottom: '10px' }}>
            Change Password
          </button>
          <button onClick={onToggleTheme}>Change Theme</button>
          {isAdminOrStaff && (
            <button
              onClick={() => {
                onClose();
                navigate('/admin');
              }}
              className="admin-dashboard-btn"
              style={{ marginTop: '8px' }}
            >
              Admin Dashboard
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      <ChangePasswordModal isOpen={showChangePw} onClose={() => setShowChangePw(false)} />
    </>
  );
}
