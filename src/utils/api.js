// Utility function for authenticated API calls
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle token expiration (401 Unauthorized or 403 Forbidden)
  if (response.status === 401 || response.status === 403) {
    // Clear token and user data
    localStorage.removeItem('authToken')
    localStorage.removeItem('loggedInUser')
    
    // Redirect to login or reload page if not already on login
    if (!window.location.pathname.includes('login')) {
      window.location.reload()
    }
  }

  return response
}

