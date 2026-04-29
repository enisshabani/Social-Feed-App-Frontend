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
      
      // Pas regjistrimit, dërgoje përdoruesin tek Login
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gabim gjatë regjistrimit. Keni provuar një email/username ekzistues?');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: 'bold' }}>Krijoni Llogari</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Bashkohuni me KaPak sot!</p>
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="p.sh. albani123" 
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emri@email.com" 
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Fjalëkalimi</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Të paktën 6 karaktere" 
              required 
            />
          </div>
          
          {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Regjistrohu
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Keni tashmë llogari? <Link to="/login" style={{ fontWeight: '600' }}>Hyni këtu</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
