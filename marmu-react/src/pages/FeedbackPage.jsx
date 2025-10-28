// pages/FeedbackPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';
import Navbar from '../components/Navbar';
import ProfileMenu from '../components/ProfileMenu.jsx';
import LoginModal from '../components/LoginModal.jsx';
import SignupModal from '../components/SignupModal.jsx';
import '../css/navbar.css';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [message, setMessage] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`);
      const data = await response.json();
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

    if (selectedRating === 0 || message.trim() === '') {
      alert('⚠️ Please select a rating and write a message.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          stars: selectedRating,
          message: message.trim()
        })
      });

      const result = await response.json();

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
      setLoading(false);
    }
  };

  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  return (
    <div className="dark-mode">
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
                onClick={() => handleStarClick(star)}
                className={star <= selectedRating ? 'active' : ''}
                style={{ cursor: 'pointer', fontSize: '2rem' }}
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
          />

          <button
            className="submit-btn"
            onClick={submitFeedback}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
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
      />

      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        switchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}
