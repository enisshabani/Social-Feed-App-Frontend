import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
<<<<<<< Updated upstream
import Feed from './pages/Feed';

// Komponent për të mbrojtur rrugët që duan kyçje
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
=======
import VerifyCode from './pages/VerifyCode';
import Feed from './pages/Feed';import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Followers from './pages/Followers';
import SearchPage from './pages/SearchPage';
import HashtagFeed from './pages/HashtagFeed';
// Komponent për të mbrojtur rrugët që duan kyçje
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
>>>>>>> Stashed changes
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
<<<<<<< Updated upstream
=======
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/followers/:userId" element={<PrivateRoute><Followers /></PrivateRoute>} />
        <Route path="/following/:userId" element={<PrivateRoute><Followers /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
        <Route path="/hashtag/:name" element={<PrivateRoute><HashtagFeed /></PrivateRoute>} />
>>>>>>> Stashed changes
        
        {/* Nga rruga kryesore (/) çojmë te /feed ose /login varet nga rasti */}
        <Route path="/" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
