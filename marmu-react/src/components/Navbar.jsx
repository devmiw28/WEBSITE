import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar({ onProfileClick }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="navbar-hero">
      {/* hero background moved here so navbar overlays the image */}
      <div className="hero">
        <div className="hero-overlay" />

        <nav className="navbar">
          <div className="nav-left">
            <img src="/assets/Logo.png" alt="Logo" className="Logo" />
          </div>

          <div className="nav-menu">
            <a onClick={() => navigate('/')} className="nav-item">Homepage</a>
            <a onClick={() => user ? navigate('/book') : onProfileClick()} className="nav-item">Book Now</a>
            <a onClick={() => navigate('/services')} className="nav-item">Services</a>
            <a onClick={() => navigate('/feedback')} className="nav-item">Feedback</a>
          </div>

          <div className="nav-right">
            <button
              className="profile-btn"
              onClick={user ? onProfileClick : onProfileClick}
            >
              {user ? '👤' : '🔒'}
            </button>
          </div>
        </nav>

        {/* Hero overlay content (centered on image) */}
        <div className="hero-content">
          <div className="hero-inner">
            <h1 className="big-title">Cuts that define confidence</h1>
            <p className="sub">Confidence begins with a fresh cut. Our expert barbers craft the perfect style just for you.</p>
            <div className="btn-row">
              <button onClick={() => (user ? navigate('/book') : onProfileClick())} className="btn primary">Book Now</button>
              <button onClick={() => navigate('/services?tab=tattoo')} className="btn outline">View Tattoo</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
