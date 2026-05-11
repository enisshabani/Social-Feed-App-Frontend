import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import api from '../services/api';
import '../styles/globals.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Funksioni për të llogaritur fuqinë e fjalëkalimit (0 deri 4)
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
      default: return '#e0e0e0';
    }
  };

  const getStrengthText = (score: number) => {
    if (password.length === 0) return '';
    switch (score) {
      case 0: return 'Shumë i dobët (vendosni të paktën 8 karaktere)';
      case 1: return 'I dobët (shtoni shkronja të mëdha/vogla)';
      case 2: return 'Mesatar (shtoni numra)';
      case 3: return 'I fortë (shtoni simbole)';
      case 4: return 'Shumë i fortë!';
      default: return '';
    }
  };

  const strengthScore = calculatePasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post('/api/v1/auth/register', {
        email,
        username,
        password
      });
      
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gabim gjatë regjistrimit. Keni provuar një email/username ekzistues?');
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Njëjtë si në Login: ia kalojmë token-in backend-it
      const response = await api.post('/api/v1/auth/google', { token: idToken });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gabim gjatë regjistrimit me Google.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>
        <div className="mastodon-logo">KaPak</div>
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username" 
              required 
            />
          </div>

          <div className="input-group">
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresa e email-it" 
              required 
            />
          </div>
          
          <div className="input-group" style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Fjalëkalimi"
              style={{ paddingRight: '2.5rem' }}
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: password ? '15px' : '50%', // Përshtatet me lartësinë nëse ka tregues të fuqisë
                transform: password ? 'none' : 'translateY(-50%)',
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
            {/* Treguesi i fuqisë së fjalëkalimit */}
            {password && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '4px', height: '6px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div 
                      key={level} 
                      style={{ 
                        flex: 1, 
                        backgroundColor: strengthScore >= level ? getStrengthColor(strengthScore) : 'var(--border-color, #e0e0e0)',
                        borderRadius: '3px',
                        transition: 'background-color 0.3s ease'
                      }} 
                    />
                  ))}
                </div>
                <span style={{ color: getStrengthColor(strengthScore), transition: 'color 0.3s ease' }}>
                  {getStrengthText(strengthScore)}
                </span>
              </div>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            Regjistrohu
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--border-color)' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>OSE</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
        </div>

        <button 
          onClick={handleGoogleRegister} 
          type="button" 
          style={{ 
            width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #777777', 
            backgroundColor: 'transparent', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold' 
          }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
          Vazhdo me Google
        </button>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)' }}>Keni tashmë llogari? Hyni këtu.</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
