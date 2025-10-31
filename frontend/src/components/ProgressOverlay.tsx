/**
 * Progress Overlay - 7-step animated stepper
 */

import React from 'react';

interface ProgressOverlayProps {
  currentStep: string;
  progress: number;
}

const STEPS = [
  { id: 'parse_plan', label: 'Parse & Plan', description: 'Analyze task requirements' },
  { id: 'craft_prompts', label: 'Craft Prompts', description: 'Generate test prompts' },
  { id: 'fetch_green_insights', label: 'Fetch Green Insights', description: 'Get EcoLogits data & create graphs' },
  { id: 'analyze_quality', label: 'Analyze Quality', description: 'Search web for quality benchmarks' },
  { id: 'show_results', label: 'Show Results', description: 'Present recommendations' },
];

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({ currentStep, progress }) => {
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Models</h2>
        <p className="text-gray-600">Running benchmarks and computing environmental impact...</p>
      </div>

      {/* Stepper */}
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start p-3 rounded-lg transition-all ${
                isActive ? 'bg-green-50 border-2 border-green-500' :
                isCompleted ? 'bg-gray-50' :
                'bg-white border border-gray-200'
              }`}
            >
              {/* Step Icon */}
              <div className="flex-shrink-0 mr-3">
                {isCompleted ? (
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600">{index + 1}</span>
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-semibold ${
                    isActive ? 'text-green-900' :
                    isCompleted ? 'text-gray-700' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </h3>
                  {isActive && (
                    <span className="text-xs text-green-600 font-medium">Running...</span>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-gray-500">Done</span>
                  )}
                </div>
                <p className={`text-xs ${
                  isActive ? 'text-green-700' :
                  isCompleted ? 'text-gray-600' :
                  'text-gray-400'
                }`}>
                  {step.description}
                </p>

                {/* Progress Bar for Active Step */}
                {isActive && (
                  <div className="mt-2 w-full bg-green-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(((currentStepIndex + progress) / STEPS.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + progress) / STEPS.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverlay;
