// pages/BookingPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';
import Navbar from '../components/Navbar';

const AVAILABLE_TIMES = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

export default function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    service: '',
    date: '',
    time: '',
    remarks: ''
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formData.date) {
      fetchAvailableSlots(formData.date);
    }
  }, [formData.date]);

  const fetchAvailableSlots = async (date) => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/available_slots?date=${date}`);
      const data = await response.json();
      const booked = data.booked_times || [];
      const available = AVAILABLE_TIMES.filter(t => !booked.includes(t));
      setAvailableTimes(available);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableTimes(AVAILABLE_TIMES);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.service || !formData.date || !formData.time) {
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

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      alert(`✅ Booking confirmed for ${user.fullname}\nService: ${formData.service}\nDate: ${formData.date}\nTime: ${formData.time}\nStatus: PENDING`);
      
      setFormData({
        service: '',
        date: '',
        time: '',
        remarks: ''
      });
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="dark-mode">
      <Navbar user={user} />
      
      <main className="booking-container">
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              value={user?.fullname || ''}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Service:</label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Service --</option>
              <option value="Haircut">Haircut</option>
              <option value="Tattoo">Tattoo</option>
            </select>
          </div>

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
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              disabled={!formData.date}
              required
            >
              {!formData.date ? (
                <option>- Select a Date First -</option>
              ) : availableTimes.length === 0 ? (
                <option>- NO SLOTS AVAILABLE -</option>
              ) : (
                <>
                  <option value="">-- Select Time --</option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Remarks (Optional):</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="4"
              placeholder="Any special requests or notes..."
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </form>
      </main>
    </div>
  );
}

