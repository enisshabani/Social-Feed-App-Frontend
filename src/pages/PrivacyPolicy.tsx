import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/globals.css';
import { useLanguage } from '../context/LanguageContext';

const PrivacyPolicy: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="auth-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'block', height: 'auto', minHeight: '100vh', justifyContent: 'unset', alignItems: 'unset' }}>
      <div className="auth-card" style={{ width: '100%', maxWidth: '100%' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>{t('privacy_title')}</h1>
        
        <div style={{ color: 'var(--text-color)', lineHeight: '1.6', fontSize: '1rem' }}>
          <h2>{t('privacy_section_general')}</h2>
          <p>
            {t('privacy_general_text')}
          </p>

          <br/>
          <h2>{t('privacy_section_collect')}</h2>
          <p><strong>{t('privacy_basic_title')}:</strong> {t('privacy_basic_text')}</p>
          <p><strong>{t('privacy_content_title')}:</strong> {t('privacy_content_text')}</p>

          <br/>
          <h2>{t('privacy_section_use')}</h2>
          <p>{t('privacy_use_text')}</p>

          <br/>
          <h2>{t('privacy_section_share')}</h2>
          <p>{t('privacy_share_text')}</p>

          <br/>
          <h2>{t('privacy_section_rights')}</h2>
          <p>{t('privacy_rights_text')}</p>

        </div>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/register" className="btn-secondary" style={{ display: 'inline-block', padding: '0.5rem 1rem', textDecoration: 'none' }}>
            {t('privacy_back_register')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
