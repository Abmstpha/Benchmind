/**
 * Quality Page - Shows quality insights with cited sources
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BenchmarkRun {
  run_id: string;
  task_description: string;
  selected_models: string[];
  quality_insights: any;
  created_at: string;
  status: string;
}

export const QualityPage: React.FC = () => {
  const [runs, setRuns] = useState<BenchmarkRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [deletingRun, setDeletingRun] = useState<string | null>(null);

  const handleDelete = async (runId: string, taskDescription: string) => {
    if (!confirm(`Are you sure you want to delete this benchmark run?\n\n"${taskDescription}"\n\nThis action cannot be undone.`)) {
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
        console.log('🔍 Quality Page - Fetching all user runs');
        
        const response = await fetch(`http://localhost:8000/api/run/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('🔍 Quality Page - Response Status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('🔍 Quality Page - Error Response:', errorText);
          
          if (response.status === 401) {
            throw new Error('Authentication failed - please refresh and try again');
          }
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🔍 Quality Page - Success:', result.runs?.length || 0, 'runs found');
        setRuns(result.runs || []);
      } catch (err: any) {
        console.error('🔍 Quality Page - Error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRuns();
  }, []);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="w-full h-full overflow-y-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Quality Insights</h1>
          <Link to="/home" className="px-4 py-2 text-sm border rounded-md">← Back</Link>
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
          <h1 className="text-3xl font-bold text-gray-900">Quality Insights</h1>
          <p className="text-gray-600 mt-1">All your quality analysis results</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quality insights yet</h3>
          <p className="text-gray-600 mb-4">Run your first benchmark to see quality analysis here.</p>
          <Link
            to="/home"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
                  console.log('🔍 Quality - Clicking run:', run.run_id);
                  setExpandedRun(expandedRun === run.run_id ? null : run.run_id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {run.task_description.length > 60 
                          ? run.task_description.substring(0, 60) + '...' 
                          : run.task_description}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{run.selected_models.length} models analyzed</span>
                      <span>•</span>
                      <span>{new Date(run.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{run.status}</span>
                    </div>
                    {run.quality_insights?.evidence && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          📊 {run.quality_insights.evidence.length} evidence points
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card expansion
                        handleDelete(run.run_id, run.task_description);
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
              {expandedRun === run.run_id && run.quality_insights && (
                <div className="border-t bg-gray-50 p-6">
                  {/* Quality Evidence Table */}
                  {run.quality_insights.evidence && run.quality_insights.evidence.length > 0 && (
                    <div className="bg-white rounded-lg border p-6 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Quality Evidence</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {run.quality_insights.evidence.map((item: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.model}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{item.metric}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-mono">{item.value}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  <a href={item.url} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                                    {item.source}
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {run.quality_insights.summary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Analysis Summary</h4>
                      <p className="text-sm text-blue-800">{run.quality_insights.summary}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Link
                      to={`/analytics?run_id=${run.run_id}`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                    >
                      View Analytics
                    </Link>
                    <Link
                      to={`/efficiency?run_id=${run.run_id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Efficiency Insights
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

export default QualityPage;
