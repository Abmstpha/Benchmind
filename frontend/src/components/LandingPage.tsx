import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
        setError('Signup successful! Please check your email for OTP verification.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center md:text-left space-y-6">
          <div className="flex flex-col items-center md:items-start">
            <img src="/assets/logo.png" alt="Benchmind" className="h-70 w-70 md:h-90 md:w-90 mb-6" />
            <p className="text-2xl text-gray-700 font-medium">
              AI Model Selection Engine
            </p>
          </div>
          
          <p className="text-lg text-gray-600 leading-relaxed">
            Choose the right AI model for your task with <span className="text-green-600 font-semibold">Green-AI observability</span>. 
            We measure quality, latency, cost, and environmental impact.
          </p>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="text-2xl">⚡</span>
              <span className="text-sm font-medium text-gray-700">Performance</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="text-2xl">💰</span>
              <span className="text-sm font-medium text-gray-700">Cost Efficiency</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="text-2xl">🌱</span>
              <span className="text-sm font-medium text-gray-700">Green AI</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-green-100">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to access your dashboard' : 'Create an account to begin'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className={`p-3 rounded-lg text-sm ${
                error.includes('successful') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
