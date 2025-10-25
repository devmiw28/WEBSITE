// components/Navbar.jsx
import { useNavigate } from 'react-router-dom';

function Navbar({ onProfileClick, user }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src="/assets/Logo.png" alt="Logo" className="Logo" />
      </div>
      <div className="nav-menu">
        <a onClick={() => navigate('/')} className="nav-item">Homepage</a>
        <a onClick={() => navigate('/book')} className="nav-item">Book Now</a>
        <a onClick={() => navigate('/services')} className="nav-item">Services</a>
        <a onClick={() => navigate('/feedback')} className="nav-item">Feedback</a>
      </div>
      <div className="nav-right">
        <button 
          className="profile-btn"
          onClick={user ? onProfileClick : () => navigate('/login')}
        >
          {user ? '👤' : '🔒'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;