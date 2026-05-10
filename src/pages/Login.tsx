import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import api from '../services/api';
import '../styles/globals.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Do t'ia dërgojmë token-in e Google Backend-it tonë
      const response = await api.post('/api/v1/auth/google', { token: idToken });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gabim gjatë kyçjes me Google.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gabim gjatë logimit. Ju lutem provoni përsëri.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>
        <div className="mastodon-logo">KaPak</div>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input 
              type="text" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ose Username" 
              required 
            />
          </div>
          
          <div className="input-group">
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Fjalëkalimi" 
              required 
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            Hyr
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--border-color)' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>OSE</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
        </div>

        <button 
          onClick={handleGoogleLogin} 
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
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/forgot-password" style={{ color: '#6364ff' }}>Harruat fjalëkalimin?</Link>
          <Link to="/register" style={{ color: 'var(--text-muted)' }}>Nuk keni llogari? Regjistrohuni.</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
