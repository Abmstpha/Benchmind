
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://benchmind.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 700000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('benchmind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ModelResult {
  model_id: string;
  model_name: string;
  response: string;
  latency_ms: number;
  cost_usd: number;
  energy_wh: number;
  co2_g: number;
  tokens_used: number;
  tokens_per_second: number;
}

export interface BenchmarkResult {
  benchmark_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  prompt: string;
  results: ModelResult[];
  winner?: string;
  insights: string[];
}

export interface BenchmarkRequest {
  prompt: string;
  models: string[];
  max_tokens: number;
}

export const benchmindApi = {
  async startBenchmark(request: BenchmarkRequest) {
    const response = await api.post('/benchmark', request);
    return response.data;
  },

  async getBenchmarkResults(benchmarkId: string): Promise<BenchmarkResult> {
    const response = await api.get(`/benchmark/${benchmarkId}`);
    return response.data;
  },

  async getRecommendation(taskDescription: string, constraints: Record<string, number> = {}) {
    const response = await api.post('/recommend', {
      task_description: taskDescription,
      constraints,
      optimization_goal: 'balanced'
    });
    return response.data;
  },

  async getModels() {
    const response = await api.get('/models');
    return response.data;
  },

  async getHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  async getAIRecommendation(request: { task_description: string; user_context?: string; selected_models?: string[] }) {
    console.log('🔍 Making API call to /ai-consultant/ with:', request);
    try {
      const response = await api.post('/ai-consultant/', request);
      console.log('✅ API response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API call failed:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },

};

export default benchmindApi;
