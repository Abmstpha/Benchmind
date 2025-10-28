/**
 * AI Consultant - Intelligent model recommendations using ReAct agent
 */

import React, { useState, useEffect } from 'react';
import { benchmindApi } from '../api/benchmind';
import { BenchmarkCharts } from './BenchmarkCharts';

// Format markdown text
const FormattedRecommendation: React.FC<{ text: string }> = ({ text }) => {
  const formatText = (text: string) => {
    return text
      // *italic* to <em> (process before bold, avoid matching inside bold)
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      // **bold** to <strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // bullet points
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      // wrap consecutive <li> in <ul>
      .replace(/((?:<li>.*?<\/li>\s*){2,})/gs, '<ul>$1</ul>')
      // markdown tables
      .replace(/\|(.+)\|/g, (_, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        if (cells.some((cell: string) => cell.includes('---'))) {
          return ''; // Skip separator rows
        }
        const cellTags = cells.map((cell: string) => `<td>${cell}</td>`).join('');
        return `<tr>${cellTags}</tr>`;
      })
      // wrap table rows
      .replace(/(<tr>.*<\/tr>\s*)+/gs, '<table class="benchmark-table">$&</table>')
      // line breaks
      .replace(/\n/g, '<br>')
      // clean spaces (collapse only spaces and tabs, not newlines)
      .replace(/[ \t]+/g, ' ')
      .trim();
  };

  return (
    <div 
      className="formatted-recommendation"
      dangerouslySetInnerHTML={{ __html: formatText(text) }}
    />
  );
};

interface AIConsultantProps {
  // Add props as needed
}

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
  timestamp: string;
  consultant_version: string;
}

export const AIConsultant: React.FC<AIConsultantProps> = () => {
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
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          🤖 AI Consultant
        </h3>
        <p className="text-gray-600">
          Describe your AI task and get intelligent model recommendations with detailed analysis
        </p>
      </div>

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

      {/* Get Recommendation Button */}
      <button
        onClick={getAIRecommendation}
        disabled={isLoading || !taskDescription.trim() || selectedModels.length === 0}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          isLoading || !taskDescription.trim() || selectedModels.length === 0
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
          '🌱 See greenest models'
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

      {/* Recommendation Display */}
      {recommendation && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            🎯 AI Recommendation
          </h4>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
              <FormattedRecommendation text={formatRecommendation(recommendation)} />
            </div>
          </div>

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
  );
};

export default AIConsultant;
