import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [showPasswordOtp, setShowPasswordOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load user profile
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8000/user/status', {
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        });
        const data = await response.json();
        setEmail(data.email);
        setName(data.name || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    
    if (user?.token) {
      fetchProfile();
    }
  }, [user]);

  const handleUpdateName = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update name');
      }

      setMessage('Name updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEmailChange = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/settings/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ new_email: newEmail })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to request email change');
      }

      setShowEmailOtp(true);
      setMessage('OTP sent to your new email!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/settings/verify-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ code: otp, new_email: newEmail })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to verify OTP');
      }

      setMessage('Email updated successfully!');
      setEmail(newEmail);
      setShowEmailOtp(false);
      setNewEmail('');
      setOtp('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordChange = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/settings/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to request password change');
      }

      setShowPasswordOtp(true);
      setMessage('OTP sent to your email!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPasswordChange = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/settings/verify-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ code: otp })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to verify OTP');
      }

      setMessage('Password updated successfully!');
      setShowPasswordOtp(false);
      setNewPassword('');
      setOtp('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Enter your name"
              />
              <button
                onClick={handleUpdateName}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Email Change Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Email</h2>
        
        {!showEmailOtp ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Enter new email"
              />
            </div>
            <button
              onClick={handleRequestEmailChange}
              disabled={loading || !newEmail}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Change Email'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP (sent to {newEmail})</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleVerifyEmailChange}
                disabled={loading || !otp}
                className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                onClick={() => {
                  setShowEmailOtp(false);
                  setOtp('');
                }}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
        
        {!showPasswordOtp ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Enter new password"
              />
            </div>
            <button
              onClick={handleRequestPasswordChange}
              disabled={loading || !newPassword}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Change Password'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleVerifyPasswordChange}
                disabled={loading || !otp}
                className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordOtp(false);
                  setOtp('');
                }}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default Settings;
