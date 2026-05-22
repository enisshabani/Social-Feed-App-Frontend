export interface FollowResponse {
  id: string;
  follower_id: number;
  followee_id: number;
  created_at: string;
  tenant_id: string;
}

export interface FollowCountResponse {
  followers_count: number;
  following_count: number;
}

export interface IsFollowingResponse {
  is_following: boolean;
}
