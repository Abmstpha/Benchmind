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
  model_id?: string;
  latency_ms: number;
  cost_usd: number;
  energy_wh: number;
  co2_g: number;
  tokens_used: number;
  test_prompt?: string;
}

interface BenchmarkChartsProps {
  results: BenchmarkResult[];
}

export const BenchmarkCharts: React.FC<BenchmarkChartsProps> = ({ results }) => {
  console.log('BenchmarkCharts received results:', results); // Debug log
  
  // Handle empty results
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No benchmark data available. Please run a benchmark first.</p>
      </div>
    );
  }
  
  // Transform data for different chart types
  const chartData = results.map(result => ({
    name: (result.model || result.model_id || 'Unknown').replace('Mistral ', '').replace('Open ', ''),
    latency: Math.round(result.latency_ms || 0),
    cost: (result.cost_usd || 0) * 1000000, // Convert to micro-dollars for better display
    co2: Math.round((result.co2_g || 0) * 100) / 100,
    energy: Math.round((result.energy_wh || 0) * 100) / 100,
    tokens: result.tokens_used || 0
  }));
  
  console.log('Transformed chartData:', chartData); // Debug log

  // Radar chart data (normalized to 0-100 scale)
  const radarData = results.map(result => {
    const maxLatency = Math.max(...results.map(r => r.latency_ms || 0));
    const maxCost = Math.max(...results.map(r => r.cost_usd || 0));
    const maxCO2 = Math.max(...results.map(r => r.co2_g || 0));
    
    return {
      model: (result.model || result.model_id || 'Unknown').replace('Mistral ', '').replace('Open ', ''),
      Speed: Math.round((1 - (result.latency_ms || 0) / maxLatency) * 100), // Invert latency (lower is better)
      'Cost Efficiency': Math.round((1 - (result.cost_usd || 0) / maxCost) * 100), // Invert cost
      'Green Score': Math.round((1 - (result.co2_g || 0) / maxCO2) * 100) // Invert CO2
    };
  });

  // Color scheme for models (keeping for future use)
  // const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Cost vs Environmental Impact */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">💰 Cost vs Environmental Impact</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={chartData} margin={{ top: 60, right: 20, bottom: 60, left: 20 }}>
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
              domain={[0, 'dataMax + 0.01']}
              label={{ value: 'CO₂ Emissions (g) - Lower is Better', angle: -90, position: 'insideLeft' }}
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
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
            />
            {chartData.map((entry, index) => (
              <Scatter 
                key={entry.name}
                name={entry.name}
                data={[entry]} 
                fill={index === 0 ? "#10B981" : index === 1 ? "#059669" : "#047857"} 
              />
            ))}
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
        
        {/* Response Length Comparison */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Response Length Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 'dataMax + 50']} />
              <Tooltip formatter={(value) => [`${value} tokens`, 'Response Length']} />
              <Bar dataKey="tokens" fill="#059669" radius={[4, 4, 0, 0]} />
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
              <Bar dataKey="cost" fill="#10B981" radius={[4, 4, 0, 0]} />
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
                  {result.model || result.model_id || 'Unknown'}
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
                    <span className="text-gray-600">Efficiency:</span>
                    <span className="font-medium text-blue-700">
                      {result.tokens_used ? ((result.energy_wh || 0) / result.tokens_used * 1000).toFixed(2) : '0'} mWh/token
                    </span>
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
                const ledMinutes = ((result.energy_wh || 0) / 0.01 * 60).toFixed(1); // LED bulb equivalent
                return (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{(result.model || '').replace('Mistral ', '')}:</span>
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
                    <span className="text-gray-600">{(result.model || '').replace('Mistral ', '')}:</span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Length</th>
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
                    {result.model || result.model_id || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {result.tokens_used || 0} tokens
                    </span>
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
