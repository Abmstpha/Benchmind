/**
 * Analytics Page - Shows graphs and data visualization
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

interface BenchmarkRun {
  run_id: string;
  project_name: string;
  task_description: string;
  selected_models: string[];
  analytics_data: any;
  benchmark_results: any[];
  created_at: string;
  status: string;
}

export const AnalyticsPage: React.FC = () => {
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
        console.log('🔍 Analytics Page - Fetching all user runs');
        
        const response = await fetch(`http://localhost:8000/api/run/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('🔍 Analytics Page - Response Status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('🔍 Analytics Page - Error Response:', errorText);
          
          if (response.status === 401) {
            throw new Error('Authentication failed - please refresh and try again');
          }
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🔍 Analytics Page - Success:', result.runs?.length || 0, 'runs found');
        setRuns(result.runs || []);
      } catch (err: any) {
        console.error('🔍 Analytics Page - Error:', err.message);
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
    return <div className="max-w-6xl mx-auto p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="w-full h-full overflow-y-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Graphs</h1>
          <Link to="/home" className="px-4 py-2 text-sm border rounded-md">← Back</Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">⏳ {error}</p>
          <p className="text-yellow-600 text-sm mt-2">
            Charts and analytics will appear here once the benchmark run is saved to the database.
          </p>
        </div>
      </div>
    );
  }

  // Simple bar chart component for EcoLogits data
  const SimpleBarChart = ({ data, title, yLabel, color }: { data: any[], title: string, yLabel: string, color: string }) => {
    if (!data || data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(d => parseFloat(d.value)));
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-semibold text-gray-900 mb-4">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 truncate">{item.model}</div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-4 relative">
                  <div 
                    className={`${color} h-4 rounded-full flex items-center justify-end pr-2`}
                    style={{ width: `${(parseFloat(item.value) / maxValue) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.value}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">{yLabel}</div>
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Graphs</h1>
          <p className="text-gray-600 mt-1">All your benchmark analytics and visualizations</p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics yet</h3>
          <p className="text-gray-600 mb-4">Run your first benchmark to see charts and analytics here.</p>
          <Link
            to="/home"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
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
                  console.log('🔍 Analytics - Clicking run:', run.run_id);
                  setExpandedRun(expandedRun === run.run_id ? null : run.run_id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {run.project_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{run.selected_models.length} models benchmarked</span>
                      <span>•</span>
                      <span>{new Date(run.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{run.status}</span>
                    </div>
                    {run.analytics_data?.series && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          📊 {run.analytics_data.series.length} data points
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
              {expandedRun === run.run_id && (run.analytics_data || run.benchmark_results) && (
                <div className="border-t bg-gray-50 p-6">
                  {/* Charts Grid */}
                  {run.benchmark_results && run.benchmark_results.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Energy Chart */}
                      <SimpleBarChart 
                        data={run.benchmark_results.map(r => ({ model: r.model_name || r.model_id, value: r.energy_wh }))}
                        title="Energy Consumption"
                        yLabel="Watt-hours (Wh)"
                        color="bg-yellow-500"
                      />
                      
                      {/* CO2 Chart */}
                      <SimpleBarChart 
                        data={run.benchmark_results.map(r => ({ model: r.model_name || r.model_id, value: r.co2_g }))}
                        title="CO₂ Emissions"
                        yLabel="Grams of CO₂"
                        color="bg-green-500"
                      />
                      
                      {/* Cost Chart */}
                      <SimpleBarChart 
                        data={run.benchmark_results.map(r => ({ model: r.model_name || r.model_id, value: r.cost_usd }))}
                        title="Cost Analysis"
                        yLabel="USD per request"
                        color="bg-blue-500"
                      />
                      
                      {/* Latency Chart (replacing Quality) */}
                      <SimpleBarChart 
                        data={run.benchmark_results.map(r => ({ model: r.model_name || r.model_id, value: r.latency_ms }))}
                        title="Latency (ms)"
                        yLabel="Response time (milliseconds)"
                        color="bg-purple-500"
                      />
                    </div>
                  )}

                  {/* Metrics Table */}
                  {run.analytics_data?.series && run.analytics_data.series.length > 0 && (
                    <div className="bg-white rounded-lg border p-6 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Energy (Wh)</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CO₂ (g)</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Latency (ms)</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost ($)</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {run.analytics_data.series.map((item: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.model_name || item.model_id}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-mono">{item.energy_wh}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-mono">{item.co2_g}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-mono">{item.latency_ms}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-mono">{item.cost_usd}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pareto Frontier */}
                  {run.analytics_data?.pareto && run.analytics_data.pareto.length > 0 && (
                    <div className="bg-white rounded-lg border p-6 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Pareto Optimal Models</h4>
                      <div className="flex flex-wrap gap-2">
                        {run.analytics_data.pareto.map((modelId: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            🏆 {modelId}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        These models offer the best trade-offs between performance and environmental impact.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Link
                      to={`/efficiency?run_id=${run.run_id}&expand=true`}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Efficiency Insights
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

export default AnalyticsPage;
