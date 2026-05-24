import React, { useEffect, useState } from 'react';
import { useFollow } from '../hooks/useFollow';
import { checkIsFollowing } from '../api/followsApi';

interface FollowButtonProps {
  userId: number;
  initialIsFollowing?: boolean;
  hideForCurrentUser?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId, initialIsFollowing, onFollowChange }) => {
  const { following, isLoading, follow, unfollow, setInitialFollowingStatus } = useFollow();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (initialIsFollowing !== undefined) {
      setInitialFollowingStatus(userId, initialIsFollowing);
    } else if (!following.has(userId)) {
      let mounted = true;
      setIsInitializing(true);
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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    try {
      if (isFollowing) {
        await unfollow(userId);
        onFollowChange?.(false);
      } else {
        await follow(userId);
        onFollowChange?.(true);
      }
    } catch {
      // FollowContext already rolls back optimistic UI and logs the error.
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`mastodon-follow-btn ${isFollowing ? 'following' : ''}`}
    >
      {loading ? '...' : isFollowing ? 'Ndjekur' : 'Ndiq'}
    </button>
  );
};
