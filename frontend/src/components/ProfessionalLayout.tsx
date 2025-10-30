/**
 * Professional Layout - Clean, enterprise-grade UI
 */

import React, { useState } from 'react';
import AIConsultant from './AIConsultant';
import { ModelResult } from '../api/benchmind';

interface ProfessionalLayoutProps {}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = () => {
  const [benchmarkHistory] = useState<Array<{
    id: string;
    timestamp: string;
    prompt: string;
    results: ModelResult[];
    winner: string;
  }>>([]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 border-b border-green-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/assets/logo.png" 
              alt="Benchmind Logo" 
              className="w-10 h-10 rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold text-white">🌱 Benchmind</h1>
              <span className="text-sm text-green-100">AI Model Benchmarking & Environmental Impact</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-green-100">
              {new Date().toLocaleDateString()}
            </span>
            <div className="w-2 h-2 bg-green-300 rounded-full"></div>
            <span className="text-sm text-green-100">Online</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Benchmarks
              </a>
              <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Analytics
              </a>
              <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </a>
            </div>
          </nav>

          {/* Recent Benchmarks */}
          {benchmarkHistory.length > 0 && (
            <div className="p-4 border-t border-gray-200 mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Benchmarks</h3>
              <div className="space-y-2">
                {benchmarkHistory.slice(0, 5).map((benchmark) => (
                  <div key={benchmark.id} className="p-2 bg-gray-50 rounded text-xs">
                    <div className="font-medium text-gray-900 truncate">
                      {benchmark.prompt.substring(0, 30)}...
                    </div>
                    <div className="text-gray-500 mt-1">
                      Winner: {benchmark.results.find(r => r.model_id === benchmark.winner)?.model_name}
                    </div>
                    <div className="text-gray-400 mt-1">
                      {new Date(benchmark.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="w-full">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Model Benchmarks</h2>
              <p className="text-gray-600 mt-1">
                Compare AI models across quality, latency, cost, and environmental impact
              </p>
            </div>

            {/* AI Consultant */}
            <div className="mb-6">
              <AIConsultant />
            </div>

            {/* Results History */}
            {benchmarkHistory.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Benchmark History</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Previous benchmark results and comparisons
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {benchmarkHistory.map((benchmark) => (
                      <div key={benchmark.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">{benchmark.prompt}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(benchmark.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Winner: {benchmark.results.find(r => r.model_id === benchmark.winner)?.model_name}
                          </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Model
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Latency
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Cost
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  CO₂
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {benchmark.results.map((result, index) => (
                                <tr key={index} className={result.model_id === benchmark.winner ? 'bg-green-50' : ''}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {result.model_name}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {result.latency_ms.toFixed(0)}ms
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    ${result.cost_usd.toFixed(6)}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {result.co2_g.toFixed(4)}g
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfessionalLayout;
