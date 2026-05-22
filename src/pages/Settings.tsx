import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import '../styles/globals.css';

type Tab = 'account-settings' | 'appearance' | 'posting-defaults' | 'two-factor-auth';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('account-settings');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(true);

  // Password state for "Account settings"
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDeleteAccount = async () => {
    if (window.confirm('Jeni të sigurt që dëshironi të fshini llogarinë tuaj plotësisht? Ky veprim nuk mund të anulohet!')) {
      try {
        await api.delete('/api/v1/users/me');
        alert('Llogaria juaj u fshi me sukses.');
        logout();
        navigate('/login');
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Gabim gjatë fshirjes së llogarisë.');
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Fjalëkalimet e reja nuk përputhen.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Fjalëkalimi i ri duhet të jetë të paktën 8 karaktere.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/v1/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      setSuccessMsg('Fjalëkalimi u ndryshua me sukses!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || 'Gabim gjatë ndryshimit të fjalëkalimit.');
    } finally {
      setLoading(false);
    }
  };



  const renderSidebar = () => (
    <div className="settings-sidebar">
      <div className="settings-logo">
        <div className="settings-logo-img">
          kP
        </div>
      </div>

      <Link to="/profile" className="settings-nav-item back-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back to kaPak
      </Link>

      <div className="settings-nav-group">
        <div
          className="settings-nav-title"
          onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Preferences
          </div>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isPreferencesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {isPreferencesOpen && (
          <div className="settings-subnav">
            <div
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </div>
            <div
              className={`settings-nav-item ${activeTab === 'posting-defaults' ? 'active' : ''}`}
              onClick={() => setActiveTab('posting-defaults')}
            >
              Posting defaults
            </div>
            <div className="settings-nav-item">Email notifications</div>
            <div className="settings-nav-item">Other</div>
          </div>
        )}
      </div>



      <div className="settings-nav-group">
        <div
          className="settings-nav-title"
          onClick={() => setIsAccountOpen(!isAccountOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Account
          </div>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isAccountOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {isAccountOpen && (
          <div className="settings-subnav">
            <div
              className={`settings-nav-item ${activeTab === 'account-settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('account-settings')}
            >
              Account settings
            </div>
            <div
              className={`settings-nav-item ${activeTab === 'two-factor-auth' ? 'active' : ''}`}
              onClick={() => setActiveTab('two-factor-auth')}
            >
              Two-factor Auth
            </div>
            <div className="settings-nav-item">Authorized apps</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', color: 'var(--error)', paddingTop: '1rem', borderTop: '1px solid var(--border-input)' }}>
        <div
          className="settings-nav-item"
          style={{ color: 'var(--danger)' }}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <>
      <div className="settings-content-header">Account settings</div>

      <div className="settings-section-title">Account status</div>
      <div className="settings-status-text">Your account is fully operational.</div>

      <div className="settings-section-title">Security</div>

      {successMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #4CAF50' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#F44336', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #F44336' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handlePasswordChange}>
        <div className="settings-form-row">
          <div className="settings-input-group">
            <label>E-mail address <span>*</span></label>
            <input type="text" value={user?.email || ''} readOnly />
            <p>You will be sent a confirmation e-mail (mock)</p>
          </div>
          <div className="settings-input-group">
            <label>Current password <span>*</span></label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="settings-form-row">
          <div className="settings-input-group">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p>Use at least 8 characters</p>
          </div>
          <div className="settings-input-group">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="settings-btn-save" disabled={loading}>
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <div className="settings-section-title" style={{ marginTop: '3rem', color: 'var(--danger)' }}>Delete account</div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>
      <button
        className="settings-btn-save"
        onClick={handleDeleteAccount}
        style={{ backgroundColor: 'transparent', padding: 10, border: '1px solid var(--danger)', color: 'var(--error)', width: 'auto', marginTop: 0 }}
      >
        Delete account
      </button>
    </>
  );

  const renderAppearance = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="settings-content-header" style={{ marginBottom: 0 }}>Appearance</div>
        <button className="settings-btn-save" style={{ width: 'auto', marginTop: 0 }}>Save changes</button>
      </div>

      <div className="settings-form-row">
        <div className="settings-input-group">
          <label>Interface language</label>
          <select defaultValue="en">
            <option value="en">English</option>
            <option value="sq">Shqip</option>
          </select>
        </div>
        <div className="settings-input-group">
          <label>Time zone</label>
          <select defaultValue="utc">
            <option value="utc">(GMT+00:00) UTC</option>
            <option value="cet">(GMT+01:00) Central European Time</option>
          </select>
        </div>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '1.5rem' }}>
        <label>Color scheme</label>
        <div className="settings-radio-group">
          <label className="settings-radio-label">
            <input
              type="radio"
              name="color-scheme"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
            /> Dark (Default)
          </label>
          <label className="settings-radio-label">
            <input
              type="radio"
              name="color-scheme"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
            /> Light
          </label>
        </div>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '1.5rem' }}>
        <label>Contrast</label>
        <div className="settings-radio-group">
          <label className="settings-radio-label">
            <input type="radio" name="contrast" defaultChecked /> Auto
          </label>
          <label className="settings-radio-label">
            <input type="radio" name="contrast" /> High
          </label>
        </div>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '2rem' }}>
        <label>Emoji style</label>
        <select defaultValue="auto">
          <option value="auto">Auto</option>
          <option value="apple">Apple</option>
          <option value="twitter">Twemoji</option>
        </select>
        <p>How to display emojis. 'Auto' will try using native emoji, but falls back to Twemoji for legacy browsers.</p>
      </div>

      <div className="settings-section-title" style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#9baec8' }}>Animations and Accessibility</div>

      <div className="settings-checkbox-list">
        <div className="settings-checkbox-item">
          <input type="checkbox" id="slow-mode" />
          <div className="settings-checkbox-text">
            <label htmlFor="slow-mode" className="settings-checkbox-title">Slow mode</label>
            <span className="settings-checkbox-desc">Hide timeline updates behind a click instead of automatically scrolling the feed</span>
          </div>
        </div>
        <div className="settings-checkbox-item">
          <input type="checkbox" id="autoplay" defaultChecked />
          <div className="settings-checkbox-text">
            <label htmlFor="autoplay" className="settings-checkbox-title">
              Auto-play animated GIFs <span className="badge-recommended">Recommended</span>
            </label>
          </div>
        </div>
        <div className="settings-checkbox-item">
          <input type="checkbox" id="reduce-motion" />
          <div className="settings-checkbox-text">
            <label htmlFor="reduce-motion" className="settings-checkbox-title">Reduce motion in animations</label>
          </div>
        </div>
      </div>
    </>
  );

  const renderPostingDefaults = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="settings-content-header" style={{ marginBottom: 0 }}>Posting defaults</div>
        <button className="settings-btn-save" style={{ width: 'auto', marginTop: 0 }}>Save changes</button>
      </div>

      <div style={{ padding: '1rem', border: '1px solid #282c37', borderRadius: '4px', marginBottom: '2rem', textAlign: 'center', color: '#9baec8', fontSize: '0.9rem' }}>
        These settings will be used as defaults when you create new posts, but you can edit them per post within the composer.
      </div>

      <div className="settings-input-group" style={{ marginBottom: '1.5rem' }}>
        <label>Posting visibility</label>
        <select defaultValue="public">
          <option value="public">Public - Anyone on and off kaPak</option>
          <option value="unlisted">Unlisted - Invisible in public timelines</option>
          <option value="private">Followers only</option>
        </select>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '1.5rem' }}>
        <label>Who can quote</label>
        <select defaultValue="anyone">
          <option value="anyone">Anyone</option>
          <option value="followers">Followers only</option>
          <option value="nobody">Nobody</option>
        </select>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '2rem' }}>
        <label>Posting language</label>
        <select defaultValue="same">
          <option value="same">Same as interface language</option>
        </select>
      </div>

      <div className="settings-checkbox-item">
        <input type="checkbox" id="sensitive-media" />
        <div className="settings-checkbox-text">
          <label htmlFor="sensitive-media" className="settings-checkbox-title">Always mark media as sensitive</label>
          <span className="settings-checkbox-desc">Sensitive media is hidden by default and can be revealed with a click</span>
        </div>
      </div>
    </>
  );

  const renderTwoFactorAuth = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="settings-content-header" style={{ marginBottom: 0 }}>Two-factor Auth</div>
        <button className="settings-btn-save" style={{ width: 'auto', marginTop: 0 }}>Disable 2FA</button>
      </div>

      <div className="settings-status-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Two-factor authentication is enabled
      </div>

      <div className="settings-section-title" style={{ marginTop: '2rem', fontSize: '1rem', borderBottom: '1px solid #282c37', paddingBottom: '0.5rem' }}>Two-factor methods</div>

      <div className="settings-2fa-box">
        <div>Authenticator app</div>
        <div className="settings-2fa-action">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Edit
        </div>
      </div>
      <div className="settings-2fa-box">
        <div>Security keys</div>
        <div className="settings-2fa-action">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          Add
        </div>
      </div>

      <div className="settings-section-title" style={{ marginTop: '3rem', fontSize: '1rem' }}>Backup recovery codes</div>
      <p style={{ color: '#9baec8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
        Recovery codes allow you to regain access to your account if you lose your phone. If you've lost your recovery codes, you can regenerate them here. Your old recovery codes will be invalidated.
      </p>

      <button className="settings-btn-save" style={{ marginTop: 0 }}>Generate recovery codes</button>
    </>
  );

  return (
    <div className="settings-layout">
      {renderSidebar()}

      <div className="settings-content-wrapper">
        {activeTab === 'account-settings' && renderAccountSettings()}
        {activeTab === 'appearance' && renderAppearance()}
        {activeTab === 'posting-defaults' && renderPostingDefaults()}
        {activeTab === 'two-factor-auth' && renderTwoFactorAuth()}
      </div>
    </div>
  );
};

export default Settings;
