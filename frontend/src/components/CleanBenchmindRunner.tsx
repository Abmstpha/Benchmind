/**
 * Clean Benchmind Runner - Professional, minimal design
 */

import React, { useState, useEffect } from 'react';
import { benchmindApi, BenchmarkResult, ModelResult } from '../api/benchmind';

interface CleanBenchmindRunnerProps {
  onResults?: (results: ModelResult[], prompt?: string, winner?: string) => void;
}

export const CleanBenchmindRunner: React.FC<CleanBenchmindRunnerProps> = ({ onResults }) => {
  const [prompt, setPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(50);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await benchmindApi.getModels();
        setAvailableModels(models.available_models || []);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        // Fallback to default models
        setAvailableModels([
          { id: 'mistral-tiny', name: 'Mistral Tiny', description: 'Fast, efficient' },
          { id: 'mistral-small', name: 'Mistral Small', description: 'Balanced performance' }
        ]);
      }
    };
    fetchModels();
  }, []);

  const runBenchmark = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (selectedModels.length === 0) {
      setError('Please select at least one model');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      const startResponse = await benchmindApi.startBenchmark({
        prompt: prompt.trim(),
        models: selectedModels,
        max_tokens: maxTokens
      });

      const benchmarkId = startResponse.benchmark_id;

      const pollResults = async () => {
        try {
          const result = await benchmindApi.getBenchmarkResults(benchmarkId);
          
          if (result.status === 'completed') {
            setResults(result);
            setIsRunning(false);
            
            if (onResults && result.results) {
              onResults(result.results, result.prompt, result.winner);
            }
          } else if (result.status === 'failed') {
            setError('Benchmark failed');
            setIsRunning(false);
          } else {
            setTimeout(pollResults, 2000);
          }
        } catch (err) {
          setError('Failed to get results');
          setIsRunning(false);
        }
      };

      setTimeout(pollResults, 2000);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start benchmark');
      setIsRunning(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Enter your prompt to test across models..."
            disabled={isRunning}
          />
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens: {maxTokens}
            </label>
            <input
              type="range"
              min="20"
              max="200"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isRunning}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>20</span>
              <span>200</span>
            </div>
          </div>

          {/* Model Selection with Dropdowns */}
          <div>
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
                    disabled={isRunning}
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
                      disabled={isRunning}
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
        </div>
      </div>

      {/* Run Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
        </div>
        <button
          onClick={runBenchmark}
          disabled={isRunning || !prompt.trim() || selectedModels.length === 0}
          className={`px-6 py-2 text-sm font-medium rounded-md ${
            isRunning || !prompt.trim() || selectedModels.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Benchmark'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
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

      {/* Progress Indicator */}
      {isRunning && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-blue-800">
              Running benchmark across {selectedModels.length} models...
            </span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && results.results.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Benchmark Results</h4>
            {results.winner && (
              <p className="text-sm text-gray-600 mt-1">
                Winner: {results.results.find(r => r.model_id === results.winner)?.model_name}
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CO₂
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Throughput
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.results.map((result, index) => (
                  <tr key={index} className={result.model_id === results.winner ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.model_name}</div>
                      <div className="text-sm text-gray-500">{result.tokens_used} tokens</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.quality_score.toFixed(2)}/5.0
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.latency_ms.toFixed(0)}ms
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${result.cost_usd.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.co2_g.toFixed(4)}g
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.tokens_per_second.toFixed(1)} t/s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleanBenchmindRunner;
