import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFollowers, getFollowing } from '../modules/follows/api/followsApi';
import { FollowButton } from '../modules/follows/components/FollowButton';
import type { FollowResponse } from '../modules/follows/types';
import { ArrowLeft, User } from 'lucide-react';

type Mode = 'followers' | 'following';

const Followers: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Detect mode from path: /followers/:id → 'followers', /following/:id → 'following'
  const pathMode: Mode = location.pathname.startsWith('/following') ? 'following' : 'followers';
  const [activeTab, setActiveTab] = useState<Mode>(pathMode);
  const [list, setList] = useState<FollowResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const numericUserId = Number(userId);

  useEffect(() => {
    if (!numericUserId) return;
    setIsLoading(true);
    const fetch = activeTab === 'followers'
      ? getFollowers(numericUserId)
      : getFollowing(numericUserId);

    fetch
      .then(data => setList(data))
      .catch(() => setList([]))
      .finally(() => setIsLoading(false));
  }, [numericUserId, activeTab]);

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main, #060913)',
      color: 'var(--text-main, #fff)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        borderBottom: '1px solid var(--border, #1e2336)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-main, #060913)',
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
          {activeTab === 'followers' ? 'Followers' : 'Following'}
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #1e2336)' }}>
        {(['followers', 'following'] as Mode[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '16px',
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #8899a6)',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid var(--primary, #3b82f6)' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {tab === 'followers' ? 'Followers' : 'Following'}
          </button>
        ))}
      </div>

      {/* List */}
      <div>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px', borderBottom: '1px solid var(--border, #1e2336)'
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#1e2336' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: '40%', backgroundColor: '#1e2336', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, width: '60%', backgroundColor: '#1e2336', borderRadius: 4 }} />
              </div>
            </div>
          ))
        ) : list.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted, #8899a6)' }}>
            <User size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
            <p style={{ fontSize: '16px', fontWeight: 600 }}>
              {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </p>
            <p style={{ fontSize: '14px', marginTop: 8, opacity: 0.7 }}>
              {activeTab === 'followers'
                ? 'When someone follows this user, they\'ll appear here.'
                : 'When this user follows someone, they\'ll appear here.'}
            </p>
          </div>
        ) : (
          list.map(item => {
            const targetId = activeTab === 'followers' ? item.follower_id : item.followee_id;
            return (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: '1px solid var(--border, #1e2336)',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    backgroundColor: 'var(--primary-light, #1e3a5f)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary, #3b82f6)',
                  }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>
                      {activeTab === 'followers'
                        ? (item.follower?.display_name || item.follower?.username || `User ${targetId}`)
                        : (item.followee?.display_name || item.followee?.username || `User ${targetId}`)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #8899a6)' }}>
                      @{activeTab === 'followers'
                        ? (item.follower?.username || `user${targetId}`)
                        : (item.followee?.username || `user${targetId}`)}
                    </div>
                  </div>
                </div>
                <FollowButton userId={targetId} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Followers;
