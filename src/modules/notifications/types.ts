export type NotificationType = 'FOLLOW' | 'LIKE' | 'REPOST' | 'MENTION' | 'COMMENT';

export interface UserBrief {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: number;
  actor_id: number;
  type: NotificationType;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
  actor?: UserBrief;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
  total: number;
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationPreference {
  filter_not_following: boolean;
  filter_not_followed_by: boolean;
  filter_new_accounts: boolean;
  highlight_unread: boolean;
  display_all_categories: boolean;
}

