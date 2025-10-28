/**
 * Benchmark Charts - Visual representation of AI model comparison results
 */

import React from 'react';
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
  Scatter
} from 'recharts';

interface BenchmarkResult {
  model: string;
  quality: number;
  latency_ms: number;
  cost_usd: number;
  energy_wh: number;
  co2_g: number;
  tokens_used?: number;
  test_prompt?: string;
}

interface BenchmarkChartsProps {
  results: BenchmarkResult[];
}

export const BenchmarkCharts: React.FC<BenchmarkChartsProps> = ({ results }) => {
  // Transform data for different chart types
  const chartData = results.map(result => ({
    name: result.model.replace('Mistral ', '').replace('Open ', ''),
    quality: Math.round(result.quality * 100),
    latency: Math.round(result.latency_ms),
    cost: result.cost_usd * 1000000, // Convert to micro-dollars for better display
    co2: Math.round(result.co2_g * 100) / 100,
    energy: Math.round(result.energy_wh * 100) / 100,
    tokens: result.tokens_used || 0
  }));

  // Radar chart data (normalized to 0-100 scale)
  const radarData = results.map(result => {
    const maxLatency = Math.max(...results.map(r => r.latency_ms));
    const maxCost = Math.max(...results.map(r => r.cost_usd));
    const maxCO2 = Math.max(...results.map(r => r.co2_g));
    
    return {
      model: result.model.replace('Mistral ', '').replace('Open ', ''),
      Quality: Math.round(result.quality * 100),
      Speed: Math.round((1 - result.latency_ms / maxLatency) * 100), // Invert latency (lower is better)
      'Cost Efficiency': Math.round((1 - result.cost_usd / maxCost) * 100), // Invert cost
      'Green Score': Math.round((1 - result.co2_g / maxCO2) * 100) // Invert CO2
    };
  });

  // Color scheme for models (keeping for future use)
  // const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Quality vs Speed Scatter Plot */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">🎯 Quality vs Speed Trade-off</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="latency" 
              name="Latency (ms)" 
              domain={['dataMin - 100', 'dataMax + 100']}
              label={{ value: 'Latency (ms) - Lower is Better', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="quality" 
              name="Quality %" 
              domain={[60, 100]}
              label={{ value: 'Quality (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'quality' ? `${value}%` : `${value}ms`,
                name === 'quality' ? 'Quality' : 'Latency'
              ]}
              labelFormatter={(label) => `Model: ${label}`}
            />
            <Scatter name="Models" data={chartData} fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-dimensional Radar Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">🕸️ Multi-Dimensional Performance</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="model" />
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
            <Radar
              name="Quality"
              dataKey="Quality"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Speed"
              dataKey="Speed"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Cost Efficiency"
              dataKey="Cost Efficiency"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Green Score"
              dataKey="Green Score"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Metrics Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quality Comparison */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Quality Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Quality']} />
              <Bar dataKey="quality" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency Comparison */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">⚡ Latency Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}ms`, 'Latency']} />
              <Bar dataKey="latency" fill="#F59E0B" radius={[4, 4, 0, 0]} />
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
              <Bar dataKey="cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
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
              <Bar dataKey="co2" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="energy" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
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
                    {result.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {Math.round(result.quality * 100)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(result.latency_ms)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${(result.cost_usd * 1000000).toFixed(2)}μ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.co2_g.toFixed(2)}g
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.energy_wh.toFixed(2)}Wh
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
