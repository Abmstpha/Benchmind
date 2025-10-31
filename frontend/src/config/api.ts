// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://benchmind.onrender.com'
  : 'http://localhost:8000';

export { API_BASE_URL };
