import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/register.css';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t('email_verify_loading'));

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage(t('email_verify_missing'));
      return;
    }

    api.get('/api/v1/auth/verify-email', { params: { token } })
      .then((response) => {
        setStatus('success');
        setMessage(response.data?.message || t('email_verify_success'));
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || t('email_verify_error'));
      });
  }, [searchParams, t]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', padding: '1rem' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div className="reg-logo" style={{ marginBottom: '1.5rem' }}>
          <span className="reg-logo-text">kaPak</span>
        </div>
        <h2 style={{ marginBottom: '1rem' }}>{t('email_verify_title')}</h2>
        <p style={{ color: status === 'error' ? '#ef4444' : status === 'success' ? '#4caf50' : 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {message}
        </p>
        <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          {t('email_verify_login')}
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
