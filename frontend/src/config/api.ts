// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://benchmind.onrender.com'
    : 'http://localhost:8000');

export { API_BASE_URL };
