import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../services/firebase';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { getFirebaseErrorMessage, sendVerificationEmail } from '../utils/emailVerification';
import { getCurrentTenantId } from '../utils/tenant';
import '../styles/globals.css';
import '../styles/register.css';

type VerificationState = {
  email?: string;
};

const EmailVerification: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'verified'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const email = (location.state as VerificationState | null)?.email || auth.currentUser?.email || '';

  const confirmBackendVerification = async () => {
    const user = auth.currentUser;
    if (!user) {
      setStatus('idle');
      setError(t('email_verify_error_login_required'));
      return;
    }

    setStatus('checking');
    setError('');

    await user.reload();
    if (!user.emailVerified) {
      setStatus('idle');
      setError(t('email_verify_error_not_verified'));
      return;
    }

    const token = await user.getIdToken(true);
    await api.post('/api/v1/auth/verify-email', {
      token,
      tenant_id: getCurrentTenantId(),
    });

    setStatus('verified');
    setMessage(t('email_verify_success'));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode !== 'verifyEmail' || !oobCode) {
      return;
    }

    const applyEmailCode = async () => {
      try {
        setStatus('checking');
        setError('');
        await applyActionCode(auth, oobCode);
        await confirmBackendVerification();
      } catch (err: any) {
        setStatus('idle');
        setError(getFirebaseErrorMessage(err, t('email_verify_error_generic')));
      }
    };

    applyEmailCode();
  }, [location.search]);

  const handleCheckVerification = async () => {
    try {
      await confirmBackendVerification();
    } catch (err: any) {
      setStatus('idle');
      setError(getFirebaseErrorMessage(err, t('email_verify_error_generic')));
    }
  };

  const handleResend = async () => {
    try {
      setError('');
      const user = auth.currentUser;
      if (!user) {
        setError(t('email_verify_error_login_required'));
        return;
      }

      await sendVerificationEmail(user);
      setMessage(t('email_verify_resent'));
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err, t('email_verify_error_resend')));
    }
  };

  return (
    <div className="verify-email-page">
      <div className="mastodon-panel verify-email-panel">
        <div className="reg-logo verify-email-logo">
          <span className="reg-logo-text">kaPak</span>
        </div>

        <div className={`verify-email-icon ${status === 'verified' ? 'verified' : ''}`}>
          {status === 'verified' ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          )}
        </div>

        <h2 className="verify-email-title">{t('email_verify_title')}</h2>
        <p className="verify-email-copy">
          {status === 'verified'
            ? t('email_verify_success_desc')
            : t('email_verify_desc').replace('{email}', email || t('email_verify_your_email'))}
        </p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {status === 'verified' ? (
          <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
            {t('email_verify_login')}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCheckVerification}
              disabled={status === 'checking'}
            >
              {status === 'checking' ? t('email_verify_checking') : t('email_verify_check')}
            </button>
            <button type="button" className="reg-btn-back" onClick={handleResend}>
              {t('email_verify_resend')}
            </button>
          </>
        )}

        <div className="reg-footer-link">
          <Link to="/login" style={{ color: 'var(--text-muted)' }}>{t('email_verify_back_login')}</Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
