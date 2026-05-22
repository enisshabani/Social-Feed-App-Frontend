import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/globals.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="auth-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'block', height: 'auto', minHeight: '100vh', justifyContent: 'unset', alignItems: 'unset' }}>
      <div className="auth-card" style={{ width: '100%', maxWidth: '100%' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Privacy policy</h1>
        
        <div style={{ color: 'var(--text-color)', lineHeight: '1.6', fontSize: '1rem' }}>
          <h2>1. General information</h2>
          <p>
            We take the privacy of our users seriously. This document outlines how we handle the data you provide to us when you use our service, following common practices similarly transparent as open-source federated networks like Mastodon.
          </p>

          <br/>
          <h2>2. What information do we collect?</h2>
          <p><strong>Basic account information:</strong> If you register on this server, we may ask you to enter a username, an e-mail address and a password. You may also enter additional profile information such as a display name and biography.</p>
          <p><strong>Posts and other content:</strong> When you use our platform, we store your posts, interactions, and media uploads.</p>

          <br/>
          <h2>3. How do we use the information?</h2>
          <p>The information we collect is used to provide the basic functionality of the platform, such as displaying your profile, posts, and letting others interact with you.</p>

          <br/>
          <h2>4. Who do we share your data with?</h2>
          <p>Your data is not sold to any third-party advertisers. All public posts can be seen by anybody, as is the nature of a public social network.</p>

          <br/>
          <h2>5. Your rights</h2>
          <p>You have the right to request access to your personal data, rectify it, or delete it (right to be forgotten) directly from your account settings.</p>

        </div>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/register" className="btn-secondary" style={{ display: 'inline-block', padding: '0.5rem 1rem', textDecoration: 'none' }}>
            Back to Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
