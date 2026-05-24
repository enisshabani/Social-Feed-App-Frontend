import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import notificationsApi from '../modules/notifications/api/notificationsApi';
import type { NotificationPreference } from '../modules/notifications/types';
import '../styles/globals.css';

type Tab = 'account-settings' | 'appearance' | 'posting-defaults' | 'notifications' | 'two-factor-auth';

type NotificationRuleAction = 'accept' | 'ignore';
type NotificationPreferenceKey = 'filter_not_following' | 'filter_not_followed_by' | 'filter_new_accounts';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('account-settings');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(true);

  // Password state for "Account settings"
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRecoveryGenModal, setShowRecoveryGenModal] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference | null>(null);
  const [isSavingNotificationSettings, setIsSavingNotificationSettings] = useState(false);

  useEffect(() => {
    notificationsApi.getPreferences()
      .then(setNotificationPreferences)
      .catch((error) => {
        console.error('Failed to load notification preferences', error);
      });
  }, []);

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

  const handleSetup2FA = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.post('/api/v1/auth/2fa/setup');
      setQrCodeUrl(response.data.qr_code_url);
      setTwoFactorSecret(response.data.secret);
      setShowSetupModal(true);
      setTwoFactorCode('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Gabim gjatë inicializimit të 2FA.');
    }
  };

  const handleEnable2FA = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.post('/api/v1/auth/2fa/enable', { code: twoFactorCode });
      setBackupCodes(response.data.backup_codes);
      setShowSetupModal(false);
      setShowBackupModal(true);
      if (user) updateUser({ ...user, two_factor_enabled: true });
      setSuccessMsg('2FA u aktivizua me sukses!');
      setTwoFactorCode('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Kodi i pasaktë.');
    }
  };

  const handleDisable2FA = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/v1/auth/2fa/disable', { code: twoFactorCode });
      setShowDisableModal(false);
      if (user) updateUser({ ...user, two_factor_enabled: false });
      setSuccessMsg('2FA u çaktivizua me sukses!');
      setTwoFactorCode('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Kodi i pasaktë.');
    }
  };

  const handleGenerateRecovery = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.post('/api/v1/auth/2fa/recovery-codes', { code: twoFactorCode });
      setBackupCodes(response.data.backup_codes);
      setShowRecoveryGenModal(false);
      setShowBackupModal(true);
      setSuccessMsg('Kodet e reja u gjeneruan me sukses!');
      setTwoFactorCode('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Kodi i pasaktë.');
    }
  };

  const handleNotificationRuleChange = (key: NotificationPreferenceKey, action: NotificationRuleAction) => {
    setNotificationPreferences((prev) => prev ? {
      ...prev,
      [key]: action === 'ignore',
    } : prev);
  };

  const handleToggleNotificationPreference = (key: 'highlight_unread' | 'display_all_categories') => {
    setNotificationPreferences((prev) => prev ? {
      ...prev,
      [key]: !prev[key],
    } : prev);
  };

  const handleSaveNotificationSettings = async () => {
    if (!notificationPreferences) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsSavingNotificationSettings(true);

    try {
      const updatedPreferences = await notificationsApi.updatePreferences(notificationPreferences);
      setNotificationPreferences(updatedPreferences);
      setSuccessMsg('Cilesimet e njoftimeve u ruajten.');
    } catch (error) {
      console.error('Failed to save notification preferences', error);
      setErrorMsg('Gabim gjate ruajtjes se cilesimeve te njoftimeve.');
    } finally {
      setIsSavingNotificationSettings(false);
    }
  };


  const renderSidebar = () => (
    <div className="settings-sidebar">
      <div className="mastodon-logo" style={{ textAlign: 'left', marginBottom: '3rem', marginLeft: '0.5rem', fontSize: '2.5rem' }}>
        kaPak
      </div>

      <Link to="/profile" className="settings-nav-item back-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        {t('settings_sidebar_back')}
      </Link>

      <div className="settings-nav-group">
        <div
          className="settings-nav-title"
          onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            {t('settings_sidebar_preferences')}
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
              {t('settings_sidebar_appearance')}
            </div>
            <div
              className={`settings-nav-item ${activeTab === 'posting-defaults' ? 'active' : ''}`}
              onClick={() => setActiveTab('posting-defaults')}
            >
              {t('settings_sidebar_posting_defaults')}
            </div>
            <div
              className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Njoftimet
            </div>
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
            {t('settings_sidebar_account')}
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
              {t('settings_sidebar_account_settings')}
            </div>
            <div
              className={`settings-nav-item ${activeTab === 'two-factor-auth' ? 'active' : ''}`}
              onClick={() => setActiveTab('two-factor-auth')}
            >
              {t('settings_sidebar_2fa')}
            </div>
            <div className="settings-nav-item">{t('settings_sidebar_auth_apps')}</div>
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
          {t('settings_sidebar_logout')}
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <>
      <div className="settings-content-header">{t('settings_sidebar_account_settings')}</div>

      <div className="settings-section-title">{t('settings_acc_status_title')}</div>
      <div className="settings-status-text">{t('settings_acc_status_text')}</div>

      <div className="settings-section-title">{t('settings_acc_security_title')}</div>

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
            <label>{t('settings_acc_email')} <span>*</span></label>
            <input type="text" value={user?.email || ''} readOnly />
            <p>{t('settings_acc_email_desc')}</p>
          </div>
          <div className="settings-input-group">
            <label>{t('settings_acc_curr_pass')} <span>*</span></label>
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
            <label>{t('settings_acc_new_pass')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p>{t('settings_acc_new_pass_desc')}</p>
          </div>
          <div className="settings-input-group">
            <label>{t('settings_acc_confirm_pass')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="settings-btn-save" disabled={loading}>
          {loading ? t('settings_btn_saving') : t('settings_btn_save')}
        </button>
      </form>

      <div className="settings-section-title" style={{ marginTop: '3rem', color: 'var(--danger)' }}>{t('settings_acc_del_title')}</div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
        {t('settings_acc_del_desc')}
      </p>
      <button
        className="settings-btn-save"
        onClick={handleDeleteAccount}
        style={{ backgroundColor: 'transparent', padding: 10, border: '1px solid var(--danger)', color: 'var(--error)', width: 'auto', marginTop: 0 }}
      >
        {t('settings_acc_del_btn')}
      </button>
    </>
  );

  const renderAppearance = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="settings-content-header" style={{ marginBottom: 0 }}>{t('settings_sidebar_appearance')}</div>
        <button className="settings-btn-save" style={{ width: 'auto', marginTop: 0 }}>{t('settings_btn_save')}</button>
      </div>

      <div className="settings-form-row">
        <div className="settings-input-group">
          <label>{t('settings_app_language')}</label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as 'en' | 'sq')}
          >
            <option value="en">English</option>
            <option value="sq">Shqip</option>
          </select>
        </div>
        <div className="settings-input-group">
          <label>{t('settings_app_timezone')}</label>
          <select defaultValue="utc">
            <option value="utc">(GMT+00:00) UTC</option>
            <option value="cet">(GMT+01:00) Central European Time</option>
          </select>
        </div>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '1.5rem' }}>
        <label>{t('settings_app_theme')}</label>
        <div className="settings-radio-group">
          <label className="settings-radio-label">
            <input
              type="radio"
              name="color-scheme"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
            /> {t('settings_app_theme_dark')}
          </label>
          <label className="settings-radio-label">
            <input
              type="radio"
              name="color-scheme"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
            /> {t('settings_app_theme_light')}
          </label>
        </div>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '1.5rem' }}>
        <label>{t('settings_app_contrast')}</label>
        <div className="settings-radio-group">
          <label className="settings-radio-label">
            <input type="radio" name="contrast" defaultChecked /> {t('settings_app_contrast_auto')}
          </label>
          <label className="settings-radio-label">
            <input type="radio" name="contrast" /> {t('settings_app_contrast_high')}
          </label>
        </div>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '2rem' }}>
        <label>{t('settings_app_emoji')}</label>
        <select defaultValue="auto">
          <option value="auto">Auto</option>
          <option value="apple">Apple</option>
          <option value="twitter">Twemoji</option>
        </select>
        <p>{t('settings_app_emoji_desc')}</p>
      </div>

      <div className="settings-section-title" style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#9baec8' }}>{t('settings_app_anim_title')}</div>

      <div className="settings-checkbox-list">
        <div className="settings-checkbox-item">
          <input type="checkbox" id="slow-mode" />
          <div className="settings-checkbox-text">
            <label htmlFor="slow-mode" className="settings-checkbox-title">{t('settings_app_anim_slow')}</label>
            <span className="settings-checkbox-desc">{t('settings_app_anim_slow_desc')}</span>
          </div>
        </div>
        <div className="settings-checkbox-item">
          <input type="checkbox" id="autoplay" defaultChecked />
          <div className="settings-checkbox-text">
            <label htmlFor="autoplay" className="settings-checkbox-title">
              {t('settings_app_anim_autoplay')} <span className="badge-recommended">{t('settings_app_recommended')}</span>
            </label>
          </div>
        </div>
        <div className="settings-checkbox-item">
          <input type="checkbox" id="reduce-motion" />
          <div className="settings-checkbox-text">
            <label htmlFor="reduce-motion" className="settings-checkbox-title">{t('settings_app_anim_reduce')}</label>
          </div>
        </div>
      </div>
    </>
  );

  const renderPostingDefaults = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="settings-content-header" style={{ marginBottom: 0 }}>{t('settings_sidebar_posting_defaults')}</div>
        <button className="settings-btn-save" style={{ width: 'auto', marginTop: 0 }}>{t('settings_btn_save')}</button>
      </div>

      <div style={{ padding: '1rem', border: '1px solid #282c37', borderRadius: '4px', marginBottom: '2rem', textAlign: 'center', color: '#9baec8', fontSize: '0.9rem' }}>
        {t('settings_post_desc')}
      </div>

      <div className="settings-input-group" style={{ marginBottom: '1.5rem' }}>
        <label>{t('settings_post_vis')}</label>
        <select defaultValue="public">
          <option value="public">{t('settings_post_vis_pub')}</option>
          <option value="unlisted">{t('settings_post_vis_unl')}</option>
          <option value="private">{t('settings_post_vis_priv')}</option>
        </select>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '1.5rem' }}>
        <label>{t('settings_post_quote')}</label>
        <select defaultValue="anyone">
          <option value="anyone">{t('settings_post_quote_any')}</option>
          <option value="followers">{t('settings_post_quote_foll')}</option>
          <option value="nobody">{t('settings_post_quote_none')}</option>
        </select>
      </div>

      <div className="settings-input-group" style={{ marginBottom: '2rem' }}>
        <label>{t('settings_post_lang')}</label>
        <select defaultValue="same">
          <option value="same">{t('settings_post_lang_same')}</option>
        </select>
      </div>

      <div className="settings-checkbox-item">
        <input type="checkbox" id="sensitive-media" />
        <div className="settings-checkbox-text">
          <label htmlFor="sensitive-media" className="settings-checkbox-title">{t('settings_post_sens')}</label>
          <span className="settings-checkbox-desc">{t('settings_post_sens_desc')}</span>
        </div>
      </div>
    </>
  );

  const renderNotificationSettings = () => {
    const notificationRules: Array<{ key: NotificationPreferenceKey; title: string; description: string }> = [
      {
        key: 'filter_not_following',
        title: 'Njerezit qe nuk i ndjek',
        description: 'Derisa t\'i pranosh vete.',
      },
      {
        key: 'filter_not_followed_by',
        title: 'Njerezit qe nuk te ndjekin',
        description: 'Perfshin llogarite qe nuk jane ndjekesit e tu.',
      },
      {
        key: 'filter_new_accounts',
        title: 'Llogarite e reja',
        description: 'Te krijuara se fundmi.',
      },
    ];

    return (
      <>
        <div className="notification-settings-header">
          <div className="settings-content-header" style={{ marginBottom: 0, fontSize: '2rem' }}>
            Cilesimet e njoftimeve
          </div>
          <button
            className="settings-btn-save"
            style={{ width: 'auto', marginTop: 0, padding: '0.85rem 1.5rem' }}
            onClick={handleSaveNotificationSettings}
            disabled={isSavingNotificationSettings || !notificationPreferences}
          >
            {isSavingNotificationSettings ? t('settings_btn_saving') : t('settings_btn_save')}
          </button>
        </div>

        {successMsg && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderRadius: '4px', marginBottom: '1.5rem', border: '1px solid #4CAF50' }}>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#F44336', borderRadius: '4px', marginBottom: '1.5rem', border: '1px solid #F44336' }}>
            {errorMsg}
          </div>
        )}

        <div className="notification-settings-panel">
          {!notificationPreferences ? (
            <div className="notification-settings-loading">Duke ngarkuar cilesimet...</div>
          ) : (
            <>
              <div className="notification-settings-section">
                <div className="notification-settings-title">Menaxho njoftimet nga...</div>

                {notificationRules.map((rule) => (
                  <div className="notification-rule-row" key={rule.key}>
                    <div className="notification-rule-copy">
                      <span>{rule.title}</span>
                      <small>{rule.description}</small>
                    </div>
                    <select
                      className="notification-rule-select"
                      value={notificationPreferences[rule.key] ? 'ignore' : 'accept'}
                      onChange={(e) => handleNotificationRuleChange(rule.key, e.target.value as NotificationRuleAction)}
                    >
                      <option value="accept">Accept</option>
                      <option value="ignore">Ignore</option>
                    </select>
                  </div>
                ))}

                <div className="notification-rule-row muted">
                  <div className="notification-rule-copy">
                    <span>Permendjet private te padeshiruara</span>
                    <small>Do lidhet kur te kete njoftime private ne backend.</small>
                  </div>
                  <select className="notification-rule-select" value="accept" disabled>
                    <option value="accept">Accept</option>
                    <option value="ignore">Ignore</option>
                  </select>
                </div>

                <div className="notification-rule-row muted">
                  <div className="notification-rule-copy">
                    <span>Llogarite e moderuara</span>
                    <small>Do lidhet kur backend te ruaje status moderimi per user-at.</small>
                  </div>
                  <select className="notification-rule-select" value="accept" disabled>
                    <option value="accept">Accept</option>
                    <option value="ignore">Ignore</option>
                  </select>
                </div>
              </div>

              <div className="notification-settings-section notification-settings-section-separated">
                <div className="notification-settings-title">Njoftimet e palexuara</div>
                <label className="notification-toggle-row">
                  <div className="notification-rule-copy">
                    <span>Thekso njoftimet e palexuara</span>
                    <small>Trego nje pike per te dalluar njoftimet e palexuara.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPreferences.highlight_unread}
                    onChange={() => handleToggleNotificationPreference('highlight_unread')}
                  />
                </label>
              </div>

              <div className="notification-settings-section notification-settings-section-separated">
                <div className="notification-settings-title">Shiriti i shpejte i filtrave</div>
                <label className="notification-toggle-row">
                  <div className="notification-rule-copy">
                    <span>Shfaq te gjitha kategorite</span>
                    <small>Shfaq tab-at e kategorive ne faqen e njoftimeve.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPreferences.display_all_categories}
                    onChange={() => handleToggleNotificationPreference('display_all_categories')}
                  />
                </label>
              </div>
            </>
          )}
        </div>

        <style>{`
          .notification-settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 4rem;
          }

          .notification-settings-panel {
            border-top: 1px solid var(--border-input);
            padding-top: 2rem;
          }

          .notification-settings-loading {
            color: var(--text-muted);
            font-weight: 700;
          }

          .notification-settings-section {
            display: flex;
            flex-direction: column;
            gap: 1.1rem;
          }

          .notification-settings-section-separated {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border-input);
          }

          .notification-settings-title {
            color: var(--text-muted);
            font-size: 0.95rem;
            font-weight: 800;
            letter-spacing: 0.02em;
            text-transform: uppercase;
          }

          .notification-rule-row,
          .notification-toggle-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 1.5rem;
            min-height: 58px;
          }

          .notification-rule-row.muted {
            opacity: 0.55;
          }

          .notification-toggle-row {
            cursor: pointer;
          }

          .notification-rule-copy {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            min-width: 0;
          }

          .notification-rule-copy span {
            color: var(--text-main);
            font-size: 1rem;
            font-weight: 800;
          }

          .notification-rule-copy small {
            color: var(--text-muted);
            font-size: 0.92rem;
            line-height: 1.35;
          }

          .notification-rule-select {
            min-width: 156px;
            height: 52px;
            padding: 0 44px 0 24px;
            border: 1px solid transparent;
            border-radius: 8px;
            background: var(--primary);
            color: #fff;
            font-family: var(--font-family);
            font-size: 1rem;
            font-weight: 800;
            cursor: pointer;
          }

          .notification-rule-select:hover:not(:disabled),
          .notification-rule-select:focus {
            border-color: rgba(255, 255, 255, 0.28);
            outline: none;
          }

          .notification-rule-select:disabled {
            background: transparent;
            border-color: var(--border-input);
            color: var(--text-muted);
            cursor: not-allowed;
          }

          .notification-toggle-row input {
            width: 18px;
            height: 18px;
            accent-color: var(--primary);
          }

          @media (max-width: 768px) {
            .notification-settings-header {
              align-items: flex-start;
              flex-direction: column;
              margin-bottom: 2rem;
            }

            .notification-rule-row,
            .notification-toggle-row {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }

            .notification-rule-select {
              width: 100%;
            }
          }
        `}</style>
      </>
    );
  };

  const renderTwoFactorAuth = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="settings-content-header" style={{ marginBottom: 0 }}>{t('settings_sidebar_2fa')}</div>
        {user?.two_factor_enabled ? (
          <button className="settings-btn-save" style={{ width: 'auto', marginTop: 0, backgroundColor: '#d32f2f' }} onClick={() => setShowDisableModal(true)}>{t('settings_2fa_disable')}</button>
        ) : (
          <button className="settings-btn-save" style={{ width: 'auto', marginTop: 0 }} onClick={handleSetup2FA}>{t('settings_2fa_enable')}</button>
        )}
      </div>

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

      {user?.two_factor_enabled ? (
        <>
          <div className="settings-status-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4caf50' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {t('settings_2fa_status_enabled')}
          </div>

          <div className="settings-section-title" style={{ marginTop: '2rem', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>{t('settings_2fa_methods')}</div>

          <div className="settings-2fa-box">
            <div>{t('settings_2fa_auth_app')}</div>
            <div className="settings-2fa-action">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              {t('settings_2fa_enabled_badge')}
            </div>
          </div>

          <div className="settings-section-title" style={{ marginTop: '3rem', fontSize: '1rem' }}>{t('settings_2fa_backup_title')}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            {t('settings_2fa_backup_desc')}
          </p>

          <button className="settings-btn-save" style={{ marginTop: 0 }} onClick={() => setShowRecoveryGenModal(true)}>{t('settings_2fa_backup_gen')}</button>
        </>
      ) : (
        <div className="settings-status-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          {t('settings_2fa_status_disabled')}
        </div>
      )}

      {/* MODALS */}
      
      {/* 1. Setup Modal */}
      {showSetupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="mastodon-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', marginBottom: '1rem' }}>{t('settings_2fa_modal_setup_title')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {t('settings_2fa_modal_setup_desc')}
            </p>
            <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '4px' }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ width: '200px', height: '200px' }} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', wordBreak: 'break-all' }}>
              {t('settings_2fa_modal_setup_manual')} <strong>{twoFactorSecret}</strong>
            </p>
            <div className="settings-input-group">
              <label>{t('settings_2fa_modal_enter_code')}</label>
              <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="123456" />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="settings-btn-save" style={{ flex: 1, backgroundColor: 'var(--border-color)', color: 'var(--text-main)' }} onClick={() => setShowSetupModal(false)}>{t('settings_2fa_modal_cancel')}</button>
              <button className="settings-btn-save" style={{ flex: 1 }} onClick={handleEnable2FA}>{t('settings_2fa_modal_verify')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Backup Codes Modal */}
      {showBackupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="mastodon-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', marginBottom: '1rem' }}>{t('settings_2fa_modal_recov_title')}</h3>
            <p style={{ color: '#d32f2f', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>
              {t('settings_2fa_modal_recov_desc')}
            </p>
            <div style={{ backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontFamily: 'monospace' }}>
              {backupCodes.map((code, idx) => (
                <div key={idx} style={{ color: 'var(--text-main)', textAlign: 'center' }}>{code}</div>
              ))}
            </div>
            <button className="settings-btn-save" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setShowBackupModal(false)}>{t('settings_2fa_modal_recov_btn')}</button>
          </div>
        </div>
      )}

      {/* 3. Disable Modal */}
      {showDisableModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="mastodon-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', marginBottom: '1rem' }}>{t('settings_2fa_modal_dis_title')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {t('settings_2fa_modal_dis_desc')}
            </p>
            <div className="settings-input-group">
              <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="Code" />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="settings-btn-save" style={{ flex: 1, backgroundColor: 'var(--border-color)', color: 'var(--text-main)' }} onClick={() => setShowDisableModal(false)}>{t('settings_2fa_modal_cancel')}</button>
              <button className="settings-btn-save" style={{ flex: 1, backgroundColor: '#d32f2f' }} onClick={handleDisable2FA}>{t('settings_2fa_modal_dis_btn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Regenerate Recovery Codes Modal */}
      {showRecoveryGenModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="mastodon-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', marginBottom: '1rem' }}>{t('settings_2fa_modal_regen_title')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {t('settings_2fa_modal_regen_desc')}
            </p>
            <div className="settings-input-group">
              <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="Code" />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="settings-btn-save" style={{ flex: 1, backgroundColor: 'var(--border-color)', color: 'var(--text-main)' }} onClick={() => setShowRecoveryGenModal(false)}>{t('settings_2fa_modal_cancel')}</button>
              <button className="settings-btn-save" style={{ flex: 1 }} onClick={handleGenerateRecovery}>{t('settings_2fa_modal_regen_btn')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="settings-layout">
      {renderSidebar()}

      <div className="settings-content-wrapper">
        {activeTab === 'account-settings' && renderAccountSettings()}
        {activeTab === 'appearance' && renderAppearance()}
        {activeTab === 'posting-defaults' && renderPostingDefaults()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'two-factor-auth' && renderTwoFactorAuth()}
      </div>
    </div>
  );
};

export default Settings;
