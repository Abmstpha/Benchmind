/**
 * Benchmind API client - connects frontend to our working backend
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increase to 2 minutes for EcoLogits calls
});

// Types matching our backend
export interface ModelResult {
  model_id: string;
  model_name: string;
  response: string;
  quality_score: number;
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

// API functions
export const benchmindApi = {
  // Start a new benchmark
  async startBenchmark(request: BenchmarkRequest) {
    const response = await api.post('/benchmark', request);
    return response.data;
  },

  // Get benchmark results
  async getBenchmarkResults(benchmarkId: string): Promise<BenchmarkResult> {
    const response = await api.get(`/benchmark/${benchmarkId}`);
    return response.data;
  },

  // Get model recommendation
  async getRecommendation(taskDescription: string, constraints: Record<string, number> = {}) {
    const response = await api.post('/recommend', {
      task_description: taskDescription,
      constraints,
      optimization_goal: 'balanced'
    });
    return response.data;
  },

  // List available models
  async getModels() {
    const response = await api.get('/models');
    return response.data;
  },

  // Health check
  async getHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  // AI Consultant
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

  // Convert API results to chart data format (for existing charts)
  convertToChartData(results: ModelResult[]) {
    return results.map(result => ({
      // Map to existing chart format
      metric: result.model_name,
      p01: result.quality_score,
      p02: result.latency_ms / 1000, // Convert to seconds
      p03: result.cost_usd * 1000000, // Convert to micro-dollars for visibility
      p04: result.energy_wh,
      p05: result.co2_g,
      
      // Additional data
      model_id: result.model_id,
      response: result.response,
      tokens_used: result.tokens_used,
      tokens_per_second: result.tokens_per_second
    }));
  },

  // Convert to CSV-like format for existing components
  convertToCsvFormat(results: ModelResult[]) {
    const headers = ['metric', 'quality', 'latency_s', 'cost_usd', 'energy_wh', 'co2_g'];
    const rows = results.map(result => [
      result.model_name,
      result.quality_score.toString(),
      (result.latency_ms / 1000).toString(),
      result.cost_usd.toString(),
      result.energy_wh.toString(),
      result.co2_g.toString()
    ]);
    
    return [headers, ...rows];
  }
};

export default benchmindApi;
