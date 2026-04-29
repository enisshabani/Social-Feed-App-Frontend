import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/globals.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
            Regjistrohu
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)' }}>Keni tashmë llogari? Hyni këtu.</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
