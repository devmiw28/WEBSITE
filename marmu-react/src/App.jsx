// App.jsx - Main application component with routing
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import ForgotPasswordModal from './components/ForgotPasswordModal.jsx';
import BookingPage from './pages/BookingPage';
import ServicesPage from './pages/ServicesPage';
import FeedbackPage from './pages/FeedbackPage';
import AdminPage from './pages/AdminPage';
import StaffAvailabilityPage from './components/StaffAvailabilityPage.jsx';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';

const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? '';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false, onLoginRequired }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    onLoginRequired?.(); 
    return null;
  }

  if (adminOnly && user.role !== 'Admin' && user.role !== 'Barber' && user.role !== 'TattooArtist') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppInner() {
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (location?.state?.openLoginModal) {
      setShowLogin(true);
    }
    if (location?.state?.openForgotModal) {
      setShowForgot(true);
    }
    // Clear the state so reloading or navigating doesn't re-trigger
    try {
      const url = location.pathname + (location.search || '') + (location.hash || '');
      if (location?.state?.openLoginModal || location?.state?.openForgotModal) {
        window.history.replaceState({}, document.title, url);
      }
    } catch {}
  }, [location]);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Keep route compatibility: navigating to /forgot-password maps to opening the modal on home */}
        <Route path="/forgot-password" element={<Navigate to="/" state={{ openForgotModal: true }} replace />} />
        <Route
          path="/book"
          element={
            <ProtectedRoute onLoginRequired={() => setShowLogin(true)}>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/staff/availability" element={<StaffAvailabilityPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        switchToSignup={() => { setShowLogin(false); setShowSignup(true); }}
        switchToForgot={() => { setShowLogin(false); setShowForgot(true); }}
      />
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        switchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
      />
      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
        switchToLogin={() => setShowLogin(true)}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </Router>
  );
}

export default App;
export { API_BASE_URL };
