const API_BASE_URL = 'https://benchmind.onrender.com';

console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  FINAL_URL: API_BASE_URL
});

export { API_BASE_URL };
