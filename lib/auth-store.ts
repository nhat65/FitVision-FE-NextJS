export interface TokenResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    roel: string
  }
}

const ACCESS_TOKEN_KEY = 'fitvision_access_token'
const REFRESH_TOKEN_KEY = 'fitvision_refresh_token'
const USER_KEY = 'fitvision_user_data'

// Get access token
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

// Get refresh token
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

// Save tokens
export function saveTokens(tokens: TokenResponse) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(tokens.user))
  console.log(tokens.user)
}

// Clear tokens
export function clearTokens() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Get stored user
export function getStoredUser() {
  if (typeof window === 'undefined') return null
  const userData = localStorage.getItem(USER_KEY)
  return userData ? JSON.parse(userData) : null
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}

// Refresh access token
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      return false
    }

    const data: TokenResponse = await response.json()
    saveTokens(data)
    return true
  } catch (error) {
    console.error('[v0] Token refresh failed:', error)
    clearTokens()
    return false
  }
}
