
import React from 'react';
import { Link } from 'react-router-dom';

interface ResultCardsProps {
  runId: string;
}

export const ResultCards: React.FC<ResultCardsProps> = ({ runId }) => {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Complete!</h2>
        <p className="text-gray-600">Your benchmark results are ready. Click any card to view details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to={`/efficiency?run_id=${runId}`}
          className="bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all p-6 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Efficiency Recommendation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Best model(s) under your constraints with implementation notes
          </p>
          <div className="text-sm font-medium text-green-600 group-hover:text-green-700">
            View recommendation →
          </div>
        </Link>

        {/* Quality Insights Card */}
        <Link
          to={`/quality?run_id=${runId}`}
          className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all p-6 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Insights</h3>
          <p className="text-sm text-gray-600 mb-4">
            MMLU / HumanEval / GSM8K with cited sources
          </p>
          <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
            View quality evidence →
          </div>
        </Link>

        {/* Analytics & Graphs Card */}
        <Link
          to={`/analytics?run_id=${runId}`}
          className="bg-white rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all p-6 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Graphs</h3>
          <p className="text-sm text-gray-600 mb-4">
            Cost • CO₂ • latency • tokens • Pareto frontier
          </p>
          <div className="text-sm font-medium text-purple-600 group-hover:text-purple-700">
            View analytics →
          </div>
        </Link>
      </div>

      {/* Back Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 transition-colors"
        >
          ← Start New Analysis
        </button>
      </div>
    </div>
  );
};

export default ResultCards;
