// ✅ Good final version
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor
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

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await api.post('/auth/refresh', { refreshToken })
        const { token } = response.data

        localStorage.setItem('token', token)
        originalRequest.headers.Authorization = `Bearer ${token}`

        return api(originalRequest)
      } catch (err) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// ✅ Correct export (choose one of the two options below)

// Option 1: Default export
export default api

// OR Option 2: Named export (comment out the one you're not using)
// export { api }
