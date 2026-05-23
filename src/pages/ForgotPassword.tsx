import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/register.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      const res = await api.post('/api/v1/auth/forgot-password', { email });
      if (res.data.code) {
        window.alert(`Kodi juaj i sigurisë është: ${res.data.code}`);
        navigate(`/verify-code`);
      } else {
        setMessage(t('forgot_success_msg'));
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || t('forgot_error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>
        <div className="reg-logo" style={{ marginBottom: '1.5rem' }}>
          <span className="reg-logo-text">kaPak</span>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{t('forgot_title')}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('forgot_email_placeholder')} 
              required 
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {message && <div style={{ color: '#4caf50', padding: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={isLoading}>
            {isLoading ? t('forgot_btn_sending') : t('forgot_btn_send')}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/login" style={{ color: '#6364ff' }}>{t('forgot_back_login')}</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

