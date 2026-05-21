import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/globals.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('activity');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.display_name || user?.username || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // 1. Ruajmë emrin
      await api.put('/api/v1/users/me/profile', {
        display_name: editName,
      });

      // 2. Nëse ka zgjedhur foto të re, e bëjmë upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const avatarResponse = await api.post('/api/v1/users/me/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        updateUser(avatarResponse.data);
      } else {
        // Përditëso gjendjen globale të user-it vetëm për emrin
        if (user) {
          updateUser({ ...user, display_name: editName });
        }
      }

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      alert('Gabim gjatë ruajtjes së profilit.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditName(user?.display_name || user?.username || '');
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-main)' }}>
        Duke ngarkuar profilin...
      </div>
    );
  }

  if (!user) return null;

  const joinedYear = new Date(user.created_at).getFullYear();

  // Decide which image to show
  let currentAvatar = null;
  if (isEditing && previewUrl) {
    currentAvatar = previewUrl;
  } else if (user.avatar_url) {
    currentAvatar = user.avatar_url;
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-container">

        {/* Cover Image */}
        <div className="profile-cover">
        </div>

        <div className="profile-info-section">

          <div className="profile-avatar-wrapper">
            <div
              className={`profile-avatar ${isEditing ? 'editable' : ''}`}
              onClick={() => isEditing && fileInputRef.current?.click()}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                /* Default avatar SVG icon */
                <svg width="60" height="60" viewBox="0 0 24 24" fill="var(--text-muted)" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              )}

              {isEditing && (
                <div className="avatar-edit-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '4px' }}>
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                  <span>Add Photo</span>
                </div>
              )}
            </div>
            {!isEditing && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-edit-profile"
                  onClick={() => {
                    setEditName(user.display_name || user.username);
                    setIsEditing(true);
                  }}
                >
                  Edit profile
                </button>
                <button
                  className="btn-edit-profile"
                  onClick={() => navigate('/settings')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', padding: '0' }}
                  title="Settings"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Fshehja e input-it në mënyrë të sigurt për t'u klikuar nga ref */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
            onChange={handleFileChange}
          />

          {isEditing ? (
            <div style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-input)' }}>

              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label>Emri i Profilit (Display Name)</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Emri juaj i shfaqur"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {isSaving ? 'Duke u ruajtur...' : 'Ruaj'}
                </button>
                <button
                  className="btn-primary"
                  onClick={cancelEdit}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--text-muted)' }}
                >
                  Anulo
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-name">{user.display_name || user.username}</div>
              <div className="profile-username">@{user.username}@{user.tenant_id}</div>
            </>
          )}

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Following</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{joinedYear}</span>
              <span className="stat-label">Joined</span>
            </div>
          </div>

          <div className="profile-tabs">
            <div
              className={`profile-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </div>
            <div
              className={`profile-tab ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              Media
            </div>
            <div
              className={`profile-tab ${activeTab === 'featured' ? 'active' : ''}`}
              onClick={() => setActiveTab('featured')}
            >
              Featured
            </div>
          </div>

          <div className="profile-feed">
            {activeTab === 'activity' && (
              <>
                <p style={{ fontWeight: 500 }}>Posts and boosts</p>
                <button
                  className="btn-edit-profile"
                  style={{ marginTop: '1rem', border: 'none', color: 'var(--text-muted)' }}
                >
                  Load more
                </button>
              </>
            )}
            {activeTab === 'media' && <p>No media to display</p>}
            {activeTab === 'featured' && <p>No featured posts</p>}
          </div>

        </div>

        {/* Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-input)', textAlign: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: 'var(--error)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
