import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/globals.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      await api.post('/api/v1/auth/forgot-password', { email });
      setMessage('Nëse ky email ekziston në sistem, një link për rishkrimin e fjalëkalimit është dërguar.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ndodhi një gabim gjatë dërgimit të kërkesës. Ju lutem provoni përsëri.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>
        <div className="mastodon-logo">KaPak</div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Rikthe Fjalëkalimin</h2>
        
        <form onSubmit={handleSubmit}>
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
          
          {error && <div className="error-message">{error}</div>}
          {message && <div style={{ color: '#4caf50', padding: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={isLoading}>
            {isLoading ? 'Duke dërguar...' : 'Dërgo Linkun'}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/login" style={{ color: '#6364ff' }}>Kthehu tek Logimi</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

