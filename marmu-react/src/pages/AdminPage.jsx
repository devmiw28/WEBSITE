// pages/AdminPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';
import AdminAddUserModal from '../components/AdminAddUserModal';
import AdminReplyModal from '../components/AdminReplyModal';
import DashboardPanel from '../components/DashboardPanel';
import StaffAvailabilityPage from '../components/StaffAvailabilityPage';

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
  // UI controls: filters, sorts, search for tables
  const [appointmentsFilter, setAppointmentsFilter] = useState('all');
  const [appointmentsSort, setAppointmentsSort] = useState('date');
  const [appointmentsSortDirection, setAppointmentsSortDirection] = useState('asc');
  const appointmentsPrevRef = useRef({ filter: 'all', sort: 'date' });
  const appointmentsSuppressRef = useRef(false);
  const [appointmentsSearch, setAppointmentsSearch] = useState('');
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsPerPage] = useState(20);
  const [appointmentsTotal, setAppointmentsTotal] = useState(0);

  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySort, setHistorySort] = useState('date');
  const [historySortDirection, setHistorySortDirection] = useState('desc');
  const historyPrevRef = useRef({ filter: 'all', sort: 'date' });
  const historySuppressRef = useRef(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage] = useState(20);
  const [historyTotal, setHistoryTotal] = useState(0);

  const [usersFilter, setUsersFilter] = useState('all');
  const [usersSort, setUsersSort] = useState('name');
  const [usersSortDirection, setUsersSortDirection] = useState('asc');
  const usersPrevRef = useRef({ filter: 'all', sort: 'name' });
  const usersSuppressRef = useRef(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage] = useState(50);
  const [usersTotal, setUsersTotal] = useState(0);

  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [feedbackSort, setFeedbackSort] = useState('date');
  const [feedbackSortDirection, setFeedbackSortDirection] = useState('desc');
  const feedbackPrevRef = useRef({ filter: 'all', sort: 'date' });
  const feedbackSuppressRef = useRef(false);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPerPage] = useState(50);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [summary, setSummary] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [totalClients, setTotalClients] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [artistPerformance, setArtistPerformance] = useState(null);

  // Debounce hook for search inputs (declare before effects that reference debounced values)
  function useDebounced(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }

  const debouncedAppointmentsSearch = useDebounced(appointmentsSearch, 450);
  const debouncedHistorySearch = useDebounced(historySearch, 450);
  const debouncedUsersSearch = useDebounced(usersSearch, 450);
  const debouncedFeedbackSearch = useDebounced(feedbackSearch, 450);

      useEffect(() => {
        loadPanelData();
        loadDashboardData();
      }, [activePanel]);

      // Reload appointments when related controls change
      useEffect(() => {
        if (activePanel === 'appointments') {
          // If we temporarily cleared the select to detect re-selection, skip this intermediate state
          if (appointmentsSuppressRef.current) {
            appointmentsSuppressRef.current = false;
            return;
          }
          // reset to first page when filters/search change
          setAppointmentsPage(1);
          loadAppointments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [activePanel, appointmentsFilter, appointmentsSort, debouncedAppointmentsSearch, isStaff, isAdmin]);

      useEffect(() => {
        if (activePanel === 'appointments') loadAppointments();
      }, [appointmentsPage, appointmentsFilter, appointmentsSort, appointmentsSortDirection]);


      // Reload history when related controls change
      useEffect(() => {
        if (activePanel === 'history') {
          if (historySuppressRef.current) {
            historySuppressRef.current = false;
            return;
          }
          setHistoryPage(1);
          loadHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [activePanel, historyFilter, historySort, debouncedHistorySearch, isStaff, isAdmin]);

      useEffect(() => {
        if (activePanel === 'history') loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [historyPage]);

      // Users
      useEffect(() => {
        if (activePanel !== 'users') return;

        if (usersSuppressRef.current) {
          usersSuppressRef.current = false;
          return;
        }

        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [activePanel, usersFilter, usersSort, usersPage, debouncedUsersSearch]);

      // Feedback
      useEffect(() => {
        if (activePanel === 'feedback') {
          if (feedbackSuppressRef.current) {
            feedbackSuppressRef.current = false;
            return;
          }
          setFeedbackPage(1);
          loadFeedback();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [activePanel, feedbackFilter, feedbackSort, debouncedFeedbackSearch]);
      useEffect(() => { if (activePanel === 'feedback') loadFeedback(); /* eslint-disable-line */ }, [feedbackPage]);



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
          const params = new URLSearchParams();
          params.append('page', historyPage);
          params.append('per_page', historyPerPage);
          params.append('history_only', '1');
          if (historyFilter !== 'all') params.append('status', historyFilter);
          if (debouncedHistorySearch) params.append('q', debouncedHistorySearch);
          if (historySort) params.append('sort', historySort + (historySortDirection === 'desc' ? '_desc' : ''));
          if (isStaff && !isAdmin && user?.fullname) params.append('artist', user.fullname);

          const url = `${API_BASE_URL}/api/admin/appointments?${params.toString()}`;
          const res = await fetch(url, { credentials: 'include' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const payload = await res.json();
          const data = payload.data || [];
          setHistoryAppointments(data);
          setHistoryTotal(payload.total || 0);
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
          const params = new URLSearchParams();
          params.append("page", appointmentsPage);
          params.append("per_page", appointmentsPerPage);

          if (appointmentsFilter && appointmentsFilter.toLowerCase() !== "all") {
            params.append("status", appointmentsFilter.toLowerCase());
          }

          if (debouncedAppointmentsSearch)
            params.append("q", debouncedAppointmentsSearch);

          if (appointmentsSort)
            params.append(
              "sort",
              appointmentsSort +
              (appointmentsSortDirection === "desc" ? "_desc" : "")
            );

          if (isStaff && !isAdmin && user?.fullname)
            params.append("artist", user.fullname);

          const url = `${API_BASE_URL}/api/admin/appointments?${params.toString()}`;
          const res = await fetch(url, { credentials: "include" });
          const payload = await res.json();

          setAppointments(payload.data || []);
          setAppointmentsTotal(payload.total || 0);
        } catch (err) {
          console.error("Error loading appointments:", err);
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
            // reload both tabs so the updated appointment moves to history if applicable
            await loadAppointments();
            await loadHistory();
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

      // ---- Helpers for client-side filtering, sorting and searching ----
      const parseDateTime = (a) => {
        try {
          // a.appointment_date expected yyyy-mm-dd, a.time expected HH:MM or H:MM
        } catch (e) {
          return new Date(0);
        }
      };

      const getFilteredAppointments = () => {
        let list = [...appointments];
        // filter by dropdown
        if (appointmentsFilter !== 'all') {
          list = list.filter(a => (a.status || '').toLowerCase() === appointmentsFilter);
        }
        // search
        if (appointmentsSearch && appointmentsSearch.trim() !== '') {
          const q = appointmentsSearch.toLowerCase();
          list = list.filter(a => (
            (a.fullname || '').toLowerCase().includes(q) ||
            (a.service || '').toLowerCase().includes(q) ||
            (a.artist_name || '').toLowerCase().includes(q) ||
            String(a.id || '').includes(q)
          ));
        }
        // sort
        const dir = appointmentsSortDirection === 'asc' ? 1 : -1;
        if (appointmentsSort === 'date') {
          list.sort((x, y) => (parseDateTime(x) - parseDateTime(y)) * dir);
        } else if (appointmentsSort === 'name') {
          list.sort((x, y) => ((x.fullname || '').localeCompare(y.fullname || '')) * dir);
        } else if (appointmentsSort === 'service') {
          list.sort((x, y) => ((x.service || '').localeCompare(y.service || '')) * dir);
        } else if (appointmentsSort === 'artist') {
          list.sort((x, y) => ((x.artist_name || '').localeCompare(y.artist_name || '')) * dir);
        }
        return list;
      };

      const getFilteredHistory = () => {
        let list = [...historyAppointments];
        if (historyFilter !== 'all') {
          list = list.filter(a => (a.status || '').toLowerCase() === historyFilter);
        }
        if (historySearch && historySearch.trim() !== '') {
          const q = historySearch.toLowerCase();
          list = list.filter(a => (
            (a.fullname || '').toLowerCase().includes(q) ||
            (a.service || '').toLowerCase().includes(q) ||
            (a.artist_name || '').toLowerCase().includes(q) ||
            String(a.id || '').includes(q)
          ));
        }
        const hdir = historySortDirection === 'asc' ? 1 : -1;
        if (historySort === 'date') list.sort((x, y) => (parseDateTime(x) - parseDateTime(y)) * hdir);
        if (historySort === 'name') list.sort((x, y) => ((x.fullname || '').localeCompare(y.fullname || '')) * hdir);
        return list;
      };

      const getFilteredUsers = () => {
        let list = [...users];
        if (usersFilter !== 'all') list = list.filter(u => (u.role || '').toLowerCase() === usersFilter);
        if (usersSearch && usersSearch.trim() !== '') {
          const q = usersSearch.toLowerCase();
          list = list.filter(u => (
            (u.fullname || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
          ));
        }
        const udir = usersSortDirection === 'asc' ? 1 : -1;
        if (usersSort === 'name') list.sort((a, b) => ((a.fullname || '').localeCompare(b.fullname || '')) * udir);
        if (usersSort === 'username') list.sort((a, b) => ((a.username || '').localeCompare(b.username || '')) * udir);
        return list;
      };

      const getFilteredFeedback = () => {
        let list = [...feedback];
        if (feedbackFilter === 'resolved') list = list.filter(f => f.resolved);
        if (feedbackFilter === 'pending') list = list.filter(f => !f.resolved);
        if (feedbackSearch && feedbackSearch.trim() !== '') {
          const q = feedbackSearch.toLowerCase();
          list = list.filter(f => (
            (f.user || '').toLowerCase().includes(q) ||
            (f.message || '').toLowerCase().includes(q)
          ));
        }
        const fdir = feedbackSortDirection === 'asc' ? 1 : -1;
        if (feedbackSort === 'date') list.sort((a, b) => (new Date(a.date) - new Date(b.date)) * fdir);
        if (feedbackSort === 'rating') list.sort((a, b) => ((a.stars || 0) - (b.stars || 0)) * fdir);
        return list;
      };

      // Select-based handlers that detect re-selection by clearing the select when opened.
      const onSelectMouseDown = (type, key) => {
        if (type === 'appointments') {
          appointmentsPrevRef.current[key] =
            key === 'filter' ? appointmentsFilter : appointmentsSort;
        } else if (type === 'history') {
          historyPrevRef.current[key] =
            key === 'filter' ? historyFilter : historySort;
        } else if (type === 'users') {
          usersPrevRef.current[key] =
            key === 'filter' ? usersFilter : usersSort;
        } else if (type === 'feedback') {
          feedbackPrevRef.current[key] =
            key === 'filter' ? feedbackFilter : feedbackSort;
        }
      };


      const onSelectChange = (type, key, value) => {
        if (type === 'appointments') {
          const prev = appointmentsPrevRef.current[key];

          if (key === 'filter') {
            setAppointmentsFilter(value);
            setAppointmentsPage(1);
          } else {
            setAppointmentsSort(value);
            if (value === prev)
              setAppointmentsSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
            setAppointmentsPage(1);
          }
        } else if (type === 'history') {
          const prev = historyPrevRef.current[key];

          if (key === 'filter') {
            setHistoryFilter(value);
            setHistoryPage(1);
          } else {
            setHistorySort(value);
            if (value === prev)
              setHistorySortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
            setHistoryPage(1);
          }
        } else if (type === 'users') {
          const prev = usersPrevRef.current[key];

          if (key === 'filter') {
            setUsersFilter(value);
            setUsersPage(1);
          } else {
            setUsersSort(value);
            if (value === prev)
              setUsersSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
            setUsersPage(1);
          }
        } else if (type === 'feedback') {
          const prev = feedbackPrevRef.current[key];

          if (key === 'filter') {
            setFeedbackFilter(value);
            setFeedbackPage(1);
          } else {
            setFeedbackSort(value);
            if (value === prev)
              setFeedbackSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
            setFeedbackPage(1);
          }
        }
      };

      const loadUsers = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          params.append("page", usersPage);
          params.append("per_page", usersPerPage);

          if (usersFilter && usersFilter.toLowerCase() !== "all")
            params.append("filter", usersFilter);

          if (usersSort)
            params.append(
              "sort",
              usersSort + (usersSortDirection === "desc" ? "_desc" : "")
            );

          const url = `${API_BASE_URL}/api/admin/users?${params.toString()}`;
          const res = await fetch(url, { credentials: "include" });
          const payload = await res.json();

          setUsers(payload.data || []);
          setUsersTotal(payload.total || 0);
        } catch (err) {
          console.error("Error loading users:", err);
        } finally {
          setLoading(false);
        }
      };

      const loadFeedback = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          params.append('page', feedbackPage);
          params.append('per_page', feedbackPerPage);
          if (feedbackFilter !== 'all') params.append('status', feedbackFilter);
          if (debouncedFeedbackSearch) params.append('q', debouncedFeedbackSearch);
          if (feedbackSort) params.append('sort', feedbackSort + (feedbackSortDirection === 'desc' ? '_desc' : ''));

          const url = `${API_BASE_URL}/api/admin/feedback?${params.toString()}`;
          const res = await fetch(url, { credentials: 'include' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const payload = await res.json();
          const data = payload.data || [];
          setFeedback(data);
          setFeedbackTotal(payload.total || 0);
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
            Users
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
            <h2 className='admin-titles'>Appointments</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className="table-controls">
                  <div className="control-group">
                    <label>Filter:</label>
                    <select
                      value={appointmentsFilter}
                      onMouseDown={() => onSelectMouseDown('appointments', 'filter')}
                      onChange={(e) => onSelectChange('appointments', 'filter', e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="denied">Denied</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Sort:</label>
                    <select
                      value={appointmentsSort}
                      onMouseDown={() => onSelectMouseDown('appointments', 'sort')}
                      onChange={(e) => onSelectChange('appointments', 'sort', e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="date">Date & Time</option>
                      <option value="name">Name</option>
                      <option value="service">Service</option>
                      <option value="artist">Artist</option>
                    </select>
                    <button
                      type="button"
                      className="action-btn"
                      title={"Sort direction (currently " + appointmentsSortDirection + ")"}
                      onClick={() => { setAppointmentsSortDirection(d => d === 'asc' ? 'desc' : 'asc'); setAppointmentsPage(1); }}
                      style={{ marginLeft: 8 }}
                    >
                      {appointmentsSortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  <div className="control-group search">
                    <input placeholder="Search by name, service, artist or id" value={appointmentsSearch} onChange={(e) => setAppointmentsSearch(e.target.value)} />
                    {appointmentsSearch && <button className="action-btn" onClick={() => setAppointmentsSearch('')}>Clear</button>}
                  </div>
                  <div className='show-page'>
                    Showing {appointments.length} of {appointmentsTotal}
                  </div>
                </div>

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
                    {getFilteredAppointments().map((apt) => (
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
                {(!appointments || appointments.length === 0) && (
                  <div style={{ padding: 16, color: '#ccc' }}>No appointments found for the current filters.</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                  <div style={{ color: '#bbb' }}>Page {appointmentsPage} • {appointmentsPerPage} per page</div>
                  <div>
                    <button className="action-btn" disabled={appointmentsPage <= 1} onClick={() => setAppointmentsPage(p => Math.max(1, p - 1))}>Prev</button>
                    <button className="action-btn" style={{ marginLeft: 8 }} disabled={(appointmentsPage * appointmentsPerPage) >= appointmentsTotal} onClick={() => setAppointmentsPage(p => p + 1)}>Next</button>
                  </div>
                </div>
              </>
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
            <h2 className='admin-titles'>Appointment History</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className="table-controls">
                  <div className="control-group">
                    <label>Filter:</label>
                    <select
                      value={historyFilter}
                      onMouseDown={() => onSelectMouseDown('history', 'filter')}
                      onChange={(e) => onSelectChange('history', 'filter', e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="completed">Completed</option>
                      <option value="abandoned">Abandoned</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Sort:</label>
                    <select
                      value={historySort}
                      onMouseDown={() => onSelectMouseDown('history', 'sort')}
                      onChange={(e) => onSelectChange('history', 'sort', e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="date">Date (newest)</option>
                      <option value="name">Name</option>
                    </select>
                    <button
                      type="button"
                      className="action-btn"
                      title={"Sort direction (currently " + historySortDirection + ")"}
                      onClick={() => { setHistorySortDirection(d => d === 'asc' ? 'desc' : 'asc'); setHistoryPage(1); }}
                      style={{ marginLeft: 8 }}
                    >
                      {historySortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  <div className="control-group search">
                    <input placeholder="Search by name, service, artist or id" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                    {historySearch && <button className="action-btn" onClick={() => setHistorySearch('')}>Clear</button>}
                  </div>
                  <div className='show-page'>
                    Showing {historyAppointments.length} of {historyTotal}
                  </div>
                </div>

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
                    {getFilteredHistory().map((apt) => (
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
                {(!historyAppointments || historyAppointments.length === 0) && (
                  <div style={{ padding: 16, color: '#ccc' }}>No history records found.</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                  <div style={{ color: '#bbb' }}>Page {historyPage} • {historyPerPage} per page</div>
                  <div>
                    <button className="action-btn" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => Math.max(1, p - 1))}>Prev</button>
                    <button className="action-btn" style={{ marginLeft: 8 }} disabled={(historyPage * historyPerPage) >= historyTotal} onClick={() => setHistoryPage(p => p + 1)}>Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activePanel === 'users' && isAdmin && (
          <div>
            <h2 className='admin-titles'>Users</h2>
            <button
              className="add-user"
              onClick={() => setShowAddUserModal(true)}
            >
              ➕ Add New User
            </button>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className="table-controls">
                  <div className="control-group">
                    <label>Filter:</label>
                    <select
                      value={usersFilter}
                      onMouseDown={() => onSelectMouseDown('users', 'filter')}
                      onChange={(e) => onSelectChange('users', 'filter', e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="admin">Admin</option>
                      <option value="barber">Barber</option>
                      <option value="tattooartist">Tattoo Artist</option>
                      <option value="user">Client</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Sort:</label>
                    <select
                      value={usersSort}
                      onMouseDown={() => onSelectMouseDown('users', 'sort')}
                      onChange={(e) => onSelectChange('users', 'sort', e.target.value)}
                    >
                      <option value="name">Name</option>
                      <option value="username">Username</option>
                      <option value="role">Role</option>
                    </select>
                    <button
                      type="button"
                      className="action-btn"
                      title={" Sort direction (currently " + usersSortDirection + ")"}
                      onClick={() => { setUsersSortDirection(d => d === 'asc' ? 'desc' : 'asc'); setUsersPage(1); }}
                      style={{ marginLeft: 8 }}
                    >
                      {usersSortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  <div className="control-group search">
                    <input placeholder="Search by name, username, email" value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} />
                    {usersSearch && <button className="action-btn" onClick={() => setUsersSearch('')}>Clear</button>}
                  </div>
                  <div className='show-page'>
                    Showing {users.length} of {usersTotal}
                  </div>
                </div>

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
                    {getFilteredUsers().map((user, index) => (
                      <tr key={index}>
                        <td>{user.fullname}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!users || users.length === 0) && (
                  <div style={{ padding: 16, color: '#ccc' }}>No users found.</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                  <div style={{ color: '#bbb' }}>Page {usersPage} • {usersPerPage} per page</div>
                  <div>
                    <button className="action-btn" disabled={usersPage <= 1} onClick={() => setUsersPage(p => Math.max(1, p - 1))}>Prev</button>
                    <button className="action-btn" style={{ marginLeft: 8 }} disabled={(usersPage * usersPerPage) >= usersTotal} onClick={() => setUsersPage(p => p + 1)}>Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activePanel === 'feedback' && (
          <>
            <h2 className='admin-titles'>View Feedback</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className="table-controls">
                  <div className="control-group">
                    <label>Filter:</label>
                    <select
                      value={feedbackFilter}
                      onMouseDown={() => onSelectMouseDown('feedback', 'filter')}
                      onChange={(e) => onSelectChange('feedback', 'filter', e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Sort:</label>
                    <select
                      value={feedbackSort}
                      onMouseDown={() => onSelectMouseDown('feedback', 'sort')}
                      onChange={(e) => onSelectChange('feedback', 'sort', e.target.value)}
                    >
                      <option value="date">Date</option>
                      <option value="rating">Rating</option>
                    </select>
                    <button
                      type="button"
                      className="action-btn"
                      title={"Sort direction (currently " + feedbackSortDirection + ")"}
                      onClick={() => { setFeedbackSortDirection(d => d === 'asc' ? 'desc' : 'asc'); setFeedbackPage(1); }}
                      style={{ marginLeft: 8 }}
                    >
                      {feedbackSortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  <div className="control-group search">
                    <input placeholder="Search by user or message" value={feedbackSearch} onChange={(e) => setFeedbackSearch(e.target.value)} />
                    {feedbackSearch && <button className="action-btn" onClick={() => setFeedbackSearch('')}>Clear</button>}
                  </div>
                  <div className='show-page'>
                    Showing {feedback.length} of {feedbackTotal}
                  </div>
                </div>

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
                    {getFilteredFeedback().map((f) => (
                      <tr key={f.id}>
                        <td>{f.user}</td>
                        <td>{renderStars(f.stars)}</td>
                        <td>{f.message}</td>
                        <td className={`status ${f.resolved ? 'approved' : 'pending'}`}>
                          {f.resolved ? 'Resolved' : 'Pending'}
                        </td>
                        <td>
                          {(!f.resolved && !(f.reply && f.reply.length > 0)) && (
                            <button
                              className="action-btn reply"
                              onClick={() => {
                                setSelectedFeedback(f);
                                setShowReplyModal(true);
                              }}
                            >
                              💬 Reply
                            </button>
                          )}
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
                {(!feedback || feedback.length === 0) && (
                  <div style={{ padding: 16, color: '#ccc' }}>No feedback found.</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                  <div style={{ color: '#bbb' }}>Page {feedbackPage} • {feedbackPerPage} per page</div>
                  <div>
                    <button className="action-btn" disabled={feedbackPage <= 1} onClick={() => setFeedbackPage(p => Math.max(1, p - 1))}>Prev</button>
                    <button className="action-btn" style={{ marginLeft: 8 }} disabled={(feedbackPage * feedbackPerPage) >= feedbackTotal} onClick={() => setFeedbackPage(p => p + 1)}>Next</button>
                  </div>
                </div>
              </>
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
