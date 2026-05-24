import React, { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { followUser, unfollowUser } from '../api/followsApi';

interface FollowContextState {
  following: Set<number>;
  isLoading: Set<number>;
  follow: (userId: number) => Promise<void>;
  unfollow: (userId: number) => Promise<void>;
  setInitialFollowingStatus: (userId: number, isFollowing: boolean) => void;
}

export const FollowContext = createContext<FollowContextState | undefined>(undefined);

export const FollowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [following, setFollowing] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<Set<number>>(new Set());

  const setInitialFollowingStatus = useCallback((userId: number, isFollowing: boolean) => {
    setFollowing(prev => {
      if (prev.has(userId) === isFollowing) return prev;
      const next = new Set(prev);
      if (isFollowing) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  const follow = useCallback(async (userId: number) => {
    // Optimistic UI update
    setFollowing(prev => new Set(prev).add(userId));
    setIsLoading(prev => new Set(prev).add(userId));
    
    try {
      await followUser(userId);
    } catch (error) {
      // Rollback on API error
      setFollowing(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      console.error("Failed to follow user", error);
      throw error;
    } finally {
      setIsLoading(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }, []);

  const unfollow = useCallback(async (userId: number) => {
    // Optimistic UI update
    setFollowing(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    setIsLoading(prev => new Set(prev).add(userId));

    try {
      await unfollowUser(userId);
    } catch (error) {
      // Rollback on API error
      setFollowing(prev => new Set(prev).add(userId));
      console.error("Failed to unfollow user", error);
      throw error;
    } finally {
      setIsLoading(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }, []);

  return (
    <FollowContext.Provider value={{ following, isLoading, follow, unfollow, setInitialFollowingStatus }}>
      {children}
    </FollowContext.Provider>
  );
};
