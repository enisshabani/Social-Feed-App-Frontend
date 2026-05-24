import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { getFollowCounts } from '../modules/follows/api/followsApi';
import { PostService } from '../services/post.service';
import PostItem from '../components/PostItem';
import { AlertCircle } from 'lucide-react';
import { FollowButton } from '../modules/follows/components/FollowButton';
import '../styles/globals.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, updateUser } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('activity');
  const [currentFeedTab, setCurrentFeedTab] = useState<'home' | 'explore' | 'bookmarks'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [followCounts, setFollowCounts] = useState({ followers_count: 0, following_count: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState('');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.display_name || user?.username || '');
  const [showNameInput, setShowNameInput] = useState(!!user?.display_name);
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [showBioInput, setShowBioInput] = useState(!!user?.bio);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { username: routeUsername } = useParams<{ username?: string }>();
  const [viewUser, setViewUser] = useState<any | null>(null);

  // Load either the logged-in user profile or the route username profile
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileError('');
      setPostsError('');
      try {
        if (routeUsername && routeUsername !== user?.username) {
          setViewUser(null);
          setPosts([]);
          const resp = await api.get(`/api/v1/users/${encodeURIComponent(routeUsername)}`);
          if (!mounted) return;
          setViewUser(resp.data);
          const counts = await getFollowCounts(resp.data.id);
          if (!mounted) return;
          setFollowCounts(counts);
          if (activeTab === 'activity') fetchUserPosts(resp.data.id);
        } else if (user?.id) {
          setViewUser(null);
          const counts = await getFollowCounts(user.id);
          if (!mounted) return;
          setFollowCounts(counts);
          if (activeTab === 'activity') fetchUserPosts(user.id);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        if (!mounted) return;
        setProfileError('Gabim gjatë ngarkimit të profilit.');
        setPosts([]);
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => { mounted = false; };
  }, [routeUsername, user?.id, user?.username, activeTab]);

  const fetchUserPosts = async (userId: number) => {
    setLoadingPosts(true);
    setPostsError('');
    try {
      const response = await PostService.getUserTimeline(userId, 0, 40);
      setPosts(response.items || []);
    } catch (err: any) {
      console.error(err);
      setPostsError('Gabim gjatë ngarkimit të postimeve.');
    } finally {
      setLoadingPosts(false);
    }
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
      // 1. Ruajmë emrin dhe bion
      await api.put('/api/v1/users/me/profile', {
        display_name: editName,
        bio: editBio,
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
        // Përditëso gjendjen globale të user-it vetëm për emrin dhe bion
        if (user) {
          updateUser({ ...user, display_name: editName, bio: editBio });
        }
      }

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      alert(t('profile_error_save'));
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditName(user?.display_name || user?.username || '');
    setEditBio(user?.bio || '');
    setShowBioInput(!!user?.bio);
  };

  if (isLoading) {
    return (
      <MainLayout
        currentTab={currentFeedTab}
        setCurrentTab={setCurrentFeedTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-main)' }}>
          {t('profile_loading')}
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  if (loadingProfile && routeUsername && routeUsername !== user.username) {
    return (
      <MainLayout
        currentTab={currentFeedTab}
        setCurrentTab={setCurrentFeedTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-main)' }}>
          {t('profile_loading')}
        </div>
      </MainLayout>
    );
  }

  if (profileError && routeUsername && routeUsername !== user.username) {
    return (
      <MainLayout
        currentTab={currentFeedTab}
        setCurrentTab={setCurrentFeedTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        <div className="error-container" style={{ margin: '5rem auto' }}>
          <AlertCircle size={18} style={{ marginRight: '8px' }} />
          <span>{profileError}</span>
        </div>
      </MainLayout>
    );
  }

  const profileUser = viewUser || user;
  const isOwnProfile = profileUser.id === user.id;

  const joinedYear = new Date(profileUser.created_at).getFullYear();

  // Decide which image to show
  let currentAvatar = null;
  if (isEditing && previewUrl) {
    currentAvatar = previewUrl;
  } else if (profileUser.avatar_url) {
    currentAvatar = profileUser.avatar_url;
  }

  return (
    <MainLayout
      currentTab={currentFeedTab}
      setCurrentTab={setCurrentFeedTab}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
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

              {isEditing && isOwnProfile && (
                <div className="avatar-edit-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '4px' }}>
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                  <span>{t('profile_add_photo')}</span>
                </div>
              )}
            </div>
            {!isEditing && isOwnProfile && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-edit-profile"
                  onClick={() => {
                    setEditName(user.display_name || user.username);
                    setEditBio(user.bio || '');
                    setShowBioInput(!!user.bio);
                    setIsEditing(true);
                  }}
                >
                  {t('profile_edit_btn')}
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
            {!isEditing && !isOwnProfile && (
              <div style={{ marginTop: '5rem' }}>
                <FollowButton
                  userId={profileUser.id}
                  onFollowChange={(isFollowing) => {
                    setFollowCounts((prev) => ({
                      ...prev,
                      followers_count: Math.max(0, prev.followers_count + (isFollowing ? 1 : -1)),
                    }));
                  }}
                />
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

          <div className="profile-name">{profileUser.display_name || profileUser.username}</div>
          <div className="profile-username">@{profileUser.username}@{profileUser.tenant_id}</div>
          {profileUser.bio && (
            <div className="profile-bio" style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
              {profileUser.bio}
            </div>
          )}

          <div className="profile-stats">
            <div
              className="stat-item"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/followers/${profileUser.id}`)}
            >
              <span className="stat-value">{followCounts.followers_count}</span>
              <span className="stat-label">{t('profile_followers')}</span>
            </div>
            <div
              className="stat-item"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/following/${profileUser.id}`)}
            >
              <span className="stat-value">{followCounts.following_count}</span>
              <span className="stat-label">{t('profile_following')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">{t('profile_posts')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{joinedYear}</span>
              <span className="stat-label">{t('profile_joined')}</span>
            </div>
          </div>

          <div className="profile-tabs">
            <div
              className={`profile-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              {t('profile_tab_activity')}
            </div>
            <div
              className={`profile-tab ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              {t('profile_tab_media')}
            </div>
            <div
              className={`profile-tab ${activeTab === 'featured' ? 'active' : ''}`}
              onClick={() => setActiveTab('featured')}
            >
              {t('profile_tab_featured')}
            </div>
          </div>

          <div className="profile-feed">
            {activeTab === 'activity' && (
              <div style={{ width: '100%' }}>
                {loadingPosts ? (
                  <div style={{ width: '100%', padding: '0 1rem' }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="post-skeleton-card" style={{ width: '100%', borderBottom: '1px solid var(--border)' }}>
                        <div className="skeleton-avatar skeleton"></div>
                        <div className="skeleton-details">
                          <div className="skeleton skeleton-title" style={{ width: '40%' }}></div>
                          <div className="skeleton skeleton-body-line" style={{ width: '90%', marginTop: '12px' }}></div>
                          <div className="skeleton skeleton-body-line" style={{ width: '75%', marginTop: '8px' }}></div>
                          <div className="skeleton skeleton-footer" style={{ width: '60%', marginTop: '16px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : postsError ? (
                  <div className="error-container">
                    <AlertCircle size={18} style={{ marginRight: '8px' }} />
                    <span>{postsError}</span>
                  </div>
                ) : posts.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                     <p style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Asnjë postim ende</p>
                     <p style={{ fontSize: '0.95rem' }}>Kur ky përdorues të postojë diçka, do të shfaqet këtu.</p>
                   </div>
                ) : (
                  <div className="posts-feed-list" style={{ width: '100%' }}>
                    {posts.map(post => (
                      <PostItem 
                        key={post.id} 
                        post={post} 
                        onPostUpdated={() => {
                          if (profileUser) fetchUserPosts(profileUser.id);
                        }} 
                      />
                    ))}
                  </div>
                )}
                {posts.length > 0 && !loadingPosts && (
                  <button
                    className="btn-edit-profile"
                    style={{ margin: '1rem auto', display: 'block', border: 'none', color: 'var(--text-muted)' }}
                  >
                    {t('profile_activity_load_more')}
                  </button>
                )}
              </div>
            )}
            {activeTab === 'media' && <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>{t('profile_media_empty')}</p>}
            {activeTab === 'featured' && <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>{t('profile_featured_empty')}</p>}
          </div>

        </div>
      </div>

      {isEditing && (
        <div className="edit-profile-modal-overlay">
          <div className="edit-profile-modal">
            <div className="edit-profile-header">
              <div className="edit-profile-title">
                <button className="edit-profile-back" onClick={cancelEdit}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                {t('profile_edit_title')}
              </div>
              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '0.5rem 1rem', textTransform: 'none', borderRadius: '4px' }}
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? t('profile_edit_saving') : t('profile_edit_done')}
              </button>
            </div>

            <div className="edit-profile-cover">
              <div className="edit-profile-camera-btn" style={{ top: '1rem', right: '1rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
            </div>

            <div className="edit-profile-avatar-container">
              <div className="edit-profile-avatar">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="var(--text-muted)" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                )}
                <div
                  className="edit-profile-camera-btn"
                  style={{ bottom: '-10px', right: '-10px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>

            <div className="edit-profile-section">
              <div className="edit-profile-section-header">
                <div className="edit-profile-section-title">{t('profile_edit_display_name')}</div>
                {!showNameInput && (
                  <button className="btn-outline" onClick={() => setShowNameInput(true)}>{t('profile_edit_add_display_name')}</button>
                )}
              </div>
              {showNameInput && (
                <input
                  type="text"
                  className="edit-profile-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('profile_edit_display_name')}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              <div className="edit-profile-section-desc">
                {t('profile_edit_name_desc')}
              </div>
            </div>
            <div className="edit-profile-section">
              <div className="edit-profile-section-header">
                <div className="edit-profile-section-title">{t('profile_edit_bio')}</div>
                {!showBioInput && (
                  <button className="btn-outline" onClick={() => setShowBioInput(true)}>{t('profile_edit_add_bio')}</button>
                )}
              </div>
              {showBioInput && (
                <textarea
                  className="edit-profile-input"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={t('profile_edit_bio')}
                  rows={3}
                  style={{ marginBottom: '1rem', resize: 'vertical' }}
                />
              )}
              <div className="edit-profile-section-desc">
                {t('profile_edit_bio_desc')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </MainLayout>
  );
};

export default Profile;
