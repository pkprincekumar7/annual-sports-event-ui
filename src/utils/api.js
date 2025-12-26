import API_URL from '../config/api.js'

// Utility function to decode JWT token (without verification - for client-side use only)
export const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

// Helper function to build full API URL
const buildApiUrl = (endpoint) => {
  // If endpoint already starts with http, use it as-is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  // Otherwise, prepend API_URL
  return `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

// Utility function for authenticated API calls
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken')
  
  // Build full URL using API_URL config
  const fullUrl = buildApiUrl(url)
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  })

  // Handle token expiration (401 Unauthorized or 403 Forbidden)
  if (response.status === 401 || response.status === 403) {
    // Clear token only (user data is not stored in localStorage)
    localStorage.removeItem('authToken')
    
    // Redirect to login or reload page if not already on login
    if (!window.location.pathname.includes('login')) {
      window.location.reload()
    }
  }

  return response
}

// Export API_URL for direct use in components if needed
export { API_URL }

