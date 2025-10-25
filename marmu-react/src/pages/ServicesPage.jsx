// pages/ServicesPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../App';
import Navbar from '../components/Navbar';
import '../css/services.css';

function ServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'tattoo');
  const [tattooDesigns, setTattooDesigns] = useState([]);
  const [haircutStyles, setHaircutStyles] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    if (items.length === 0) {
      return <div className="no-items">No items available</div>;
    }

    return items.map((item, index) => (
      <div key={index} className="gallery-card">
        <img src={`/${item.image}`} alt={item.name} />
        <h3>{item.name}</h3>
      </div>
    ));
  };

  return (
    <div className="dark-mode">
      <Navbar user={user} />

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'tattoo' ? 'active' : ''}`}
          onClick={() => showTab('tattoo')}
        >
          🎨 Tattoo Designs
        </button>
        <button
          className={`tab-btn ${activeTab === 'haircut' ? 'active' : ''}`}
          onClick={() => showTab('haircut')}
        >
          ✂️ Haircut Styles
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
          📅 Book an Appointment Now
        </button>
      </div>
    </div>
  );
}

export default ServicesPage;