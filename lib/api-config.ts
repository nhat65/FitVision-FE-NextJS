// API Configuration for backend communication
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// API endpoints
export const API_ENDPOINTS = {
  // Workout Programs
  programs: {
    getAll: `${API_BASE_URL}/api/programs`,
    getOne: (id: string) => `${API_BASE_URL}/api/programs/${id}`,
    create: `${API_BASE_URL}/api/programs`,
    update: (id: string) => `${API_BASE_URL}/api/programs/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/programs/${id}`,
  },
  
  // Exercises
  exercises: {
    getAll: `${API_BASE_URL}/api/exercises`,
    getOne: (id: string) => `${API_BASE_URL}/api/exercises/${id}`,
    create: `${API_BASE_URL}/api/exercises`,
    update: (id: string) => `${API_BASE_URL}/api/exercises/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/exercises/${id}`,
  },
  
  // Users
  users: {
    getAll: `${API_BASE_URL}/api/users`,
    getOne: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    create: `${API_BASE_URL}/api/users`,
    update: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  },
  
  // Subscriptions
  subscriptions: {
    getAll: `${API_BASE_URL}/api/subscriptions`,
    getOne: (id: string) => `${API_BASE_URL}/api/subscriptions/${id}`,
    create: `${API_BASE_URL}/api/subscriptions`,
    update: (id: string) => `${API_BASE_URL}/api/subscriptions/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/subscriptions/${id}`,
    enrollProgram: `${API_BASE_URL}/api/subscriptions/enroll`,
  },
}

// Helper function to get API URL
export function getAPIUrl(endpoint: string): string {
  console.log('jejeje')
  return `${API_BASE_URL}${endpoint}`
}

// Helper function to make API calls with error handling
export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      return { error: `API Error: ${response.status} ${response.statusText}` }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    console.error('[API Error]', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}
