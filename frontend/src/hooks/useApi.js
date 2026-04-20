import axios from 'axios'

// 🔥 FIX: Force correct backend URL (EC2)
// Use env if available, otherwise fallback to EC2 NOT localhost
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://3.110.33.106:4000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 🔐 Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ❌ Optional: Better error visibility
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API ERROR:', error.response || error)
    return Promise.reject(error)
  }
)

export default api