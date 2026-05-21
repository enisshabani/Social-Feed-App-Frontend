import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/globals.css';
import '../styles/register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  // Date of birth UI only (not sent to backend)
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Fjalëkalimet nuk përputhen.');
      return;
    }

    if (!agreed) {
      setErrorMsg('Duhet të pranoni politikat e privatësisë.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/register', { username, email, password });
      // Success, move to step 3
      setStep(3);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || 'Gabim gjatë regjistrimit.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepper = () => (
    <div className="wizard-stepper">
      <div className="wizard-line"></div>
      <div 
        className="wizard-line-progress" 
        style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
      ></div>
      
      <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
        <div className="wizard-step-circle">
          {step > 1 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
        </div>
        <div className="wizard-step-label">Accept<br/>rules</div>
      </div>
      
      <div className={`wizard-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
        <div className="wizard-step-circle">
          {step > 2 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
        </div>
        <div className="wizard-step-label">Your details</div>
      </div>
      
      <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>
        <div className="wizard-step-circle"></div>
        <div className="wizard-step-label">Confirm<br/>email</div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="rules-container">
      <h1 className="rules-title">Some ground rules.</h1>
      <p className="rules-subtitle">These are set and enforced by the kaPak moderators.</p>

      <div className="rule-item">
        <div className="rule-number">1</div>
        <div className="rule-content">
          <div className="rule-title">No harassment or doxxing of others</div>
          <div className="rule-desc">Repeat attempts to communicate with users who have blocked you or creation of accounts solely to harass others is strictly prohibited.</div>
        </div>
      </div>

      <div className="rule-item">
        <div className="rule-number">2</div>
        <div className="rule-content">
          <div className="rule-title">Do not share false and misleading information</div>
          <div className="rule-desc">False and misleading information and links from low-quality sources may not be posted.</div>
        </div>
      </div>

      <div className="wizard-actions">
        <button className="btn-primary" onClick={() => setStep(2)}>Accept</button>
        <button className="btn-secondary" onClick={() => navigate('/login')}>Back</button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="rules-container">
      <h1 className="rules-title">Let's get you set up on kaPak.</h1>
      <p className="rules-subtitle">With an account on this server, you'll be able to follow any other person on the Fediverse.</p>

      {errorMsg && (
        <div className="error-message">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleRegister}>
        <div className="input-group">
          <label>Username *</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            required
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>You can use letters, numbers, and underscores</p>
        </div>

        <div className="input-group">
          <label>Email address *</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password *</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
          />
        </div>

        <div className="input-group">
          <label>Date of birth *</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>We have to make sure you're at least 16 to use kaPak. We won't store this.</p>
          <div className="date-inputs">
            <input type="text" placeholder="DD" value={dobDay} onChange={(e) => setDobDay(e.target.value)} maxLength={2} required />
            <input type="text" placeholder="MM" value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} maxLength={2} required />
            <input type="text" placeholder="YYYY" value={dobYear} onChange={(e) => setDobYear(e.target.value)} maxLength={4} required />
          </div>
        </div>

        <label className="privacy-checkbox">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
          <span>I have read and agree to the <a href="#">privacy policy</a></span>
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Sign up'}
        </button>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="inbox-container">
      <h1 className="inbox-title">Check your inbox</h1>
      <p className="inbox-desc">
        Click the link we sent to <strong>{email}</strong> to begin using kaPak. We'll wait right here.
      </p>
      
      <div className="inbox-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        Didn't get a link?
      </div>
      
      <button 
        className="btn-primary" 
        style={{ marginTop: '3rem' }}
        onClick={() => navigate('/login')}
      >
        Go to Login
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', alignItems: 'center', paddingTop: '2rem' }}>
      
      <div className="mastodon-logo" style={{ marginBottom: '1rem' }}>
        kaPak
      </div>

      <div className="register-wizard-container">
        {renderStepper()}
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
      
    </div>
  );
};

export default Register;
