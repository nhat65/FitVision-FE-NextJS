import { getAccessToken, getRefreshToken, saveTokens, clearTokens, TokenResponse } from './auth-store'

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      return false
    }

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
    console.error('[v0] Token refresh error:', error)
    clearTokens()
    return false
  }
}

export async function apiCall(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options

  if (!skipAuth) {
    let accessToken = getAccessToken()

    if (!accessToken) {
      clearTokens()
      window.location.href = '/login'
      throw new Error('No authentication token')
    }

    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${accessToken}`,
    }

    try {
      let response = await fetch(url, fetchOptions)

      if (response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = refreshAccessToken().finally(() => {
            isRefreshing = false
            refreshPromise = null
          })
        }

        const refreshed = await refreshPromise

        if (refreshed) {
          accessToken = getAccessToken()
          if (accessToken) {
            fetchOptions.headers = {
              ...fetchOptions.headers,
              Authorization: `Bearer ${accessToken}`,
            }
            response = await fetch(url, fetchOptions)
          }
        } else {
          window.location.href = '/login'
          throw new Error('Token refresh failed')
        }
      }

      return response
    } catch (error) {
      console.error('[v0] API call error:', error)
      throw error
    }
  }

  return fetch(url, fetchOptions)
}
