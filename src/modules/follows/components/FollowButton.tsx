import React, { useEffect, useState } from 'react';
import { useFollow } from '../hooks/useFollow';
import { checkIsFollowing } from '../api/followsApi';

interface FollowButtonProps {
  userId: number;
  initialIsFollowing?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId, initialIsFollowing }) => {
  const { following, isLoading, follow, unfollow, setInitialFollowingStatus } = useFollow();
  const [isInitializing, setIsInitializing] = useState(initialIsFollowing === undefined);

  useEffect(() => {
    if (initialIsFollowing !== undefined) {
      setInitialFollowingStatus(userId, initialIsFollowing);
      setIsInitializing(false);
    } else {
      // If we don't know the status, fetch it
      let mounted = true;
      checkIsFollowing(userId).then((res) => {
        if (mounted) {
          setInitialFollowingStatus(userId, res.is_following);
          setIsInitializing(false);
        }
      }).catch(err => {
        console.error("Error fetching follow status", err);
        if (mounted) setIsInitializing(false);
      });
      return () => { mounted = false; };
    }
  }, [userId, initialIsFollowing, setInitialFollowingStatus]);

  const isFollowing = following.has(userId);
  const loading = isLoading.has(userId) || isInitializing;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (isFollowing) {
      unfollow(userId);
    } else {
      follow(userId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        border: isFollowing ? '1px solid #ccc' : 'none',
        backgroundColor: isFollowing ? 'transparent' : '#1da1f2',
        color: isFollowing ? '#333' : '#fff',
        fontWeight: 'bold',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};
