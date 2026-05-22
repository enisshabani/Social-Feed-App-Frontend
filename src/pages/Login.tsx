import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  
  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'account_disabled') {
      setError('Kjo llogari është fshirë ose çaktivizuar. Ju lutem kontaktoni administratorin.');
    }
  }, [location]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const trustedDeviceToken = localStorage.getItem('trustedDeviceToken');
      const response = await api.post('/api/v1/auth/google', { 
        token: idToken,
        trusted_device_token: trustedDeviceToken
      });
      
      if (response.data.requires_2fa) {
        setRequires2FA(true);
        setTempToken(response.data.temp_token);
        return;
      }
      
      const { access_token, refresh_token } = response.data;
      login(access_token, refresh_token, rememberMe);
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('login_error_google'));
    }
  };

  const handleGithubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const idToken = await result.user.getIdToken();
      
      const trustedDeviceToken = localStorage.getItem('trustedDeviceToken');
      const response = await api.post('/api/v1/auth/github', { 
        token: idToken,
        trusted_device_token: trustedDeviceToken
      });
      
      if (response.data.requires_2fa) {
        setRequires2FA(true);
        setTempToken(response.data.temp_token);
        return;
      }
      
      const { access_token, refresh_token } = response.data;
      login(access_token, refresh_token, rememberMe);
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('login_error_github'));
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await api.post('/api/v1/auth/login/2fa', {
        temp_token: tempToken,
        code: twoFactorCode,
        remember_device: rememberMe
      });
      
      if (response.data.trusted_device_token) {
        localStorage.setItem('trustedDeviceToken', response.data.trusted_device_token);
      }
      
      const { access_token, refresh_token } = response.data;
      login(access_token, refresh_token, rememberMe);
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('two_factor_error'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const trustedDeviceToken = localStorage.getItem('trustedDeviceToken');
      if (trustedDeviceToken) {
        formData.append('trusted_device_token', trustedDeviceToken);
      }

      const response = await api.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.data.requires_2fa) {
        setRequires2FA(true);
        setTempToken(response.data.temp_token);
        return;
      }
      
      const { access_token, refresh_token } = response.data;
      login(access_token, refresh_token, rememberMe);
      
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('login_error_generic'));
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>
        <div className="mastodon-logo">kaPak</div>
        
        {requires2FA ? (
          <form onSubmit={handle2FASubmit}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{t('two_factor_title')}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {t('two_factor_desc')}
              </p>
            </div>
            
            <div className="input-group">
              <input 
                type="text" 
                id="twoFactorCode" 
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder={t('two_factor_code_placeholder')} 
                required 
                autoFocus
                style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem' }}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {t('two_factor_verify_btn')}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setRequires2FA(false);
                setTempToken('');
                setTwoFactorCode('');
              }} 
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {t('two_factor_go_back')}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleLogin}>
          <div className="input-group">
            <input 
              type="text" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login_email_username')} 
              required 
            />
          </div>
          
          <div className="input-group" style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login_password')} 
              style={{ paddingRight: '2.5rem' }}
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
            <input 
              type="checkbox" 
              id="rememberMe" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '8px', cursor: 'pointer', accentColor: 'var(--primary)', width: '16px', height: '16px' }}
            />
            <label htmlFor="rememberMe" style={{ color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer' }}>
              {t('login_remember_me')}
            </label>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            {t('login_button')}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--border-color)' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('login_or')}</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
        </div>

        <button 
          onClick={handleGoogleLogin} 
          type="button" 
          style={{ 
            width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #777777', 
            backgroundColor: 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold' 
          }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
          {t('login_google')}
        </button>

        <button 
          onClick={handleGithubLogin} 
          type="button" 
          style={{ 
            width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #777777', 
            backgroundColor: 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold', marginTop: '0.75rem'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          {t('login_github')}
        </button>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/forgot-password" style={{ color: '#6364ff' }}>{t('login_forgot_password')}</Link>
          <Link to="/register" style={{ color: 'var(--text-muted)' }}>{t('login_register_link')}</Link>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Login;
