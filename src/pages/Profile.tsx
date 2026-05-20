import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/globals.css';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  tenant_id: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activity');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/v1/auth/me');
        setUser(response.data);
        setEditName(response.data.display_name || response.data.username);
      } catch (err) {
        // Nëse token skadon ose nuk ka qasje, kthehu në login
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
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
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setUser(avatarResponse.data);
      } else {
        // Përditëso gjendjen lokale të përdoruesit vetëm për emrin nëse s'ka foto
        setUser(prev => prev ? { ...prev, display_name: editName } : null);
      }
      
      setIsEditing(false);
    } catch (err) {
      alert("Gabim gjatë ruajtjes së profilit.");
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

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-main)' }}>Duke ngarkuar profilin...</div>;
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
                alignItems: 'center'
              }}
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                /* Default avatar SVG icon */
                <svg width="60" height="60" viewBox="0 0 24 24" fill="var(--text-muted)" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              )}

              {isEditing && (
                <div className="avatar-edit-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '4px' }}>
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <span>Add Photo</span>
                </div>
              )}
            </div>
            {!isEditing && (
              <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>Edit profile</button>
            )}
          </div>

          {isEditing ? (
            <div style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-input)' }}>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />

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
        
        {/* Për ta bërë të lehtë testimin/lëvizjen mbrapa në login */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-input)', textAlign: 'center' }}>
          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: 'var(--error)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500
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
