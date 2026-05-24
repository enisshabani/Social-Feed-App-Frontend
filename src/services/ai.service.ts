import api from './api';

export interface AiTaskResponse {
  id: number;
  task_type: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  status: string;
  error_message?: string | null;
  user_id: number;
  tenant_id: string;
  created_at: string;
  completed_at?: string | null;
}

export interface TaskStatusResponse {
  task_id: number;
  task_type: string;
  status: string;
  output_data?: unknown;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  mood_tags: string[];
}

export class AIService {
  static async suggestHashtags(postText: string): Promise<AiTaskResponse> {
    const response = await api.post<AiTaskResponse>('/api/v1/ai/suggest-hashtags', {
      post_text: postText,
    });
    return response.data;
  }

  static async analyzeSentiment(postText: string): Promise<AiTaskResponse> {
    const response = await api.post<AiTaskResponse>('/api/v1/ai/analyze-sentiment', {
      post_text: postText,
    });
    return response.data;
  }

  static async getTaskStatus(taskId: number): Promise<TaskStatusResponse> {
    const response = await api.get<TaskStatusResponse>(`/api/v1/tasks/${taskId}/status`);
    return response.data;
  }
}
