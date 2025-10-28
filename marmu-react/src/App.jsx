// App.jsx - Main application component with routing
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import BookingPage from './pages/BookingPage';
import ServicesPage from './pages/ServicesPage';
import FeedbackPage from './pages/FeedbackPage';
import AdminPage from './pages/AdminPage';
import StaffAvailabilityPage from './pages/StaffAvailabilityPage';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';

const API_BASE_URL = 'http://127.0.0.1:5000';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false, onLoginRequired }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    onLoginRequired?.(); // open login modal
    return null;
  }

  if (adminOnly && user.role !== 'Admin' && user.role !== 'Barber' && user.role !== 'TattooArtist') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* <Route path="/login" element={<LoginModal />} />
            <Route path="/signup" element={<SignupModal />} /> */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
          />
          <SignupModal
            isOpen={showSignup}
            onClose={() => setShowSignup(false)}
            switchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
export { API_BASE_URL };