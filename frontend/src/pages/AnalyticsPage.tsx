import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';

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
      const response = await fetch(`${API_BASE_URL}/api/run/history/${runId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete run');
      }

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
        
        const response = await fetch(`${API_BASE_URL}/api/run/history`, {
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

  useEffect(() => {
    const shouldExpand = searchParams.get('expand') === 'true';
    const runId = searchParams.get('run_id');
    
    if (shouldExpand && runId && runs.length > 0) {
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

  const BenchmarkCharts = ({ results }: { results: any[] }) => {
    console.log('BenchmarkCharts received results:', results);
    
    if (!results || results.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No benchmark data available. Please run a benchmark first.</p>
        </div>
      );
    }
    
    const chartData = results.map(result => ({
      name: (result.model_name || result.model_id || result.model || 'Unknown').replace('Mistral ', '').replace('Open ', ''),
      latency: Math.round(result.latency_ms || 0),
      cost: (result.cost_usd || 0) * 1000000,
      co2: parseFloat(result.co2_g) || 0,
      energy: result.energy_wh || 0,
      tokens: result.tokens_used || 0
    }));
    
    console.log('Transformed chartData:', chartData);
    console.log('CO₂ values:', chartData.map(d => ({ name: d.name, co2: d.co2 })));

    const modelsWithScores = chartData.map(model => {
      // Efficiency score: lower cost + lower co2 + lower latency + lower energy = better
      const efficiencyScore = model.cost + model.co2 * 1000 + model.latency + model.energy * 100;
      return { ...model, efficiencyScore };
    });
    
    // Sort by efficiency (best to worst)
    const sortedModels = [...modelsWithScores].sort((a, b) => a.efficiencyScore - b.efficiencyScore);
    
    // Assign colors based on efficiency ranking
    const getModelColor = (modelName: string) => {
      const index = sortedModels.findIndex(m => m.name === modelName);
      if (index === 0) return "#10B981"; // Green - Most efficient
      if (index === sortedModels.length - 1) return "#EF4444"; // Red - Least efficient  
      return "#F59E0B"; // Yellow/Orange - Middle efficiency
    };

    // Calculate radar data with proper normalization (consistent with BenchmarkCharts)
    const maxLatency = Math.max(...chartData.map(d => d.latency));
    const maxCost = Math.max(...chartData.map(d => d.cost));
    const maxCO2 = Math.max(...chartData.map(d => d.co2));
    const maxEnergy = Math.max(...chartData.map(d => d.energy));
    
    const normalizedRadarData = chartData.map(item => {
      const normalizeInverted = (value: number, max: number) => {
        if (max === 0) return 100; // If all values are 0, give perfect score
        // Invert and normalize to 0-100: lower values get higher scores
        return Math.round((1 - (value || 0) / max) * 100);
      };
      
      return {
        model: item.name,
        Speed: normalizeInverted(item.latency, maxLatency),
        'Cost Efficiency': normalizeInverted(item.cost, maxCost),
        'Green Score': normalizeInverted(item.co2, maxCO2),
        'Energy Efficiency': normalizeInverted(item.energy, maxEnergy)
      };
    });

    return (
      <div className="space-y-8">
        {/* Cost vs Environmental Impact */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">💰 Cost vs Environmental Impact</h3>
          
          {/* Custom Legend */}
          <div className="flex flex-wrap gap-4 mb-4 justify-center">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getModelColor(entry.name) }}
                ></div>
                <span className="text-sm text-gray-700">{entry.name}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={chartData} margin={{ top: 20, right: 20, bottom: 60, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="cost" 
                name="Cost" 
                domain={['dataMin - 10', 'dataMax + 10']}
                label={{ value: 'Cost (micro-USD) - Lower is Better', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="co2" 
                name="CO₂" 
                domain={[0, 'dataMax']}
                label={{ value: 'CO₂ Emissions(g)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900">{data.name}</p>
                        <p className="text-sm text-gray-600">
                          <span className="text-blue-600">Cost:</span> ${data.cost.toFixed(1)}μ
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="text-red-600">CO₂:</span> {data.co2}g
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="Models"
                data={chartData} 
                fill="#8884d8"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getModelColor(entry.name)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-dimensional Radar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">🕸️ Multi-Dimensional Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={normalizedRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="model" />
              <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
              <Radar
                name="Speed"
                dataKey="Speed"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Cost Efficiency"
                dataKey="Cost Efficiency"
                stroke="#EC4899"
                fill="#EC4899"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Green Score"
                dataKey="Green Score"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Energy Efficiency"
                dataKey="Energy Efficiency"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics Bar Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Latency Comparison */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">⚡ Latency Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}ms`, 'Latency']} />
                <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getModelColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Efficiency */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">💰 Cost Efficiency</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${(Number(value)/1000000).toFixed(6)}`, 'Cost per inference']} />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getModelColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Environmental Impact */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🌱 Environmental Impact</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'co2' ? `${value}g CO₂` : `${value}Wh`,
                    name === 'co2' ? 'CO₂ Emissions' : 'Energy Usage'
                  ]}
                />
                <Bar dataKey="co2" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="energy" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EcoLogits Insights */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">🌱 EcoLogits Environmental Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.map((result, index) => {
              const energyEquivalent = ((result.energy_wh || 0) * 1000).toFixed(1); // Convert to mWh
              const co2Equivalent = ((result.co2_g || 0) * 1000).toFixed(1); // Convert to mg
              
              return (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {result.model_name || result.model_id || result.model || 'Unknown'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Energy:</span>
                      <span className="font-medium text-green-700">{(result.energy_wh || 0).toFixed(3)} Wh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CO₂:</span>
                      <span className="font-medium text-red-700">{(result.co2_g || 0).toFixed(3)} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Latency:</span>
                      <span className="font-medium text-blue-700">{Math.round(result.latency_ms || 0)}ms</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        ≈ {energyEquivalent}mWh energy • {co2Equivalent}mg CO₂
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>💡 EcoLogits Methodology:</strong> Real environmental impact data measured using ISO 14044 standards. 
              Energy consumption and CO₂ emissions are calculated based on actual model inference and data center efficiency.
            </p>
          </div>
          
          {/* Environmental Impact Comparison */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">🔋 Energy Comparison</h4>
              <div className="space-y-1 text-sm">
                {results.map((result, index) => {
                  const ledMinutes = ((result.energy_wh || 0) * 6).toFixed(1); // 10W LED: Wh / 10W * 60min/hr = Wh * 6
                  return (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{(result.model_name || result.model || '').replace('Mistral ', '')}:</span>
                      <span className="text-green-700">≈ {ledMinutes}min LED bulb</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">🌍 Carbon Footprint</h4>
              <div className="space-y-1 text-sm">
                {results.map((result, index) => {
                  const carMeters = ((result.co2_g || 0) / 120 * 1000).toFixed(1); // Car driving equivalent (120g CO2/km)
                  return (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{(result.model_name || result.model || '').replace('Mistral ', '')}:</span>
                      <span className="text-red-700">≈ {carMeters}m car driving</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary Table */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Performance Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CO₂</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.model_name || result.model_id || result.model || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(result.latency_ms || 0)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${((result.cost_usd || 0) * 1000000).toFixed(2)}μ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(result.co2_g || 0).toFixed(3)}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(result.energy_wh || 0).toFixed(3)}Wh
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                  {/* Comprehensive Charts */}
                  {run.benchmark_results && run.benchmark_results.length > 0 && (
                    <BenchmarkCharts results={run.benchmark_results} />
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
