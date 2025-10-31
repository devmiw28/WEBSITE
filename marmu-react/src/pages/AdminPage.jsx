// pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';
import AdminAddUserModal from '../components/AdminAddUserModal';
import AdminReplyModal from '../components/AdminReplyModal';
import DashboardPanel from '../components/DashboardPanel';
import StaffAvailabilityPage from '../pages/StaffAvailabilityPage';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout, hasAnyRole } = useAuth();
  const isAdmin = hasAnyRole(['admin']);
  const isStaff = hasAnyRole(['barber', 'tattooartist']);
  const [activePanel, setActivePanel] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [historyAppointments, setHistoryAppointments] = useState([]);
  const [pendingActions, setPendingActions] = useState({});
  const [pendingFeedbackIds, setPendingFeedbackIds] = useState({});
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [summary, setSummary] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [totalClients, setTotalClients] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [artistPerformance, setArtistPerformance] = useState(null);


  useEffect(() => {
    loadPanelData();
    loadDashboardData();
  }, [activePanel]);

  const loadPanelData = () => {
    if (activePanel === 'appointments') loadAppointments();
    else if (activePanel === 'users') loadUsers();
    else if (activePanel === 'feedback') loadFeedback();
    else if (activePanel === 'history') loadHistory();
    else if (activePanel === 'dashboard') {
      loadSummary();
      loadMonthlyReport();
      }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      let data = [];
      try { data = text ? JSON.parse(text) : []; } catch { throw new Error(`Unexpected response (${response.status})`); }

      const history = data.filter(a => {
        const s = (a.status || '').toLowerCase();
        return s === 'completed' || s === 'abandoned' || s === 'done';
      });

      // Staff should only see their own history
      if (isStaff && !isAdmin && user?.fullname) {
        setHistoryAppointments(history.filter(a => (a.artist_name || '').toLowerCase() === (user.fullname || '').toLowerCase()));
      } else {
        setHistoryAppointments(history);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard-data`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const _text0 = await res.text();
      let data = {};
      try { data = _text0 ? JSON.parse(_text0) : {}; } catch { throw new Error(`Unexpected response (${res.status})`); }
      setTotalClients(data.total_clients ?? 0);
      setNotifications(data.notifications ?? { pending_appointments: 0, new_feedback: 0 });
      setArtistPerformance(data.artist_performance ?? []);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
      setTotalClients(0);
      setNotifications({ pending_appointments: 0, new_feedback: 0 });
      setArtistPerformance([]);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/appointments/summary`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const _text1 = await res.text();
      let data = {};
      try { data = _text1 ? JSON.parse(_text1) : {}; } catch { throw new Error(`Unexpected response (${res.status})`); }
      setSummary(data);
    } catch (e) {
      console.error('Failed to load summary', e);
    }
  };

  const loadMonthlyReport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/appointments/monthly-report`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const _text2 = await res.text();
      let data = {};
      try { data = _text2 ? JSON.parse(_text2) : {}; } catch { throw new Error(`Unexpected response (${res.status})`); }
      setMonthlyReport(data);
    } catch (e) {
      console.error('Failed to load monthly report', e);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const _text3 = await response.text();
      let data = [];
      try { data = _text3 ? JSON.parse(_text3) : []; } catch { throw new Error(`Unexpected response (${response.status})`); }
      // If the current user is staff (barber/tattooartist) but not an admin,
      // only show appointments assigned to that staff member (artist_name === fullname).
      if (isStaff && !isAdmin && user?.fullname) {
        const filtered = data.filter(a => (a.artist_name || '').toLowerCase() === (user.fullname || '').toLowerCase());
        setAppointments(filtered);
      } else {
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    setPendingActions(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert(`✅ Appointment #${id} marked as ${status}`);
        await loadAppointments();
      } else {
        const t = await response.text();
        alert(`⚠️ Error: ${t}`);
      }
    } catch (error) {
      alert(`⚠️ Error: ${error.message}`);
    } finally {
      setPendingActions(prev => ({ ...prev, [id]: false }));
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const _text4 = await response.text();
      let data = [];
      try { data = _text4 ? JSON.parse(_text4) : []; } catch { throw new Error(`Unexpected response (${response.status})`); }
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
      const response = await fetch(`${API_BASE_URL}/api/admin/feedback`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const _text5 = await response.text();
      let data = [];
      try { data = _text5 ? JSON.parse(_text5) : []; } catch { throw new Error(`Unexpected response (${response.status})`); }
      setFeedback(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (id, resolved) => {
    setPendingFeedbackIds(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/feedback/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolved })
      });

      if (response.ok) {
        alert(`Feedback ${resolved ? 'marked as resolved' : 'set to pending'}.`);
        await loadFeedback();
      } else {
        const t = await response.text();
        alert(`Request failed: ${t}`);
      }
    } catch (error) {
      alert(`Request failed: ${error.message}`);
    } finally {
      setPendingFeedbackIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
          className={`menu-btn ${activePanel === 'dashboard' ? 'active-menu-btn' : ''}`}
          onClick={() => setActivePanel('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`menu-btn ${activePanel === 'availability' ? 'active-menu-btn' : ''}`}
          onClick={() => setActivePanel('availability')}
        >
          Staff Availability
        </button>
        <button
          className={`menu-btn ${activePanel === 'appointments' ? 'active-menu-btn' : ''}`}
          onClick={() => setActivePanel('appointments')}
        >
          Appointments
        </button>
        <button
          className={`menu-btn ${activePanel === 'history' ? 'active-menu-btn' : ''}`}
          onClick={() => setActivePanel('history')}
        >
          Appointment History
        </button>
        {isAdmin && (
          <button
            className={`menu-btn ${activePanel === 'users' ? 'active-menu-btn' : ''}`}
            onClick={() => setActivePanel('users')}
          >
            Manage Users
          </button>
        )}
        <button
          className={`menu-btn ${activePanel === 'feedback' ? 'active-menu-btn' : ''}`}
          onClick={() => setActivePanel('feedback')}
        >
          View Feedback
        </button>
        <button
          className="menu-btn"
          onClick={() => navigate('/')}
        >
          Go to Main Window
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="content">
        {activePanel === 'dashboard' && (
          <>
            <DashboardPanel
              summary={summary}
              monthlyReport={monthlyReport}
              totalClients={totalClients}
              notifications={notifications}
              artistPerformance={artistPerformance}
            />
          </>
        )}

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
                    <th>Artist</th>
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
                      <td>{apt.artist_name}</td>
                      <td>{apt.appointment_date}</td>
                      <td>{apt.time}</td>
                      <td className={`status ${apt.status.toLowerCase()}`}>
                        {apt.status}
                      </td>
                      <td>
                        {apt.status === 'Pending' ? (
                          isAdmin ? (
                            <>
                              <button
                                className="action-btn approve"
                                onClick={() => updateAppointmentStatus(apt.id, 'Approved')}
                                disabled={!!pendingActions[apt.id]}
                              >
                                {pendingActions[apt.id] ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                className="action-btn deny"
                                onClick={() => updateAppointmentStatus(apt.id, 'Denied')}
                                disabled={!!pendingActions[apt.id]}
                              >
                                {pendingActions[apt.id] ? 'Processing...' : 'Deny'}
                              </button>
                            </>
                          ) : (
                            <span>—</span>
                          )
                        ) : apt.status === 'Approved' ? (
                          (() => {
                            try {
                              const aptDt = new Date(`${apt.appointment_date}T${apt.time}:00`);
                              const now = new Date();
                              if (isAdmin && aptDt <= now) {
                                return (
                                  <>
                                    <button className="action-btn approve" onClick={() => updateAppointmentStatus(apt.id, 'Completed')} disabled={!!pendingActions[apt.id]}>{pendingActions[apt.id] ? 'Processing...' : 'Mark Complete'}</button>
                                    <button className="action-btn deny" onClick={() => updateAppointmentStatus(apt.id, 'Abandoned')} disabled={!!pendingActions[apt.id]}>{pendingActions[apt.id] ? 'Processing...' : 'Mark Abandoned'}</button>
                                  </>
                                );
                              }
                            } catch (e) {
                              // ignore
                            }
                            return <span>-</span>;
                          })()
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

        {activePanel === 'availability' && (
          <div className="panel-container">
            <StaffAvailabilityPage />
          </div>
        )}

        {activePanel === 'history' && (
          <div>
            <h2>Appointment History</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Service</th>
                    <th>Artist</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyAppointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>{apt.id}</td>
                      <td>{apt.fullname}</td>
                      <td>{apt.service}</td>
                      <td>{apt.artist_name}</td>
                      <td>{apt.appointment_date}</td>
                      <td>{apt.time}</td>
                      <td className={`status ${apt.status.toLowerCase()}`}>{apt.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activePanel === 'users' && isAdmin && (
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
          <>
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
                          disabled={!!pendingFeedbackIds[f.id]}
                        >
                          {pendingFeedbackIds[f.id] ? 'Processing...' : (f.resolved ? '❌ Unresolve' : '✅ Resolve')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
      {showAddUserModal && (
        <AdminAddUserModal
          onClose={() => setShowAddUserModal(false)}
          onUserAdded={loadUsers}
        />
      )}
      {showReplyModal && selectedFeedback && (
        <AdminReplyModal
          feedback={selectedFeedback}
          onClose={() => setShowReplyModal(false)}
          onReplySent={loadFeedback}
        />
      )}

    </div>
  );
}
