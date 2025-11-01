// pages/FeedbackPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';
import Navbar from '../components/Navbar';
import ProfileMenu from '../components/ProfileMenu.jsx';
import LoginModal from '../components/LoginModal.jsx';
import SignupModal from '../components/SignupModal.jsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.jsx';
import '../css/navbar.css';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [message, setMessage] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState('dark-mode');
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    setTheme(savedTheme);
    document.body.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark-mode' ? 'light-mode' : 'dark-mode';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme;
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      let data = [];
      try { data = text ? JSON.parse(text) : []; }
      catch (e) { throw new Error(`Unexpected response (${response.status}): ${text?.slice(0,120)}`); }
      setFeedbackList(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const handleStarClick = (rating) => {
    setSelectedRating(rating);
  };

  const submitFeedback = async () => {
    if (!user) {
      alert('⚠️ Please log in first to submit feedback.');
      navigate('/login');
      return;
    }

    // Admin and staff accounts should not submit feedback
    if (hasAnyRole && hasAnyRole(['admin', 'barber', 'tattooartist'])) {
      alert('⚠️ Admin and staff accounts cannot submit feedback.');
      return;
    }

    if (selectedRating === 0 || message.trim() === '') {
      alert('⚠️ Please select a rating and write a message.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: user.username,
          stars: selectedRating,
          message: message.trim()
        })
      });
      const text = await response.text();
      let result = {};
      try { result = text ? JSON.parse(text) : {}; }
      catch (e) { throw new Error(`Unexpected response (${response.status}): ${text?.slice(0,120)}`); }

      if (response.ok) {
        alert('✅ ' + result.message);
        setMessage('');
        setSelectedRating(0);
        loadFeedback();
      } else {
        alert('❌ ' + (result.error || 'Failed to submit feedback.'));
      }
    } catch (error) {
      alert('⚠️ Network error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  return (
    <div className={theme}>
      <Navbar
        onProfileClick={() => {
          if (user) setShowProfileMenu(!showProfileMenu);
          else setShowLogin(true);
        }}
        user={user}
      />
      <main>
        {/* Star Rating */}
        <section className="feedback-form">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => { if (!submitting && (!hasAnyRole || !hasAnyRole(['admin','barber','tattooartist']))) handleStarClick(star); }}
                className={star <= selectedRating ? 'active' : ''}
                style={{ cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '2rem' }}
              >
                {star <= selectedRating ? '★' : '☆'}
              </span>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your feedback..."
            rows="5"
            disabled={submitting || (hasAnyRole && hasAnyRole(['admin','barber','tattooartist']))}
          />

          <button
            className="submit-btn"
            onClick={submitFeedback}
            disabled={submitting || (hasAnyRole && hasAnyRole(['admin','barber','tattooartist']))}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
          {hasAnyRole && hasAnyRole(['admin','barber','tattooartist']) && (
            <p style={{ color: '#e0a', marginTop: '8px' }}>Admin/staff accounts cannot submit feedback from here.</p>
          )}
        </section>

        {/* Reviews List */}
        <section className="reviews">
          <h2>User Reviews</h2>
          <div className="feedback-list">
            {feedbackList.map((fb, index) => (
              <div key={index} className="feedback-card">
                <div className="feedback-header">
                  <h3>{fb.username}</h3>
                  <small>{fb.date}</small>
                </div>
                <div className="feedback-stars">{renderStars(fb.stars)}</div>
                <p className="feedback-message">{fb.message}</p>
                {fb.reply && (
                  <div className="admin-reply">
                    <strong>Admin Response:</strong> {fb.reply}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      {showProfileMenu && (
        <ProfileMenu
          onClose={() => setShowProfileMenu(false)}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      )}
      
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        switchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
        switchToForgot={() => {
          setShowLogin(false);
          setShowForgot(true);
        }}
      />

      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        switchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
        switchToLogin={() => setShowLogin(true)}
      />
    </div>
  );
}
