
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
  Scatter,
  Cell
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
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No benchmark data available. Please run a benchmark first.</p>
      </div>
    );
  }
  
  const chartData = results.map(result => ({
    name: result.model || result.model_id || 'Unknown',
    latency: Math.round(result.latency_ms || 0),
    cost: (result.cost_usd || 0) * 1000000,
    co2: Math.round((result.co2_g || 0) * 100) / 100,
    energy: Math.round((result.energy_wh || 0) * 100) / 100,
    tokens: result.tokens_used || 0
  }));
  
  const dataWithScores = chartData.map(d => ({
    ...d,
    greenScore: d.co2 + (d.cost / 100)
  }));
  
  const sortedByGreen = [...dataWithScores].sort((a, b) => a.greenScore - b.greenScore);
  const colorMap: { [key: string]: string } = {};
  sortedByGreen.forEach((item, idx) => {
    if (idx === 0) colorMap[item.name] = '#10B981';
    else if (idx === sortedByGreen.length - 1) colorMap[item.name] = '#EF4444';
    else colorMap[item.name] = '#F59E0B';
  });

  // Calculate radar data with proper normalization
  const maxLatency = Math.max(...results.map(r => r.latency_ms || 0));
  const maxCost = Math.max(...results.map(r => r.cost_usd || 0));
  const maxCO2 = Math.max(...results.map(r => r.co2_g || 0));
  const maxEnergy = Math.max(...results.map(r => r.energy_wh || 0));
  
  const radarData = results.map(result => {
    const normalizeInverted = (value: number, max: number) => {
      if (max === 0) return 100; // If all values are 0, give perfect score
      // Invert and normalize to 0-100: lower values get higher scores
      return Math.round((1 - (value || 0) / max) * 100);
    };
    
    return {
      model: (result.model || result.model_id || 'Unknown').replace('Mistral ', '').replace('Open ', ''),
      Speed: normalizeInverted(result.latency_ms || 0, maxLatency),
      'Cost Efficiency': normalizeInverted(result.cost_usd || 0, maxCost),
      'Green Score': normalizeInverted(result.co2_g || 0, maxCO2),
      'Energy Efficiency': normalizeInverted(result.energy_wh || 0, maxEnergy)
    };
  });

  return (
    <div className="space-y-8">
      {/* Cost vs Environmental Impact */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">💰 Cost vs Environmental Impact</h3>
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart data={chartData} margin={{ top: 60, right: 40, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="cost" 
              name="Cost" 
              domain={['auto', 'auto']}
              label={{ value: 'Cost (micro-USD) - Lower is Better', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="co2" 
              name="CO₂" 
              domain={['auto', 'auto']}
              label={{ value: 'CO₂ Emissions (g) - Lower is Better', angle: -90, position: 'insideLeft' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              content={() => (
                <div className="flex justify-center gap-4 mb-2">
                  {chartData.map(d => (
                    <div key={d.name} className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: colorMap[d.name] || '#6B7280' }}
                      />
                      <span className="text-sm text-gray-700">{d.name}</span>
                    </div>
                  ))}
                </div>
              )}
            />
            <Scatter name="Models" data={chartData}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={colorMap[entry.name] || '#6B7280'} />
              ))}
            </Scatter>
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload; // Now this IS the hovered point
                const modelName = d.name;
                const color = colorMap[modelName] || '#6B7280';
                const label = color === '#10B981' ? '🌱 Most Eco-Friendly' : 
                              color === '#EF4444' ? '⚠️ Least Eco-Friendly' : 
                              '⚡ Moderate';
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900">{modelName}</p>
                    <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
                    <p className="text-sm text-gray-600">
                      <span className="text-blue-600">Cost:</span> ${d.cost.toFixed(1)}μ
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="text-red-600">CO₂:</span> {d.co2}g
                    </p>
                  </div>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-dimensional Radar Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800">🕸️ Multi-Dimensional Performance</h3>
          <div className="text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 max-w-xs">
            <p className="font-semibold text-gray-700 mb-2">📊 Dimension Guide:</p>
            <div className="text-sm space-y-1">
              <p className="text-gray-600"><span className="font-medium" style={{color: '#FF6B6B'}}>Speed:</span> Lower latency = Higher score</p>
              <p className="text-gray-600"><span className="font-medium" style={{color: '#3B82F6'}}>Cost Efficiency:</span> Lower cost = Higher score</p>
              <p className="text-gray-600"><span className="font-medium" style={{color: '#10B981'}}>Green Score:</span> Lower CO₂ = Higher score</p>
              <p className="text-gray-600"><span className="font-medium" style={{color: '#F59E0B'}}>Energy Efficiency:</span> Lower energy = Higher score</p>
            </div>
            <p className="text-gray-500 mt-2 italic">Higher values = Better performance</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="model" />
            <PolarRadiusAxis domain={[0, 100]} tickCount={6} />
            <Radar
              name="Speed"
              dataKey="Speed"
              stroke="#FF6B6B"
              fill="#FF6B6B"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Cost Efficiency"
              dataKey="Cost Efficiency"
              stroke="#3B82F6"
              fill="#3B82F6"
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
              <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorMap[entry.name] || '#6B7280'} />
                ))}
              </Bar>
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
              <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorMap[entry.name] || '#6B7280'} />
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
                  <Cell key={`cell-${index}`} fill={colorMap[entry.name] || '#6B7280'} />
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
              <Bar dataKey="co2" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorMap[entry.name] || '#6B7280'} />
                ))}
              </Bar>
              <Bar dataKey="energy" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorMap[entry.name] || '#6B7280'} />
                ))}
              </Bar>
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
                // LED bulb: 10W = 0.01 kWh per hour = 0.0167 Wh per minute
                // Formula: Wh / 0.0167 Wh/min = minutes of LED bulb runtime
                const ledMinutes = ((result.energy_wh || 0) / 0.0167).toFixed(1);
                return (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{(result.model || '').replace('Mistral ', '')}:</span>
                    <span className="text-green-700">≈ {ledMinutes}min LED bulb (10W)</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">🌍 Carbon Footprint</h4>
            <div className="space-y-1 text-sm">
              {results.map((result, index) => {
                // Average car: 120g CO₂/km = 0.12g CO₂/meter
                // Formula: g CO₂ / 0.12 = meters driven
                const carMeters = ((result.co2_g || 0) / 0.12).toFixed(1); // Car driving equivalent
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
