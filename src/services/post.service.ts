import api from './api';

// ==========================================
// TYPES & INTERFACES FOR POSTS & FEED
// ==========================================

export interface UserPublic {
  id: number;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
  tenant_id: string;
  created_at: string;
}

export interface Media {
  id: number;
  post_id: number;
  url: string;
  media_type: string;
  meta?: any;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Comment {
  id: number;
  content: string;
  post_id: number;
  author_id: number;
  author?: UserPublic;
  created_at: string;
  updated_at?: string;
}

export interface Like {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

export interface Repost {
  id: number;
  user_id: number;
  original_post_id: number;
  created_at: string;
}

export interface Post {
  id: number;
  content: string;
  content_html?: string;
  author_id: number;
  author?: UserPublic;
  visibility: string;
  reply_to_post_id?: number;
  is_repost: boolean;
  original_post_id?: number;
  like_count: number;
  reply_count: number;
  repost_count: number;
  tenant_id: string;
  created_at: string;
  updated_at?: string;
  comments: Comment[];
  likes: Like[];
  reposts: Repost[];
  media: Media[];
  tags: Tag[];
}

export interface PostBrief {
  id: number;
  content: string;
  author_id: number;
  author?: UserPublic;
  visibility: string;
  is_repost: boolean;
  original_post_id?: number;
  like_count: number;
  reply_count: number;
  repost_count: number;
  created_at: string;
}

export interface FeedResponse {
  items: PostBrief[];
  next_cursor?: string;
  has_more: boolean;
}

export interface Draft {
  id: number;
  content: string;
  author_id: number;
  created_at: string;
  updated_at?: string;
}

export interface TrendingHashtag {
  id: number;
  name: string;
  mention_count: number;
  created_at: string;
  history: {
    day: string;
    uses: number;
    accounts: number;
  }[];
}

// ==========================================
// POSTS & FEEDS SERVICE CLASS
// ==========================================

export class PostService {
  /**
   * Home Feed with optimized pagination and cursor.
   */
  static async getHomeFeed(skip = 0, limit = 20): Promise<FeedResponse> {
    const response = await api.get<FeedResponse>('/api/v1/feeds/home', {
      params: { skip, limit }
    });
    return response.data;
  }

  /**
   * User timeline for a user's profile view.
   */
  static async getUserTimeline(userId: number, skip = 0, limit = 20): Promise<FeedResponse> {
    const response = await api.get<FeedResponse>(`/api/v1/feeds/timeline/${userId}`, {
      params: { skip, limit }
    });
    return response.data;
  }

  /**
   * Realtime trending / explore hashtags.
   */
  static async getExploreTrending(limit = 10): Promise<TrendingHashtag[]> {
    const response = await api.get<TrendingHashtag[]>('/api/v1/feeds/explore', {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Trending hashtags from the last N days with daily history.
   */
  static async getTrendingHashtags(days = 7, limit = 10): Promise<TrendingHashtag[]> {
    const response = await api.get<TrendingHashtag[]>('/api/v1/hashtags/trending', {
      params: { days, limit }
    });
    return response.data;
  }

  /**
   * Fetch posts containing a specific tag.
   */
  static async getPostsByTag(tagName: string, skip = 0, limit = 20): Promise<FeedResponse> {
    const response = await api.get<FeedResponse>(`/api/v1/feeds/tag/${tagName}`, {
      params: { skip, limit }
    });
    return response.data;
  }

  /**
   * Create a new post. Matches the backend's PostCreate schema.
   */
  static async createPost(content: string, visibility = 'public', replyToPostId?: number): Promise<Post> {
    const payload = {
      content,
      visibility,
      reply_to_post_id: replyToPostId
    };
    const response = await api.post<Post>('/api/v1/posts/', payload);
    return response.data;
  }

  /**
   * Get detail of a single post by ID.
   */
  static async getPost(postId: number): Promise<Post> {
    const response = await api.get<Post>(`/api/v1/posts/${postId}`);
    return response.data;
  }

  /**
   * Edit post content. Matches backend's PostUpdate schema.
   */
  static async updatePost(postId: number, content: string, visibility?: string): Promise<Post> {
    const payload = { content, visibility };
    const response = await api.put<Post>(`/api/v1/posts/${postId}`, payload);
    return response.data;
  }

  /**
   * Delete own post.
   */
  static async deletePost(postId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/v1/posts/${postId}`);
    return response.data;
  }

  /**
   * Comment on a post. Matches CommentCreate schema.
   */
  static async addComment(postId: number, content: string): Promise<Comment> {
    const response = await api.post<Comment>(`/api/v1/posts/${postId}/comments`, { content });
    return response.data;
  }

  /**
   * Delete own comment.
   */
  static async removeComment(commentId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/v1/posts/comments/${commentId}`);
    return response.data;
  }

  /**
   * Like / unlike a post. Returns whether liked or not.
   */
  static async toggleLike(postId: number): Promise<{ liked: boolean; message: string }> {
    const response = await api.post<{ liked: boolean; message: string }>(`/api/v1/posts/${postId}/like`);
    return response.data;
  }

  /**
   * Repost / unrepost a post. Returns whether reposted or not.
   */
  static async toggleRepost(postId: number): Promise<{ reposted: boolean; message: string }> {
    const response = await api.post<{ reposted: boolean; message: string }>(`/api/v1/posts/${postId}/repost`);
    return response.data;
  }

  /**
   * Bookmark / unbookmark a post.
   */
  static async toggleBookmark(postId: number): Promise<{ bookmarked: boolean; message: string }> {
    const response = await api.post<{ bookmarked: boolean; message: string }>(`/api/v1/posts/${postId}/bookmark`);
    return response.data;
  }

  /**
   * List all bookmarked posts.
   */
  static async getBookmarks(skip = 0, limit = 20): Promise<PostBrief[]> {
    const response = await api.get<PostBrief[]>('/api/v1/posts/bookmarks/all', {
      params: { skip, limit }
    });
    return response.data;
  }

  /**
   * Save a draft post content.
   */
  static async saveDraft(content: string): Promise<Draft> {
    const response = await api.post<Draft>('/api/v1/posts/drafts/save', { content });
    return response.data;
  }

  /**
   * Get all draft posts.
   */
  static async listDrafts(): Promise<Draft[]> {
    const response = await api.get<Draft[]>('/api/v1/posts/drafts/all');
    return response.data;
  }

  /**
   * Publish a draft post content, which automatically deletes the draft.
   */
  static async publishDraft(draftId: number): Promise<Post> {
    const response = await api.post<Post>(`/api/v1/posts/drafts/${draftId}/publish`);
    return response.data;
  }

  /**
   * Get paginated posts for a specific hashtag (server-side).
   * Uses the dedicated hashtag posts endpoint with 404 handling.
   */
  static async getHashtagPosts(hashtagName: string, skip = 0, limit = 20): Promise<Post[]> {
    const response = await api.get<Post[]>(`/api/v1/hashtags/${encodeURIComponent(hashtagName)}/posts`, {
      params: { skip, limit },
    });
    return response.data;
  }

  /**
   * Refine post text using the OpenAI AI refinement endpoint.
   * Style can be: 'casual', 'professional', 'witty', 'concise'.
   */
  static async refineAIText(content: string, style = 'casual'): Promise<string> {
    const response = await api.post<{ refined_content: string }>('/api/v1/posts/refine-ai', {
      content,
      style
    });
    return response.data.refined_content;
  }
}
