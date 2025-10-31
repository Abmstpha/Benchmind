// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://benchmind.onrender.com'
    : 'http://localhost:8000');

console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  FINAL_URL: API_BASE_URL
});

export { API_BASE_URL };
