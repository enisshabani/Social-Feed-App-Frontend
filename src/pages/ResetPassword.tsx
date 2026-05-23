import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/register.css';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError(t('reset_error_passmatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('reset_error_passlength'));
      return;
    }

    try {
      await api.post('/api/v1/auth/reset-password', {
        token: token,
        new_password: password
      });

      setMessage(t('reset_success_msg'));
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      const errorMsg = errorObj.response?.data?.detail || t('reset_error_generic');
      setError(errorMsg);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>
        <div className="reg-logo" style={{ marginBottom: '1.5rem' }}>
          <span className="reg-logo-text">kaPak</span>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{t('reset_title')}</h2>

        {!token ? (
          <div style={{ textAlign: 'center' }}>
            <div className="error-message">{t('reset_error_token_empty')}</div>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/forgot-password" style={{ color: '#6364ff' }}>{t('reset_go_forgot')}</Link>
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
                placeholder={t('reset_pass_placeholder')}
                required
              />
            </div>

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('reset_confirm_placeholder')}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div style={{ color: '#4caf50', padding: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {t('reset_btn_save')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

