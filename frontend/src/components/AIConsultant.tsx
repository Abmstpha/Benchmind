/**
 * AI Consultant - Intelligent model recommendations using ReAct agent
 */

import React, { useState, useEffect } from 'react';
import { benchmindApi } from '../api/benchmind';

interface AIConsultantProps {
  // Add props as needed
}

interface AIRecommendation {
  task: string;
  user_context?: string;
  ai_recommendation: {
    success: boolean;
    recommendation?: string;
    reasoning_steps?: any[];
    error?: string;
    fallback_recommendation?: string;
  };
  timestamp: string;
  consultant_version: string;
}

export const AIConsultant: React.FC<AIConsultantProps> = () => {
  const [taskDescription, setTaskDescription] = useState('');
  const [userContext, setUserContext] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleTasks = [
    "I need a recommendation system for movies",
    "Build a content generation system for blog posts",
    "Create a customer support chatbot",
    "Develop a code documentation generator",
    "Build a sentiment analysis tool for social media"
  ];

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log('🔄 Fetching models from API...');
        const models = await benchmindApi.getModels();
        console.log('✅ Models received:', models);
        console.log('📊 Available models count:', models.available_models?.length);
        setAvailableModels(models.available_models || []);
      } catch (err: any) {
        console.error('❌ Failed to fetch models:', err);
        console.error('Error details:', err.response?.data || err.message);
        // Fallback to default models
        console.log('🔄 Using fallback models');
        setAvailableModels([
          { id: 'mistral-tiny', name: 'Mistral Tiny', description: 'Fast, efficient' },
          { id: 'mistral-small', name: 'Mistral Small', description: 'Balanced performance' }
        ]);
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
    if (!rec.ai_recommendation.success) {
      return rec.ai_recommendation.fallback_recommendation || rec.ai_recommendation.error;
    }
    return rec.ai_recommendation.recommendation;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
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
          Models to Compare ({selectedModels.length}/3)
        </label>
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center space-x-2">
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a model...</option>
                {availableModels
                  .filter(model => !selectedModels.includes(model.id) || selectedModels[index] === model.id)
                  .map(model => (
                    <option key={model.id} value={model.id}>
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
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            AI is analyzing your task...
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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {formatRecommendation(recommendation)}
            </div>
          </div>

          {/* Task Summary */}
          <div className="mt-4 text-sm text-gray-600">
            <div><strong>Task:</strong> {recommendation.task}</div>
            {recommendation.user_context && (
              <div><strong>Context:</strong> {recommendation.user_context}</div>
            )}
            <div><strong>Generated:</strong> {new Date(recommendation.timestamp).toLocaleString()}</div>
            <div><strong>Status:</strong> 
              <span className={`ml-1 ${recommendation.ai_recommendation.success ? 'text-green-600' : 'text-yellow-600'}`}>
                {recommendation.ai_recommendation.success ? 'AI Analysis Complete' : 'Fallback Recommendation'}
              </span>
            </div>
          </div>

          {/* Reasoning Steps (if available) */}
          {recommendation.ai_recommendation.reasoning_steps && recommendation.ai_recommendation.reasoning_steps.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">🧠 AI Reasoning Process:</h5>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                <pre className="whitespace-pre-wrap text-gray-600">
                  {JSON.stringify(recommendation.ai_recommendation.reasoning_steps, null, 2)}
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
