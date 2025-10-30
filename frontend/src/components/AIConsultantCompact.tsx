/**
 * AI Consultant - Compact card-based layout that fits in one page
 */

import React, { useState, useEffect } from 'react';
import { benchmindApi } from '../api/benchmind';
import { useAuth } from '../contexts/AuthContext';

export const AIConsultantCompact: React.FC = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch credits
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

  // Fetch models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await benchmindApi.getModels();
        setAvailableModels(models.available_models || []);
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    };
    fetchModels();
  }, []);

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : prev.length < 3 ? [...prev, modelId] : prev
    );
  };

  const getRecommendation = async () => {
    if (!taskDescription.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const response = await benchmindApi.getAIRecommendation({
        task_description: taskDescription.trim(),
        selected_models: selectedModels
      });
      setRecommendation(response);
      
      // Refresh credits
      const statusResponse = await fetch('http://localhost:8000/user/status', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await statusResponse.json();
      setCredits(data.credits || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-h-[calc(100vh-200px)]">
      {/* Input Card - 1/3 width */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">AI Consultant</h3>
        
        {/* Task Input */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Your Task</label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
            rows={3}
            placeholder="e.g., I need a recommendation system..."
            disabled={isLoading}
          />
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select Models (max 3) - {selectedModels.length}/3
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 space-y-1">
            {availableModels.slice(0, 10).map((model) => (
              <label key={model.model_id} className="flex items-center text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.model_id)}
                  onChange={() => handleModelToggle(model.model_id)}
                  disabled={!selectedModels.includes(model.model_id) && selectedModels.length >= 3}
                  className="mr-2"
                />
                <span className="truncate">{model.model_name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Credit Warning */}
        {credits === 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-xs text-red-800 font-semibold">Insufficient Credits</p>
            <p className="text-xs text-red-700">Contact support to add credits.</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={getRecommendation}
          disabled={isLoading || !taskDescription.trim() || selectedModels.length === 0 || credits === 0}
          className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
            isLoading || !taskDescription.trim() || selectedModels.length === 0 || credits === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isLoading ? 'Analyzing...' : `Get Recommendation (${credits} credits)`}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Results Card - 2/3 width */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {!recommendation && !isLoading && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-sm">Your AI recommendations will appear here</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Analyzing models...</p>
            </div>
          </div>
        )}

        {recommendation && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Recommendation</h4>
            
            {/* Recommendation Text */}
            {recommendation.recommendation && (
              <div className="prose prose-sm max-w-none">
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {recommendation.recommendation}
                </div>
              </div>
            )}

            {/* Benchmark Results */}
            {recommendation.benchmark_results && recommendation.benchmark_results.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-2">Benchmark Results</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Model</th>
                        <th className="px-2 py-1 text-right font-medium text-gray-700">Latency</th>
                        <th className="px-2 py-1 text-right font-medium text-gray-700">Cost</th>
                        <th className="px-2 py-1 text-right font-medium text-gray-700">Energy</th>
                        <th className="px-2 py-1 text-right font-medium text-gray-700">CO2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recommendation.benchmark_results.map((result: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-1 text-gray-900">{result.model_name}</td>
                          <td className="px-2 py-1 text-right text-gray-700">{result.latency_ms}ms</td>
                          <td className="px-2 py-1 text-right text-gray-700">${result.cost_usd.toFixed(4)}</td>
                          <td className="px-2 py-1 text-right text-gray-700">{result.energy_wh.toFixed(3)}Wh</td>
                          <td className="px-2 py-1 text-right text-green-600 font-medium">{result.co2_g.toFixed(2)}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Web Insights */}
            {recommendation.web_insights && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h5 className="text-sm font-semibold text-blue-900 mb-1">Web Insights</h5>
                <p className="text-xs text-blue-800">{recommendation.web_insights}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIConsultantCompact;
