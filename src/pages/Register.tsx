import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/register.css';

const Register: React.FC = () => {
  const { t } = useLanguage();

  const RULES = [
    {
      title: t('register_rule1_title'),
      desc: t('register_rule1_desc'),
    },
    {
      title: t('register_rule2_title'),
      desc: t('register_rule2_desc'),
    },
    {
      title: t('register_rule3_title'),
      desc: t('register_rule3_desc'),
    },
    {
      title: t('register_rule4_title'),
      desc: t('register_rule4_desc'),
    },
    {
      title: t('register_rule5_title'),
      desc: t('register_rule5_desc'),
    },
    {
      title: t('register_rule6_title'),
      desc: t('register_rule6_desc'),
    },
  ];

  const [step, setStep] = useState(0); // 0 = rules, 1 = details
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { login } = useAuth();

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z\d]/.test(pass)) score += 1;
    return score;
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0: return '#d32f2f';
      case 1: return '#f57c00';
      case 2: return '#fbc02d';
      case 3: return '#7cb342';
      case 4: return '#388e3c';
      default: return 'var(--border-input)';
    }
  };

  const getStrengthText = (score: number) => {
    if (password.length === 0) return '';
    switch (score) {
      case 0: return t('register_pass_very_weak');
      case 1: return t('register_pass_weak');
      case 2: return t('register_pass_fair');
      case 3: return t('register_pass_strong');
      case 4: return t('register_pass_very_strong');
      default: return '';
    }
  };

  const strengthScore = calculatePasswordStrength(password);

  const toggleRule = (idx: number) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('register_error_passmatch'));
      return;
    }
    try {
      await api.post('/api/v1/auth/register', { email, username, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('register_error_generic'));
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await api.post('/api/v1/auth/google', { token: idToken });
      const { access_token, refresh_token } = response.data;
      login(access_token, refresh_token, false);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('login_error_google'));
    }
  };

  const handleGithubRegister = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const idToken = await result.user.getIdToken();
      const response = await api.post('/api/v1/auth/github', { token: idToken });
      const { access_token, refresh_token } = response.data;
      login(access_token, refresh_token, false);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('login_error_github'));
    }
  };

  return (
    <div className="reg-page">
      <div className="reg-panel">
        {/* Logo */}
        <div className="reg-logo">
          <span className="reg-logo-text">kaPak</span>
        </div>

        {/* Stepper */}
        <div className="reg-stepper">
          <div className={`reg-step ${step >= 0 ? 'active' : ''} ${step > 0 ? 'completed' : ''}`}>
            <div className="reg-step-circle">
              {step > 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="reg-step-dot" />
              )}
            </div>
            <span className="reg-step-label">{t('register_stepper_1')}</span>
          </div>

          <div className={`reg-stepper-line ${step > 0 ? 'filled' : ''}`} />

          <div className={`reg-step ${step >= 1 ? 'active' : ''}`}>
            <div className="reg-step-circle">
              {step === 1 ? (
                <span className="reg-step-dot" />
              ) : null}
            </div>
            <span className="reg-step-label">{t('register_stepper_2')}</span>
          </div>
        </div>

        {/* ── STEP 0: Rules ── */}
        {step === 0 && (
          <>
            <h2 className="reg-title">{t('register_step1_title')}</h2>
            <p className="reg-subtitle">{t('register_step1_subtitle')}</p>

            <div className="reg-rules-list">
              {RULES.map((rule, idx) => (
                <div className="reg-rule-item" key={idx}>
                  <div className="reg-rule-header" onClick={() => toggleRule(idx)}>
                    <span className="reg-rule-num">{idx + 1}</span>
                    <div className="reg-rule-body">
                      <p className="reg-rule-title">{rule.title}</p>
                      {expandedRules.has(idx) && (
                        <p className="reg-rule-desc">{rule.desc}</p>
                      )}
                    </div>
                    <button className="reg-rule-toggle">
                      {expandedRules.has(idx) ? '▲' : '…'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary reg-btn" onClick={() => setStep(1)}>
              {t('register_step1_accept')}
            </button>
            <button className="reg-btn-back" onClick={() => navigate('/login')}>
              {t('register_step1_back')}
            </button>
          </>
        )}

        {/* ── STEP 1: Your Details ── */}
        {step === 1 && (
          <>
            <h2 className="reg-title">{t('register_step2_title')}</h2>
            <p className="reg-subtitle">{t('register_step2_subtitle')}</p>

            <form onSubmit={handleRegister} style={{ width: '100%' }}>
              {/* Username */}
              <div className="reg-field">
                <label className="reg-label">
                  {t('register_username')}
                </label>
                <div className="reg-input-wrap">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder=""
                    required
                    className="reg-input"
                  />
                  <span className="reg-input-suffix">@kapak.social</span>
                </div>
                <span className="reg-hint">{t('register_username_hint')}</span>
              </div>

              {/* Email */}
              <div className="reg-field">
                <label className="reg-label">{t('register_email')}</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="reg-input"
                />
              </div>

              {/* Password */}
              <div className="reg-field">
                <label className="reg-label">{t('register_password')}</label>
                <div className="reg-input-pw-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="reg-input"
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    className="reg-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {password && (
                  <div className="reg-strength">
                    <div className="reg-strength-bars">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="reg-strength-bar"
                          style={{
                            backgroundColor: strengthScore >= level ? getStrengthColor(strengthScore) : 'var(--border-input)',
                          }}
                        />
                      ))}
                    </div>
                    <span className="reg-strength-text" style={{ color: getStrengthColor(strengthScore) }}>
                      {getStrengthText(strengthScore)}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="reg-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('register_confirm_password')}
                  required
                  className="reg-input"
                />
              </div>

              {/* Date of birth */}
              <div className="reg-field">
                <label className="reg-label">{t('register_dob')}</label>
                <p className="reg-hint">{t('register_dob_hint')}</p>
                <div className="reg-dob-wrap">
                  <input
                    type="text"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    placeholder="DD"
                    maxLength={2}
                    className="reg-input reg-dob-input"
                  />
                  <input
                    type="text"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    placeholder="MM"
                    maxLength={2}
                    className="reg-input reg-dob-input"
                  />
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="YYYY"
                    maxLength={4}
                    className="reg-input reg-dob-input reg-dob-year"
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="reg-privacy">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="reg-checkbox"
                />
                <label htmlFor="privacy" className="reg-privacy-label">
                  {t('register_privacy')}{' '}
                  <Link to="/privacy-policy" className="reg-link">{t('register_privacy_link')}</Link>
                </label>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="btn-primary reg-btn"
                disabled={!privacyChecked}
                style={{ opacity: privacyChecked ? 1 : 0.5 }}
              >
                {t('register_button')}
              </button>
            </form>

            {/* Social register */}
            <div className="reg-divider">
              <hr className="reg-hr" />
              <span className="reg-or">{t('login_or')}</span>
              <hr className="reg-hr" />
            </div>

            <button onClick={handleGoogleRegister} type="button" className="reg-social-btn">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" height="20" />
              {t('login_google')}
            </button>

            <button onClick={handleGithubRegister} type="button" className="reg-social-btn" style={{ marginTop: '0.6rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              {t('login_github')}
            </button>

            <div className="reg-footer-link">
              <Link to="/login" style={{ color: 'var(--text-muted)' }}>{t('register_login_link')}</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
