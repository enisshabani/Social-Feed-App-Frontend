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
      // Backend-i mund të presë form data (OAuth2PasswordRequestForm)
      const formData = new URLSearchParams();
      formData.append('username', email); // Në OAuth2 "username" është shpesh fusha për email
      formData.append('password', password);

      const response = await api.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Pas logimit te suksesshem, kthehu në faqen e Feed (që do ta ndërtojmë më vonë)
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gabim gjatë logimit. Ju lutem provoni përsëri.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: 'bold' }}>Mirësevini përsëri</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Hyni në llogarinë tuaj në KaPak</p>
        
        <form onSubmit={handleLogin}>
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
              placeholder="••••••••" 
              required 
            />
          </div>
          
          {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Hyr
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Nuk keni llogari? <Link to="/register" style={{ fontWeight: '600' }}>Regjistrohuni</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
