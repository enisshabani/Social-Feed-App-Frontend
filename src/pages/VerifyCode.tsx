import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/globals.css';

const VerifyCode: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length === 0) {
      setError('Ju lutem shkruani kodin.');
      return;
    }
    navigate(`/reset-password?token=${code.trim()}`);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="mastodon-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>
        <div className="mastodon-logo">kaPak</div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Verifikoni Kodin</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="text" 
              id="code" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Kodi 6-shifror" 
              required 
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            Vazhdo
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/forgot-password" style={{ color: '#6364ff' }}>Kthehu prapa</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
