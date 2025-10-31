/**
 * AI Consultant - Intelligent model recommendations using ReAct agent
 */

import React, { useState, useEffect } from 'react';
import { benchmindApi } from '../api/benchmind';
import { BenchmarkCharts } from './BenchmarkCharts';
import { useAuth } from '../contexts/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AIConsultantProps {}

interface BenchmarkResult {
  model: string;
  latency_ms: number;
  cost_usd: number;
  energy_wh: number;
  co2_g: number;
  tokens_used: number;
}

interface AIRecommendation {
  success: boolean;
  task: string;
  recommendation?: string;
  reasoning_steps?: any[];
  error?: string;
  fallback_recommendation?: string;
  benchmark_results?: BenchmarkResult[];
  web_insights?: string;  // Quality insights from web search
  timestamp: string;
  consultant_version: string;
}

export const AIConsultant: React.FC<AIConsultantProps> = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [taskDescription, setTaskDescription] = useState('');
  const [userContext, setUserContext] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleTasks = [
    "I need to build a recommendation system for my e-commerce platform",
    "I want to create a content generation system for marketing copy",
    "I'm building a customer support chatbot for my SaaS product",
    "I need to develop an automated code review and documentation system",
    "I want to build a sentiment analysis pipeline for social media monitoring",
    "I'm creating a document summarization tool for legal contracts",
    "I need to build a multilingual translation API for my global app",
    "I want to create an AI-powered search and Q&A system for my knowledge base"
  ];

  // Fetch user credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('http://localhost:8000/user/status', {
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        const data = await response.json();
        setCredits(data.credits || 0);
      } catch (err) {
        console.error('Failed to fetch credits:', err);
      }
    };
    
    if (user?.token) {
      fetchCredits();
    }
  }, [user]);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        console.log('🔄 Frontend fetching models from API...');
        const models = await benchmindApi.getModels();
        console.log('✅ Frontend models received:', models);
        console.log('📊 Frontend available models count:', models.available_models?.length);
        setAvailableModels(models.available_models || []);
        setRenderKey(Date.now()); // Force re-render to break cache
      } catch (err: any) {
        console.error('❌ Frontend failed to fetch models:', err);
        console.error('Frontend error details:', err.response?.data || err.message);
        // Fallback to default models
        console.log('🔄 Frontend using fallback models');
        setAvailableModels([
          { id: 'mistral-tiny', name: 'Mistral Tiny', description: 'Fast, efficient' },
          { id: 'mistral-small', name: 'Mistral Small', description: 'Balanced performance' }
        ]);
      } finally {
        setModelsLoading(false);
      }
    };
    fetchModels();
  }, []);

  const getAIRecommendation = async () => {
    if (!taskDescription.trim()) {
      setError('Please describe your AI task');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const response = await benchmindApi.getAIRecommendation({
        task_description: taskDescription.trim(),
        user_context: userContext.trim() || undefined,
        selected_models: selectedModels
      });

      setRecommendation(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get AI recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRecommendation = (rec: AIRecommendation) => {
    if (!rec.success) {
      const fallback = rec.fallback_recommendation || rec.error;
      return typeof fallback === 'string' ? fallback : JSON.stringify(fallback);
    }
    
    let recommendation = rec.recommendation;
    
    // Handle complex object responses
    if (typeof recommendation === 'object' && recommendation !== null) {
      // Check if it's an array of objects with text content
      if (Array.isArray(recommendation)) {
        return (recommendation as any[]).map((item: any) => {
          if (typeof item === 'object' && item.text) {
            return item.text;
          }
          return typeof item === 'string' ? item : JSON.stringify(item);
        }).join('\n\n');
      }
      
      // Check if it's a single object with text content
      if ((recommendation as any).text) {
        return (recommendation as any).text;
      }
      
      // Fallback to JSON stringify
      return JSON.stringify(recommendation, null, 2);
    }
    
    return typeof recommendation === 'string' ? recommendation : JSON.stringify(recommendation);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Input Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-fit">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          🤖 AI Consultant
        </h3>

      {/* Task Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe your AI task
        </label>
        <textarea
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="e.g., I need a recommendation system for movies..."
          disabled={isLoading}
        />
      </div>

      {/* Example Tasks */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or try an example:
        </label>
        <div className="flex flex-wrap gap-2">
          {exampleTasks.map((example, index) => (
            <button
              key={index}
              onClick={() => setTaskDescription(example)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* User Context */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional context (optional)
        </label>
        <textarea
          value={userContext}
          onChange={(e) => setUserContext(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="e.g., Budget constraints, performance requirements, environmental priorities..."
          disabled={isLoading}
        />
      </div>

      {/* Model Selection with Dropdowns */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Models to Compare ({selectedModels.length}/3) - {modelsLoading ? 'Loading...' : `${availableModels.length} models available`}
        </label>
        <div className="space-y-2" key={renderKey}>
          {[0, 1, 2].map((index) => (
            <div key={`dropdown-container-${index}-${renderKey}`} className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 w-12">#{index + 1}</span>
              <select
                value={selectedModels[index] || ''}
                onChange={(e) => {
                  const newModels = [...selectedModels];
                  if (e.target.value) {
                    newModels[index] = e.target.value;
                  } else {
                    newModels.splice(index, 1);
                  }
                  // Remove duplicates and empty slots
                  const uniqueModels = newModels.filter((model, idx, arr) => 
                    model && arr.indexOf(model) === idx
                  );
                  setSelectedModels(uniqueModels);
                }}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-h-40 overflow-y-auto"
              >
                <option value="">Select a model...</option>
                {availableModels
                  .filter(model => !selectedModels.includes(model.id) || selectedModels[index] === model.id)
                  .map((model, modelIndex) => (
                    <option key={`dropdown-${index}-model-${modelIndex}-${model.id}`} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))
                }
              </select>
              {selectedModels[index] && (
                <button
                  onClick={() => {
                    const newModels = selectedModels.filter((_, idx) => idx !== index);
                    setSelectedModels(newModels);
                  }}
                  disabled={isLoading}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove model"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Credit Warning */}
      {credits === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-red-800">Insufficient Credits</p>
              <p className="text-sm text-red-700">You need at least 1 credit to use the AI Consultant. Please contact support to add credits.</p>
            </div>
          </div>
        </div>
      )}

      {/* Get Recommendation Button */}
      <button
        onClick={getAIRecommendation}
        disabled={isLoading || !taskDescription.trim() || selectedModels.length === 0 || credits === 0}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          isLoading || !taskDescription.trim() || selectedModels.length === 0 || credits === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            AI is benchmarking models & measuring environmental impact... (this may take 1-2 minutes)
          </div>
        ) : (
          `🌱 Get AI Recommendation (${credits} credit${credits !== 1 ? 's' : ''} remaining)`
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Right Column - Results */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Recommendation Display */}
      {recommendation && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              🎯 AI Recommendation
            </h4>
            <button
              onClick={() => {
                const text = recommendation.recommendation || '';
                navigator.clipboard.writeText(text);
                alert('Recommendation copied to clipboard!');
              }}
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1"
            >
              📋 Copy
            </button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 relative">
            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
              <MarkdownRenderer text={formatRecommendation(recommendation)} />
            </div>
          </div>

          {/* Quality Insights from Web Search */}
          {recommendation.web_insights && (
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Quality & Benchmark Insights
                </h5>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(recommendation.web_insights || '');
                    alert('Quality insights copied to clipboard!');
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:shadow-md"
                >
                  📋 Copy
                </button>
              </div>
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <MarkdownRenderer text={recommendation.web_insights} />
              </div>
            </div>
          )}

          {/* Visual Charts */}
          {recommendation.benchmark_results && recommendation.benchmark_results.length > 0 ? (
            <div className="mt-6">
              <h5 className="text-lg font-medium text-gray-900 mb-4">
                📊 Visual Performance Analysis & EcoLogits Insights
              </h5>
              <BenchmarkCharts results={recommendation.benchmark_results} />
            </div>
          ) : (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ No benchmark data available.</strong> The AI recommendation was generated but environmental impact data is missing.
                This might happen if the benchmarking tool didn't execute properly.
              </p>
            </div>
          )}

          {/* Task Summary */}
          <div className="mt-4 text-sm text-gray-600">
            <div><strong>Task:</strong> {recommendation.task}</div>
            <div><strong>Generated:</strong> {new Date(recommendation.timestamp).toLocaleString()}</div>
            <div><strong>Status:</strong> 
              <span className={`ml-1 ${recommendation.success ? 'text-green-700' : 'text-yellow-600'}`}>
                {recommendation.success ? '🌱 AI Analysis Complete' : 'Fallback Recommendation'}
              </span>
            </div>
          </div>

          {/* Reasoning Steps (if available) */}
          {recommendation.reasoning_steps && recommendation.reasoning_steps.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">🧠 AI Reasoning Process:</h5>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                <pre className="whitespace-pre-wrap text-gray-600">
                  {JSON.stringify(recommendation.reasoning_steps, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default AIConsultant;
