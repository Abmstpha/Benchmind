
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { ProgressOverlay } from './ProgressOverlay';
import { ResultCards } from './ResultCards';

export const BenchmindLanding: React.FC = () => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['', '', '']);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [maxTokens, setMaxTokens] = useState(256);
  const [temperature, setTemperature] = useState(0.2);
  const [gridFactor, setGridFactor] = useState(300);
  const [pue] = useState(1.2);
  
  const [runState, setRunState] = useState<{
    kind: 'idle' | 'starting' | 'running' | 'done' | 'error';
    runId?: string;
    step?: string;
    progress?: number;
    message?: string;
  }>({ kind: 'idle' });

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('benchmind_token');
        const response = await fetch(`${API_BASE_URL}/models/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        const models = data.available_models || [];
        console.log(`✅ Models loaded: ${models.length}`);
        console.log('📋 Full model data:', JSON.stringify(models.slice(0, 3), null, 2));
        console.log('📋 Model names:', models.map((m: any) => m.name || 'UNNAMED').join(', '));
        setAvailableModels(models);
        
        // Set default models for quick testing
        if (models.length >= 3) {
          const defaultModels = [
            models.find((m: any) => m.id === 'mistral-tiny')?.id || models[0]?.id || '',
            models.find((m: any) => m.id === 'mistral-small')?.id || models[1]?.id || '',
            models.find((m: any) => m.id === 'mistral-tiny-2312')?.id || models[2]?.id || ''
          ];
          setSelectedModels(defaultModels);
          console.log('🎯 Default models set:', defaultModels);
        }
      } catch (err) {
        console.error('❌ Failed to fetch models:', err);
      }
    };
    fetchModels();
  }, []);

  const handleModelChange = (index: number, value: string) => {
    const newModels = [...selectedModels];
    newModels[index] = value;
    setSelectedModels(newModels);
  };

  const startRun = async () => {
    if (!projectName.trim() || !taskDescription.trim()) return;
    
    const models = selectedModels.filter(m => m.trim() !== '');
    if (models.length === 0) return;

    setRunState({ kind: 'starting' });

    try {
      // POST /api/run
      const response = await fetch(`${API_BASE_URL}/api/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          project_name: projectName,
          task_description: taskDescription,
          selected_models: models,
          constraints: {
            target_quality: 'high',
            latency_ms_max: 3000,
            green_budget_g_co2_per_1k_tokens: 1.0
          },
          assumptions: {
            pue: pue,
            grid_intensity_g_per_kwh: gridFactor
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start run');
      }

      const data = await response.json();
      setRunState({ kind: 'running', runId: data.run_id });

      // Connect to SSE for progress updates
      connectSSE(data.run_id);

    } catch (err: any) {
      setRunState({ kind: 'error', message: err.message });
    }
  };

  const connectSSE = (runId: string) => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/run/${runId}/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.status === 'done') {
          setRunState({ kind: 'done', runId });
          eventSource.close();
        } else if (data.status === 'error') {
          setRunState({ kind: 'error', runId, message: 'Run failed' });
          eventSource.close();
        } else if (data.step) {
          setRunState({
            kind: 'running',
            runId,
            step: data.step,
            progress: data.progress || 0
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setRunState({ kind: 'error', runId, message: 'Connection lost' });
    };
  };

  const suggestionText = "I need an AI model for a recommendation system that analyzes user behavior and suggests personalized content";

  return (
    <div className="w-full h-[calc(100vh-120px)] overflow-y-auto p-6">
      {/* Single Input Card */}
      {runState.kind === 'idle' || runState.kind === 'starting' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-h-full overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Benchmind</h1>
            <p className="text-sm text-gray-600">
              Environment-first AI model selection • quality • latency • cost • CO₂
            </p>
          </div>

          {/* Project Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="e.g., Movie Recommendation System"
              disabled={runState.kind === 'starting'}
            />
            
            {/* Quick Test Examples */}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setProjectName("Movie Recommendation System");
                  setTaskDescription("I need an AI model for a personalized movie recommendation system that analyzes user viewing history, ratings, and preferences to suggest relevant films. The system should provide real-time recommendations and handle high user volumes efficiently.");
                }}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                🎬 Movie Rec
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setProjectName("Customer Support Chatbot");
                  setTaskDescription("I need an AI model for an intelligent customer support chatbot that understands user queries, provides accurate responses, and escalates complex issues to human agents. The bot should support multiple languages and maintain conversation context.");
                }}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                💬 Support Bot
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setProjectName("Document Summarization Tool");
                  setTaskDescription("I need an AI model for an automated document summarization system that processes long texts, research papers, and reports to extract key insights and generate concise summaries tailored for different audiences.");
                }}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                📄 Doc Summary
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Code Review Assistant");
                  setTaskDescription("I need an AI model for automated code review that analyzes pull requests, identifies bugs, suggests improvements, and checks for security vulnerabilities. The system should understand multiple programming languages and provide actionable feedback.");
                }}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                💻 Code Review
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Email Classification System");
                  setTaskDescription("I need an AI model for email classification that automatically categorizes incoming emails as spam, urgent, promotional, or personal. The system should learn from user behavior and adapt to changing email patterns while maintaining high accuracy.");
                }}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                📧 Email Filter
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Content Moderation Tool");
                  setTaskDescription("I need an AI model for content moderation that detects harmful, inappropriate, or policy-violating content across text, images, and videos. The system should handle high volumes while minimizing false positives and supporting multiple languages.");
                }}
                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                🛡️ Content Mod
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Medical Diagnosis Assistant");
                  setTaskDescription("I need an AI model for medical diagnosis assistance that analyzes patient symptoms, medical history, and test results to suggest potential diagnoses and recommend further tests. The system must prioritize patient safety and provide confidence scores.");
                }}
                className="px-3 py-1 text-xs bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                🏥 Medical AI
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Financial Fraud Detection");
                  setTaskDescription("I need an AI model for real-time fraud detection that analyzes transaction patterns, user behavior, and risk factors to identify suspicious activities. The system should minimize false positives while catching sophisticated fraud attempts.");
                }}
                className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                💳 Fraud Detection
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Language Translation Service");
                  setTaskDescription("I need an AI model for multilingual translation that handles business documents, technical manuals, and conversational text. The system should preserve context, handle idioms, and maintain professional tone across 20+ languages.");
                }}
                className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                🌍 Translation
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Smart Home Automation");
                  setTaskDescription("I need an AI model for intelligent home automation that learns user preferences, predicts needs, and optimizes energy usage. The system should control lighting, temperature, security, and appliances while ensuring privacy and reliability.");
                }}
                className="px-3 py-1 text-xs bg-cyan-100 text-cyan-700 rounded-full hover:bg-cyan-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                🏠 Smart Home
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Social Media Analytics");
                  setTaskDescription("I need an AI model for social media sentiment analysis that monitors brand mentions, tracks engagement trends, and identifies influencers. The system should analyze text, images, and videos across platforms while providing real-time insights and alerts.");
                }}
                className="px-3 py-1 text-xs bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                📱 Social Analytics
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Supply Chain Optimizer");
                  setTaskDescription("I need an AI model for supply chain optimization that predicts demand, manages inventory levels, and identifies potential disruptions. The system should optimize logistics, reduce costs, and ensure timely deliveries while adapting to market changes.");
                }}
                className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                📦 Supply Chain
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectName("Voice Assistant for Elderly");
                  setTaskDescription("I need an AI model for a voice-activated assistant designed for elderly users that helps with medication reminders, emergency calls, and daily tasks. The system should understand natural speech patterns, handle hearing difficulties, and provide compassionate responses.");
                }}
                className="px-3 py-1 text-xs bg-rose-100 text-rose-700 rounded-full hover:bg-rose-200 transition-colors"
                disabled={runState.kind === 'starting'}
              >
                🎙️ Elder Care
              </button>
            </div>
          </div>

          {/* Task Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your AI task
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
              rows={3}
              placeholder="e.g., I need a recommendation system for movies..."
              disabled={runState.kind === 'starting'}
            />
            <button
              onClick={() => setTaskDescription(suggestionText)}
              className="mt-2 text-sm text-green-600 hover:text-green-700"
              disabled={runState.kind === 'starting'}
            >
              💡 Try example: "{suggestionText}"
            </button>
          </div>

          {/* Model Selectors */}
          <div className="mb-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Models
            </label>
            
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <label className="block text-xs text-gray-500 mb-1">
                  Model {String.fromCharCode(65 + index)} {index === 0 ? '(required)' : '(optional)'}
                </label>
                <select
                  value={selectedModels[index]}
                  onChange={(e) => handleModelChange(index, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white cursor-pointer text-gray-900"
                  disabled={runState.kind === 'starting'}
                >
                  <option value="">Select a model...</option>
                  {availableModels.map((model: any) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Advanced Options */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              disabled={runState.kind === 'starting'}
            >
              <svg
                className={`w-4 h-4 mr-1 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Advanced Options
            </button>
            
            {showAdvanced && (
              <div className="mt-3 p-4 bg-gray-50 rounded-md space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Tokens</label>
                    <input
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      disabled={runState.kind === 'starting'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      disabled={runState.kind === 'starting'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Grid Factor (gCO₂/kWh)</label>
                    <input
                      type="number"
                      value={gridFactor}
                      onChange={(e) => setGridFactor(Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      disabled={runState.kind === 'starting'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">PUE (read-only)</label>
                    <input
                      type="number"
                      value={pue}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100"
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={startRun}
            disabled={
              runState.kind === 'starting' ||
              !projectName.trim() ||
              !taskDescription.trim() ||
              selectedModels[0] === ''
            }
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              runState.kind === 'starting' || !projectName.trim() || !taskDescription.trim() || selectedModels[0] === ''
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {runState.kind === 'starting' ? 'Starting...' : '🌱 See the Greenest Model'}
          </button>
        </div>
      ) : null}

      {/* Progress Overlay */}
      {runState.kind === 'running' && (
        <ProgressOverlay
          currentStep={runState.step || ''}
          progress={runState.progress || 0}
        />
      )}

      {/* Result Cards */}
      {runState.kind === 'done' && runState.runId && (
        <ResultCards runId={runState.runId} />
      )}

      {/* Error State */}
      {runState.kind === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{runState.message || 'Something went wrong'}</p>
          <button
            onClick={() => setRunState({ kind: 'idle' })}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default BenchmindLanding;
