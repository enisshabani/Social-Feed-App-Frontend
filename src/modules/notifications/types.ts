export enum NotificationType {
  FOLLOW = 'FOLLOW',
  LIKE = 'LIKE',
  REPOST = 'REPOST',
  MENTION = 'MENTION',
  COMMENT = 'COMMENT',
}

export interface NotificationItem {
  id: string;
  recipient_id: number;
  actor_id: number;
  type: NotificationType;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
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
