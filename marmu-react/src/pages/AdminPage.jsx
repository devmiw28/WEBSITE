// pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';

function AdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activePanel, setActivePanel] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    loadPanelData();
  }, [activePanel]);

  const loadPanelData = () => {
    if (activePanel === 'appointments') loadAppointments();
    else if (activePanel === 'users') loadUsers();
    else if (activePanel === 'feedback') loadFeedback();
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/appointments`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert(`✅ Appointment #${id} marked as ${status}`);
        loadAppointments();
      }
    } catch (error) {
      alert(`⚠️ Error: ${error.message}`);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/feedback`);
      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (id, resolved) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/feedback/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved })
      });

      if (response.ok) {
        alert(`Feedback ${resolved ? 'marked as resolved' : 'set to pending'}.`);
        loadFeedback();
      }
    } catch (error) {
      alert(`Request failed: ${error.message}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  return (
    <div className="dark-mode admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Admin Menu</h2>
        <button
          className="menu-btn"
          onClick={() => setActivePanel('appointments')}
        >
          📅 Manage Appointments
        </button>
        <button
          className="menu-btn"
          onClick={() => setActivePanel('users')}
        >
          👤 Manage Users
        </button>
        <button
          className="menu-btn"
          onClick={() => setActivePanel('feedback')}
        >
          ⭐ View Feedback
        </button>
        <button
          className="menu-btn"
          onClick={() => navigate('/')}
        >
          🏠 Go to Main Window
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          🚫 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="content">
        {activePanel === 'appointments' && (
          <div>
            <h2>Manage Appointments</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>{apt.id}</td>
                      <td>{apt.fullname}</td>
                      <td>{apt.service}</td>
                      <td>{apt.appointment_date}</td>
                      <td>{apt.time}</td>
                      <td className={`status ${apt.status.toLowerCase()}`}>
                        {apt.status}
                      </td>
                      <td>
                        {apt.status === 'Pending' ? (
                          <>
                            <button
                              className="action-btn approve"
                              onClick={() => updateAppointmentStatus(apt.id, 'Approved')}
                            >
                              Approve
                            </button>
                            <button
                              className="action-btn deny"
                              onClick={() => updateAppointmentStatus(apt.id, 'Denied')}
                            >
                              Deny
                            </button>
                          </>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activePanel === 'users' && (
          <div>
            <h2>Manage Users</h2>
            <button
              className="action-btn approve"
              onClick={() => setShowAddUserModal(true)}
            >
              ➕ Add New User
            </button>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index}>
                      <td>{user.fullname}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activePanel === 'feedback' && (
          <div>
            <h2>View Feedback</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((f) => (
                    <tr key={f.id}>
                      <td>{f.user}</td>
                      <td>{renderStars(f.stars)}</td>
                      <td>{f.message}</td>
                      <td className={`status ${f.resolved ? 'approved' : 'pending'}`}>
                        {f.resolved ? 'Resolved' : 'Pending'}
                      </td>
                      <td>
                        <button
                          className="action-btn reply"
                          onClick={() => {
                            setSelectedFeedback(f);
                            setShowReplyModal(true);
                          }}
                        >
                          💬 Reply
                        </button>
                        <button
                          className="action-btn resolve"
                          onClick={() => toggleResolved(f.id, !f.resolved)}
                        >
                          {f.resolved ? '❌ Unresolve' : '✅ Resolve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPage;