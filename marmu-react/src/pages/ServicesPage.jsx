// pages/ServicesPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';
import Navbar from '../components/Navbar';
import ProfileMenu from '../components/ProfileMenu.jsx';
import LoginModal from '../components/LoginModal.jsx';
import SignupModal from '../components/SignupModal.jsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.jsx';
import '../css/services.css';

export default function ServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'tattoo');
  const [tattooDesigns, setTattooDesigns] = useState([]);
  const [haircutStyles, setHaircutStyles] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [theme, setTheme] = useState('dark-mode');
  const [showForgot, setShowForgot] = useState(false);

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
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/images`);
      const data = await response.json();

      if (data.tattoos) setTattooDesigns(data.tattoos);
      if (data.haircuts) setHaircutStyles(data.haircuts);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const showTab = (tab) => {
    setActiveTab(tab);
  };

  const renderGalleryCards = (items) => {
    if (loading) return <div className="loading">Loading...</div>;
    if (items.length === 0) return <div className="no-items">No items available</div>;

    return items.map((item, index) => (
      <div key={index} className="gallery-card" onClick={() => setSelectedImage(item.image)}>
        <img src={item.image} alt={item.name} />
        <h3>{item.name}</h3>
      </div>
    ));
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

      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'tattoo' ? 'active' : ''}`}
          onClick={() => showTab('tattoo')}
        >
          Tattoo Designs
        </button>
        <button
          className={`tab-btn ${activeTab === 'haircut' ? 'active' : ''}`}
          onClick={() => showTab('haircut')}
        >
          Haircut Styles
        </button>
      </div>

      {/* Tattoo Gallery */}
      <div
        className={`gallery-container ${activeTab === 'tattoo' ? '' : 'hidden'}`}
      >
        {/* The inline styles below will be overridden by the CSS file */}
        <h2 style={{ textAlign: 'center', color: '#8B4513', marginBottom: '30px' }}>
          Art That Stays With You Forever
        </h2>
        <div className="gallery-grid">
          {renderGalleryCards(tattooDesigns)}
        </div>
      </div>

      {/* Haircut Gallery */}
      <div
        className={`gallery-container ${activeTab === 'haircut' ? '' : 'hidden'}`}
      >
        <h2 style={{ textAlign: 'center', color: '#4169E1', marginBottom: '30px' }}>
          Cuts That Define Confidence
        </h2>
        <div className="gallery-grid">
          {renderGalleryCards(haircutStyles)}
        </div>
      </div>

      {/* === START: NEW PRICE LIST SECTION === */}
      <div className="price-list-container">
        <h2>Tattoo Price Range</h2>
        <ul className="price-list">
          <li className="price-list-item">
            Traditional <span>- ₱</span>
          </li>
          <li className="price-list-item">
            Realism <span>- ₱</span>
          </li>
          <li className="price-list-item">
            Watercolor <span>- ₱</span>
          </li>
          <li className="price-list-item">
            Minimalist <span>- ₱</span>
          </li>
          <li className="price-list-item">
            Tribal <span>- ₱</span>
          </li>
        </ul>
      </div>
      {/* === END: NEW PRICE LIST SECTION === */}


      {/* Book Now Section */}
      <div className="book-now-section">
        <button
          className="book-now-btn"
          onClick={() => navigate('/book')}
        >
          Book an Appointment Now
        </button>
      </div>
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content">
            <img src={selectedImage} alt="Expanded view" />
          </div>
        </div>
      )}
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
