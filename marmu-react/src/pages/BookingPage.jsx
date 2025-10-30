// pages/BookingPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';
import Navbar from '../components/Navbar';
import ProfileMenu from '../components/ProfileMenu.jsx';
import '../css/navbar.css';

export default function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [formData, setFormData] = useState({
    service: '',
    staff_id: '',
    date: '',
    time: '',
    remarks: ''
  });
  const [staffList, setStaffList] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [theme, setTheme] = useState('dark-mode');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark-mode' ? 'light-mode' : 'dark-mode';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme;
  };

  // Fetch staff list when service changes
  useEffect(() => {
    if (formData.service) {
      fetch(`${API_BASE_URL}/api/staff/${formData.service}`)
        .then(res => res.json())
        .then(setStaffList)
        .catch(err => console.error('Error fetching staff:', err));
    } else {
      setStaffList([]);
    }
  }, [formData.service]);

  // Fetch available times when date or staff changes
  useEffect(() => {
    if (formData.date && formData.staff_id) {
      fetch(`${API_BASE_URL}/api/appointments/available_slots?date=${formData.date}&staff_id=${formData.staff_id}`)
        .then(res => res.json())
        .then(data => setAvailableTimes(data.available_times || []))
        .catch(err => console.error('Error fetching slots:', err));
    }
  }, [formData.date, formData.staff_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.service || !formData.staff_id || !formData.date || !formData.time) {
      alert('Please fill out all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          fullname: user.fullname,
          ...formData
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Booking failed');

      alert(`✅ Booking confirmed for ${user.fullname}\nService: ${formData.service}\nDate: ${formData.date}\nTime: ${formData.time}`);
      setFormData({ service: '', staff_id: '', date: '', time: '', remarks: '' });
      setAvailableTimes([]);
      setStaffList([]);
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark-mode">
      <Navbar
        onProfileClick={() => setShowProfileMenu(!showProfileMenu)}
        user={user}
      />

      <main className="booking-container">
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name:</label>
            <input type="text" value={user?.fullname || ''} readOnly />
          </div>

          <div className="form-group">
            <label>Service:</label>
            <select name="service" value={formData.service} onChange={handleChange} required>
              <option value="">-- Select Service --</option>
              <option value="Haircut">Haircut</option>
              <option value="Tattoo">Tattoo</option>
            </select>
          </div>

          {staffList.length > 0 && (
            <div className="form-group">
              <label>Select Staff:</label>
              <select name="staff_id" value={formData.staff_id} onChange={handleChange} required>
                <option value="">-- Select Staff --</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.fullname}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={today}
              required
            />
          </div>

          <div className="form-group">
            <label>Time:</label>
            <select name="time" value={formData.time} onChange={handleChange} required disabled={!formData.staff_id || !formData.date}>
              <option value="">
                {!formData.staff_id ? '- Select Staff -' : availableTimes.length === 0 ? '- No Slots Available -' : '-- Select Time --'}
              </option>
              {availableTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Remarks (Optional):</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              placeholder="Any special requests or notes..."
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </form>
      </main>
      {showProfileMenu && (
        <ProfileMenu
          onClose={() => setShowProfileMenu(false)}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      )}
    </div>
  );
}
