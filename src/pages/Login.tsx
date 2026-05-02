import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/globals.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresa e email-it" 
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
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/forgot-password" style={{ color: '#6364ff' }}>Harruat fjalëkalimin?</Link>
          <Link to="/register" style={{ color: 'var(--text-muted)' }}>Nuk keni llogari? Regjistrohuni.</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
