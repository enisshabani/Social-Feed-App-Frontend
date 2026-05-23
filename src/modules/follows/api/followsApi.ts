import apiClient from '../../../apiClient';
import type { FollowResponse, FollowCountResponse, IsFollowingResponse } from '../types';

const BASE = '/follows';

export const followUser = async (userId: number): Promise<FollowResponse> => {
  const response = await apiClient.post<FollowResponse>(`${BASE}/${userId}`);
  return response.data;
};

export const unfollowUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`${BASE}/${userId}`);
};

export const getFollowers = async (userId: number, skip = 0, limit = 50): Promise<FollowResponse[]> => {
  const response = await apiClient.get<FollowResponse[]>(`${BASE}/followers/${userId}`, { params: { skip, limit } });
  return response.data;
};

export const getFollowing = async (userId: number, skip = 0, limit = 50): Promise<FollowResponse[]> => {
  const response = await apiClient.get<FollowResponse[]>(`${BASE}/following/${userId}`, { params: { skip, limit } });
  return response.data;
};

export const getFollowCounts = async (userId: number): Promise<FollowCountResponse> => {
  const response = await apiClient.get<FollowCountResponse>(`${BASE}/counts/${userId}`);
  return response.data;
};

export const checkIsFollowing = async (userId: number): Promise<IsFollowingResponse> => {
  const response = await apiClient.get<IsFollowingResponse>(`${BASE}/check/${userId}`);
  return response.data;
};

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowCounts,
  checkIsFollowing,
};
