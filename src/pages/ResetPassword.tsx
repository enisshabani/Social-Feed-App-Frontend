import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/globals.css';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Kapim token-in direkt nga URL gjatë renderimit (pa useEffect)
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Fjalëkalimet nuk përputhen!');
      return;
    }

    if (password.length < 6) {
      setError('Fjalëkalimi duhet të ketë të paktën 6 karaktere.');
      return;
    }

    try {
      // Ky endpoint duhet të krijohet në backend (POST /api/v1/auth/reset-password)
      await api.post('/api/v1/auth/reset-password', {
        token: token,
        new_password: password
      });

      setMessage('Fjalëkalimi u ndryshua me sukses! Tani mund të logoheni.');
      // Ose e qojme automatikisht tek '/' pas 3 sekondave:
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      const errorMsg = errorObj.response?.data?.detail || 'Gabim gjatë rinovimit të fjalëkalimit. Ndoshta linku ka skaduar.';
      setError(errorMsg);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>
        <div className="mastodon-logo">KaPak</div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Fjalëkalimi i Ri</h2>

        {!token ? (
          <div style={{ textAlign: 'center' }}>
            <div className="error-message">Link i mbetur bosh ose i pasaktë. Kërkoni sërish një link të ri nga forma e Harruat Fjalëkalimin.</div>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/forgot-password" style={{ color: '#6364ff' }}>Shko te Kërkesa e Fjalëkalimit</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Fjalëkalimi i ri (min. 6 karaktere)"
                required
              />
            </div>

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmo fjalëkalimin e ri"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div style={{ color: '#4caf50', padding: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              Ruaj Fjalëkalimin
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

