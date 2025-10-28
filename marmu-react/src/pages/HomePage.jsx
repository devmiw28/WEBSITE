import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE_URL } from '../App';
import Navbar from '../components/Navbar.jsx';
import ProfileMenu from '../components/ProfileMenu.jsx';
import LoginModal from '../components/LoginModal.jsx';
import SignupModal from '../components/SignupModal.jsx';
import '../css/style.css';
import '../css/navbar.css';
import '../css/authModal.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
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

  const handleBookNow = () => {
    if (!user) {
      setShowLogin(true);
    } else {
      navigate('/book');
    }
  };

  const handleExploreTattoos = () => {
    navigate('/services?tab=tattoo');
  }

  return (
    <div className={theme}>
      <Navbar
        onProfileClick={() => {
          if (user) setShowProfileMenu(!showProfileMenu);
          else setShowLogin(true);
        }}
        user={user}
      />

      {/* Hero Section */}
      <section className="page home-page">
        {/* Note: The hero background image requires the file at /assets/hero-background.jpg */}
        <div className="hero">
          <div className="hero-overlay"></div>
        </div>

        <div className="container content">

          {/* --- Section 1: Cuts that Define Confidence (Haircut focus) --- */}
          <div className="split">
            <div className="hero-text">
              <h1 className="big-title">Cuts that define confidence</h1>
              <p className="sub">Confidence begins with a fresh cut. Our expert barbers craft the perfect style just for you.</p>
              <div className="btn-row">
                <button onClick={handleBookNow} className="btn primary">Book Now</button>
                <button onClick={handleExploreTattoos} className="btn outline">View Tattoo</button>
              </div>
            </div>

            <div className="gallery-small">
              <img src="/assets/hair3.jpg" alt="Haircut Style 1" />
              <img src="/assets/Haircut_Sample.png" alt="Haircut Style 2" />
              <img src="/assets/hair2.jpg" alt="Haircut Style 3" />
            </div>
          </div>

          {/* --- Section 2: Art That Stays With You (Tattoo focus) --- */}
          <div className="split">
            <div className="split-gallery">
              <img src="/assets/tat1.jpg" alt="Tattoo Design 1" />
              <img src="/assets/tat2.jpg" alt="Tattoo Design 2" />
            </div>

            <div className="split-text">
              <h1 className="big-title">Art that stays with you</h1>
              <p className="sub">From intricate linework to bold custom pieces, our tattoo studio tells stories that last forever.</p>
              <div className="btn-row">
                <button onClick={handleBookNow} className="btn primary">Book Now</button>
                <button onClick={handleExploreTattoos} className="btn outline">View Tattoo</button>
              </div>
            </div>
          </div>

          {/* --- Section 3: Perks & Promo --- */}
          <section className="perks-promo">
            <h2 className="section-title">Perks & Promo</h2>
            <div className="promo-box">
              <h3>Join our promo <br /> Enjoy a free haircut after your 5th visit!</h3>
            </div>
          </section>

        </div>
      </section>

      {/* --- Footer (Updated to match image) --- */}
      <footer>
        <h3>Marmu Barber & Tattoo Shop</h3>

        {/* Placeholder icons for social media, assuming you'll use Font Awesome */}
        <div className="social-icons">
          <a href="#" aria-label="Instagram">(IG)</a>
          <a href="#" aria-label="Facebook">(FB)</a>
          <a href="mailto:example@gmail.com" aria-label="Email">(Mail)</a>
        </div>

        <div className="footer-content">
          <div className="footer-column">
            <h4>Location</h4>
            <p>766 Bernardino St<br />Mabolo, 4401<br />Naga City, Philippines</p>
          </div>
          <div className="footer-column">
            <h4>Opening Time</h4>
            <p>Monday to Friday<br />9am - 8pm</p>
          </div>
        </div>

        <p className="copyright">All rights reserved Marmu Barber & Tattoo Shop ©2022</p>
      </footer>

      {/* Profile Menu */}
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