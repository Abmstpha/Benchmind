
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import BenchmindLanding from './BenchmindLanding';
import Settings from './Settings';
import Profile from './Profile';
import EfficiencyPage from '../pages/EfficiencyPage';
import QualityPage from '../pages/QualityPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import { ModelResult } from '../api/benchmind';
import { useAuth } from '../contexts/AuthContext';

interface ProfessionalLayoutProps {}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [benchmarkHistory] = useState<Array<{
    id: string;
    timestamp: string;
    prompt: string;
    results: ModelResult[];
    winner: string;
  }>>([]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link to="/home" className="flex items-center hover:opacity-80 transition-opacity">
          <img 
            src="/assets/logo.png" 
            alt="Benchmind Logo" 
            className="h-16 w-16 mr-3 object-contain"
          />
          <h1 className="text-xl font-semibold text-gray-900">Benchmind</h1>
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/profile" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">{user?.email}</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-green-50 to-emerald-50 border-r border-green-200 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              <Link 
                to="/home"
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/home' 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              
              <Link 
                to="/efficiency"
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/efficiency' 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Efficiency
              </Link>
              
              <Link 
                to="/quality"
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/quality' 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quality
              </Link>
              
              <Link 
                to="/analytics"
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/analytics' 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Link>
              
              <div className="my-2 border-t border-gray-200"></div>
              
              <Link 
                to="/settings"
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/settings' 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
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
        <main className="flex-1 h-screen overflow-hidden">
          <Routes>
            <Route path="/home" element={<BenchmindLanding />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/efficiency" element={<EfficiencyPage />} />
            <Route path="/quality" element={<QualityPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default ProfessionalLayout;
