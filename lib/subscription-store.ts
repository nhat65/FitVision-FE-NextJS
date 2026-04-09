// Subscription and enrollment management

export interface UserSubscription {
  id: string
  userId: string
  type: 'free' | 'ai-monitoring'
  status: 'active' | 'expired' | 'cancelled'
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProgramEnrollment {
  id: string
  userId: string
  programId: string
  enrolledAt: string
  startDate: string
  completedAt: string | null
  progress: number // percentage 0-100
  sessionsCompleted: number
  totalSessions: number
}

export interface ProgramPricing {
  programId: string
  isPremium: boolean
  price: number // in USD, 0 for free programs
  aiMonitoringFee: number // monthly fee in USD
}

const SUBSCRIPTIONS_KEY = 'fitvision_subscriptions'
const ENROLLMENTS_KEY = 'fitvision_enrollments'
const PRICING_KEY = 'fitvision_pricing'

// Get user's current subscription
export function getUserSubscription(userId: string): UserSubscription | null {
  if (typeof window === 'undefined') return null

  const data = localStorage.getItem(SUBSCRIPTIONS_KEY)
  const subscriptions: UserSubscription[] = data ? JSON.parse(data) : []

  const subscription = subscriptions.find(
    (s) => s.userId === userId && s.status === 'active'
  )

  if (subscription) {
    // Check if expired
    if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      subscription.status = 'expired'
      updateSubscription(subscription)
      return null
    }
  }

  return subscription || null
}

// Check if user has AI monitoring subscription
export function isAIMonitoringActive(userId: string): boolean {
  const subscription = getUserSubscription(userId)
  return subscription?.type === 'ai-monitoring'
}

// Create or update subscription
export function createOrUpdateSubscription(
  subscription: UserSubscription
): void {
  if (typeof window === 'undefined') return

  const data = localStorage.getItem(SUBSCRIPTIONS_KEY)
  let subscriptions: UserSubscription[] = data ? JSON.parse(data) : []

  // Remove old subscription if exists
  subscriptions = subscriptions.filter((s) => s.id !== subscription.id)

  subscriptions.push(subscription)
  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions))
}

// Update subscription
export function updateSubscription(subscription: UserSubscription): void {
  createOrUpdateSubscription(subscription)
}

// Enroll user in program
export function enrollProgram(
  userId: string,
  programId: string
): { success: boolean; enrollment?: ProgramEnrollment; error?: string } {
  if (typeof window === 'undefined')
    return { success: false, error: 'Not available' }

  // Check if already enrolled
  if (isProgramEnrolled(userId, programId)) {
    return { success: false, error: 'Already enrolled in this program' }
  }

  const enrollment: ProgramEnrollment = {
    id: `enrollment_${userId}_${programId}_${Date.now()}`,
    userId,
    programId,
    enrolledAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    completedAt: null,
    progress: 0,
    sessionsCompleted: 0,
    totalSessions: 30,
  }

  const data = localStorage.getItem(ENROLLMENTS_KEY)
  let enrollments: ProgramEnrollment[] = data ? JSON.parse(data) : []

  enrollments.push(enrollment)
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments))

  return { success: true, enrollment }
}

// Check if user is enrolled in program
export function isProgramEnrolled(userId: string, programId: string): boolean {
  if (typeof window === 'undefined') return false

  const data = localStorage.getItem(ENROLLMENTS_KEY)
  const enrollments: ProgramEnrollment[] = data ? JSON.parse(data) : []

  return enrollments.some(
    (e) => e.userId === userId && e.programId === programId
  )
}

// Get user's program enrollment
export function getProgramEnrollment(
  userId: string,
  programId: string
): ProgramEnrollment | null {
  if (typeof window === 'undefined') return null

  const data = localStorage.getItem(ENROLLMENTS_KEY)
  const enrollments: ProgramEnrollment[] = data ? JSON.parse(data) : []

  return (
    enrollments.find(
      (e) => e.userId === userId && e.programId === programId
    ) || null
  )
}

// Get all user enrollments
export function getUserEnrollments(userId: string): ProgramEnrollment[] {
  if (typeof window === 'undefined') return []

  const data = localStorage.getItem(ENROLLMENTS_KEY)
  const enrollments: ProgramEnrollment[] = data ? JSON.parse(data) : []

  return enrollments.filter((e) => e.userId === userId)
}

// Update program enrollment progress
export function updateEnrollmentProgress(
  enrollmentId: string,
  progress: number,
  sessionsCompleted: number
): void {
  if (typeof window === 'undefined') return

  const data = localStorage.getItem(ENROLLMENTS_KEY)
  let enrollments: ProgramEnrollment[] = data ? JSON.parse(data) : []

  enrollments = enrollments.map((e) => {
    if (e.id === enrollmentId) {
      return {
        ...e,
        progress,
        sessionsCompleted,
        completedAt:
          progress >= 100 ? new Date().toISOString() : e.completedAt,
      }
    }
    return e
  })

  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments))
}

// Get or initialize program pricing
export function getProgramPricing(programId: string): ProgramPricing {
  if (typeof window === 'undefined') {
    return { programId, isPremium: false, price: 0, aiMonitoringFee: 9.99 }
  }

  const data = localStorage.getItem(PRICING_KEY)
  const pricings: ProgramPricing[] = data ? JSON.parse(data) : []

  return (
    pricings.find((p) => p.programId === programId) || {
      programId,
      isPremium: false,
      price: 0,
      aiMonitoringFee: 9.99,
    }
  )
}

// Set program pricing (admin only)
export function setProgramPricing(pricing: ProgramPricing): void {
  if (typeof window === 'undefined') return

  const data = localStorage.getItem(PRICING_KEY)
  let pricings: ProgramPricing[] = data ? JSON.parse(data) : []

  pricings = pricings.filter((p) => p.programId !== pricing.programId)
  pricings.push(pricing)

  localStorage.setItem(PRICING_KEY, JSON.stringify(pricings))
}

// Get all program pricings
export function getAllPricings(): ProgramPricing[] {
  if (typeof window === 'undefined') return []

  const data = localStorage.getItem(PRICING_KEY)
  return data ? JSON.parse(data) : []
}

// Process purchase
export function processPurchase(
  userId: string,
  programId: string,
  type: 'program' | 'ai-monitoring'
): { success: boolean; error?: string; subscription?: UserSubscription } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not available' }
  }

  const pricing = getProgramPricing(programId)

  if (type === 'program') {
    if (!pricing.isPremium) {
      // Enroll in free program
      const result = enrollProgram(userId, programId)
      return {
        success: result.success,
        error: result.error,
      }
    } else {
      // For premium programs, create subscription
      const subscription: UserSubscription = {
        id: `sub_${userId}_${programId}_${Date.now()}`,
        userId,
        type: 'ai-monitoring',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      createOrUpdateSubscription(subscription)
      enrollProgram(userId, programId)

      return { success: true, subscription }
    }
  }

  if (type === 'ai-monitoring') {
    // Create AI monitoring subscription
    const subscription: UserSubscription = {
      id: `ai_${userId}_${Date.now()}`,
      userId,
      type: 'ai-monitoring',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    createOrUpdateSubscription(subscription)

    return { success: true, subscription }
  }

  return { success: false, error: 'Invalid purchase type' }
}
