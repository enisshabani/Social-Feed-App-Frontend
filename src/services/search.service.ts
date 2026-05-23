import api from './api';
import type { Post, UserPublic, TrendingHashtag } from './post.service';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export class SearchService {
  static async searchPosts(
    q: string,
    offset = 0,
    limit = 20
  ): Promise<PaginatedResponse<Post>> {
    const response = await api.get<PaginatedResponse<Post>>('/api/v1/search/posts', {
      params: { q, offset, limit },
    });
    return response.data;
  }

  static async searchUsers(
    q: string,
    offset = 0,
    limit = 20
  ): Promise<PaginatedResponse<UserPublic>> {
    const response = await api.get<PaginatedResponse<UserPublic>>('/api/v1/search/users', {
      params: { q, offset, limit },
    });
    return response.data;
  }

  static async searchHashtags(
    q: string,
    offset = 0,
    limit = 20
  ): Promise<PaginatedResponse<TrendingHashtag>> {
    const response = await api.get<PaginatedResponse<TrendingHashtag>>('/api/v1/search/hashtags', {
      params: { q, offset, limit },
    });
    return response.data;
  }
}
