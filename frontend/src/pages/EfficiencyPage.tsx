/**
 * Efficiency Page - Shows all user benchmark results
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface BenchmarkRun {
  run_id: string;
  project_name: string;
  task_description: string;
  selected_models: string[];
  recommendation: any;
  created_at: string;
  status: string;
}

export const EfficiencyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [runs, setRuns] = useState<BenchmarkRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [deletingRun, setDeletingRun] = useState<string | null>(null);

  const handleDelete = async (runId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete this benchmark run?\n\n"${projectName}"\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingRun(runId);
    try {
      const token = localStorage.getItem('benchmind_token');
      const response = await fetch(`http://localhost:8000/api/run/history/${runId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete run');
      }

      // Remove from local state
      setRuns(runs.filter(run => run.run_id !== runId));
      console.log('✅ Successfully deleted run:', runId);
    } catch (error) {
      console.error('❌ Failed to delete run:', error);
      alert('Failed to delete run. Please try again.');
    } finally {
      setDeletingRun(null);
    }
  };

  useEffect(() => {
    const fetchAllRuns = async () => {
      try {
        const token = localStorage.getItem('benchmind_token');
        console.log('🔍 Efficiency Page - Token exists:', !!token);
        console.log('🔍 Efficiency Page - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
        
        if (!token) {
          throw new Error('No authentication token found - please log in');
        }
        
        const response = await fetch(`http://localhost:8000/api/run/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('🔍 Efficiency Page - Response Status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('🔍 Efficiency Page - Error Response:', errorText);
          
          if (response.status === 401) {
            throw new Error('Authentication failed - please refresh and try again');
          }
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🔍 Efficiency Page - Success:', result.runs?.length || 0, 'runs found');
        setRuns(result.runs || []);
      } catch (err: any) {
        console.error('🔍 Efficiency Page - Error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRuns();
  }, []);

  // Auto-expand if coming from another page with expand=true
  useEffect(() => {
    const shouldExpand = searchParams.get('expand') === 'true';
    const runId = searchParams.get('run_id');
    
    if (shouldExpand && runId && runs.length > 0) {
      // Find the run with matching ID and expand it
      const targetRun = runs.find(run => run.run_id === runId);
      if (targetRun) {
        setExpandedRun(runId);
        console.log('🎯 Auto-expanding run:', runId);
      }
    }
  }, [runs, searchParams]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full overflow-y-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Efficiency Recommendation</h1>
            <p className="text-gray-600 mt-1">Best model under your constraints</p>
          </div>
          <Link
            to="/home"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
          >
            ← Back
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">⏳ {error}</p>
          <p className="text-yellow-600 text-sm mt-2">
            Results will appear here once the benchmark run is saved to the database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Efficiency Recommendations</h1>
          <p className="text-gray-600 mt-1">All your benchmark results and recommendations</p>
        </div>
        <Link
          to="/home"
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
        >
          ← Back
        </Link>
      </div>

      {/* Results List */}
      {runs.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No benchmarks yet</h3>
          <p className="text-gray-600 mb-4">Run your first benchmark to see efficiency recommendations here.</p>
          <Link
            to="/home"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Start Benchmark
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <div key={run.run_id} className="bg-white rounded-lg border hover:shadow-md transition-shadow">
              {/* Run Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  console.log('🔍 Clicking run:', run.run_id);
                  console.log('🔍 Current expanded:', expandedRun);
                  setExpandedRun(expandedRun === run.run_id ? null : run.run_id);
                  console.log('🔍 New expanded:', expandedRun === run.run_id ? null : run.run_id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {run.project_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{run.selected_models.length} models tested</span>
                      <span>•</span>
                      <span>{new Date(run.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{run.status}</span>
                    </div>
                    {run.recommendation?.winner && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          🏆 Winner: {run.recommendation.winner.model}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card expansion
                        handleDelete(run.run_id, run.project_name);
                      }}
                      disabled={deletingRun === run.run_id}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete this benchmark run"
                    >
                      {deletingRun === run.run_id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                    <div className="text-xs text-gray-500 mr-2">
                      {expandedRun === run.run_id ? 'Click to collapse' : 'Click to expand'}
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        expandedRun === run.run_id ? 'rotate-90' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRun === run.run_id && run.recommendation && (
                <div className="border-t bg-gray-50 p-6">
                  {/* Model Rankings */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-900">Model Rankings</h4>
                    
                    {/* Winner */}
                    <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm font-bold">🏆</span>
                          </div>
                          <div>
                            <div className="font-medium text-lg">{run.recommendation.winner.model}</div>
                            <div className="text-xs text-green-600 font-medium">WINNER</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">#1</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{run.recommendation.winner.reason}</div>
                      {run.recommendation.winner.tradeoffs && (
                        <div className="flex flex-wrap gap-1">
                          {run.recommendation.winner.tradeoffs.map((tradeoff: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              {tradeoff}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Shortlist */}
                    {run.recommendation.shortlist && run.recommendation.shortlist.length > 0 && (
                      <div className="space-y-2">
                        {run.recommendation.shortlist.map((model: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 text-sm font-bold">#{index + 2}</span>
                                </div>
                                <div>
                                  <div className="font-medium">{model.model_name || model.model_id}</div>
                                  <div className="text-xs text-gray-500">
                                    {model.energy_wh}Wh • {model.co2_g}g CO₂ • ${model.cost_usd}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-600">
                                  {model.latency_ms}ms
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Agent Recommendation Text */}
                  {run.recommendation?.recommendation_text && (
                    <div className="bg-white rounded-lg p-6 border mb-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm mr-2">🤖</span>
                        AI Efficiency Analysis
                      </h4>
                      <MarkdownRenderer 
                        text={run.recommendation.recommendation_text} 
                        className="text-gray-700"
                      />
                    </div>
                  )}

                  {/* Implementation Notes */}
                  <div className="bg-white rounded-lg p-4 border mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Implementation Notes</h4>
                    {run.recommendation.implementation_notes ? (
                      <ul className="space-y-1 text-sm text-gray-600">
                        {run.recommendation.implementation_notes.map((note: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No implementation notes available</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Link
                      to={`/analytics?run_id=${run.run_id}&expand=true`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                    >
                      View Analytics
                    </Link>
                    <Link
                      to={`/quality?run_id=${run.run_id}&expand=true`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Quality Insights
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EfficiencyPage;
