import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8000/profile', {
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        });
        const data = await response.json();
        setEmail(data.email);
        setName(data.name || '');
        setCredits(data.credits || 0);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.token) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Profile</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-4xl">
                {email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-xl font-semibold text-gray-800 mt-1">
                  {name || 'Not set'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg text-gray-800 mt-1">{email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Active</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Credits</label>
                <p className="text-lg font-semibold text-green-600 mt-1">{credits}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500">Total Benchmarks</div>
          <div className="text-2xl font-bold text-gray-800 mt-2">0</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500">Models Compared</div>
          <div className="text-2xl font-bold text-gray-800 mt-2">0</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500">CO₂ Saved</div>
          <div className="text-2xl font-bold text-green-600 mt-2">0g</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
