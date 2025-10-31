import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar({ onProfileClick }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="site-header">
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
    </header>
  );
}

export default Navbar;
