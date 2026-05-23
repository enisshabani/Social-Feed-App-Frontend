import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/globals.css';
import '../styles/register.css';

const VerifyEmail: React.FC = () => {
  const [message, setMessage] = useState('Duke verifikuar email-in...');
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setMessage('');
      setError('Linku i verifikimit mungon ose është i pasaktë.');
      return;
    }

    api
      .get('/api/v1/auth/verify-email', { params: { token } })
      .then((response) => {
        setError('');
        setMessage(response.data?.message || 'Email-i u verifikua me sukses.');
      })
      .catch((err) => {
        setMessage('');
        setError(err.response?.data?.detail || 'Verifikimi dështoi. Linku mund të ketë skaduar.');
      });
  }, [location.search]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div className="reg-logo" style={{ marginBottom: '1.5rem' }}>
          <span className="reg-logo-text">kaPak</span>
        </div>
        <h2 style={{ marginBottom: '1rem' }}>Verifikimi i email-it</h2>
        {message && <div style={{ color: '#4caf50', padding: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <Link to="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
          Shko te hyrja
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
