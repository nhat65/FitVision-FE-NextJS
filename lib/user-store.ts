"use client"

export interface UserProfile {
  id: string
  email: string
  name: string
  height: number // in cm
  weight: number // in kg
  fitnessLevel: "beginner" | "intermediate" | "advanced"
  fitnessGoal: "weight-loss" | "muscle-gain" | "endurance" | "flexibility"
  isAdmin?: boolean
  role?: string
  createdAt: string
}

const STORAGE_KEY = "fitvision_user"
const AUTH_KEY = "fitvision_auth"

// Get current user from localStorage
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null
  
  const authData = localStorage.getItem(AUTH_KEY)
  if (!authData) return null
  
  const { userId } = JSON.parse(authData)
  const usersData = localStorage.getItem(STORAGE_KEY)
  if (!usersData) return null
  
  const users: UserProfile[] = JSON.parse(usersData)
  return users.find(u => u.id === userId) || null
}

// Check if user is logged in
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(AUTH_KEY) !== null
}

// Check if current user is admin
export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

// Login user
export function loginUser(email: string, password: string): { success: boolean; error?: string; user?: UserProfile } {
  if (typeof window === "undefined") return { success: false, error: "Not available" }
  
  const usersData = localStorage.getItem(STORAGE_KEY)
  if (!usersData) {
    return { success: false, error: "Invalid email or password" }
  }
  
  const users: UserProfile[] = JSON.parse(usersData)
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  
  if (!user) {
    return { success: false, error: "Invalid email or password" }
  }
  
  // In a real app, we'd verify password hash here
  // For demo, we just check if the email exists
  const passwordsData = localStorage.getItem("fitvision_passwords")
  if (passwordsData) {
    const passwords: Record<string, string> = JSON.parse(passwordsData)
    if (passwords[user.id] !== password) {
      return { success: false, error: "Invalid email or password" }
    }
  }
  
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id, loggedInAt: new Date().toISOString() }))
  return { success: true, user }
}

// Initialize demo admin account if no users exist
// export function initializeDemoAdmin(): void {
//   if (typeof window === "undefined") return
  
//   const usersData = localStorage.getItem(STORAGE_KEY)
//   const users: UserProfile[] = usersData ? JSON.parse(usersData) : []
  
//   // Only initialize if no users exist
//   if (users.length === 0) {
//     const adminUser: UserProfile = {
//       id: "admin_demo",
//       email: "admin@fitvision.com",
//       name: "Admin User",
//       height: 175,
//       weight: 75,
//       fitnessLevel: "advanced",
//       fitnessGoal: "muscle-gain",
//       isAdmin: true,
//       role: 
//       createdAt: new Date().toISOString()
//     }
    
//     users.push(adminUser)
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
    
//     // Store demo admin password
//     const passwords: Record<string, string> = {}
//     passwords[adminUser.id] = "admin123"
//     localStorage.setItem("fitvision_passwords", JSON.stringify(passwords))
//   }
// }

// Register new user
// export function registerUser(data: {
//   email: string
//   password: string
//   name: string
//   height: number
//   weight: number
//   fitnessLevel: UserProfile["fitnessLevel"]
//   fitnessGoal: UserProfile["fitnessGoal"]
// }): { success: boolean; error?: string; user?: UserProfile } {
//   if (typeof window === "undefined") return { success: false, error: "Not available" }
  
//   const usersData = localStorage.getItem(STORAGE_KEY)
//   const users: UserProfile[] = usersData ? JSON.parse(usersData) : []
  
//   // Check if email already exists
//   if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
//     return { success: false, error: "Email already registered" }
//   }
  
//   const newUser: UserProfile = {
//     id: crypto.randomUUID(),
//     email: data.email,
//     name: data.name,
//     height: data.height,
//     weight: data.weight,
//     fitnessLevel: data.fitnessLevel,
//     fitnessGoal: data.fitnessGoal,
//     createdAt: new Date().toISOString()
//   }
  
//   users.push(newUser)
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  
//   // Store password separately (in real app, this would be hashed)
//   const passwordsData = localStorage.getItem("fitvision_passwords")
//   const passwords: Record<string, string> = passwordsData ? JSON.parse(passwordsData) : {}
//   passwords[newUser.id] = data.password
//   localStorage.setItem("fitvision_passwords", JSON.stringify(passwords))
  
//   // Auto login after registration
//   localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: newUser.id, loggedInAt: new Date().toISOString() }))
  
//   return { success: true, user: newUser }
// }

// Logout user
export function logoutUser(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_KEY)
}

// Calculate BMI
export function calculateBMI(height: number, weight: number): { value: number; category: string } {
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)
  
  let category = "Normal"
  if (bmi < 18.5) category = "Underweight"
  else if (bmi >= 18.5 && bmi < 25) category = "Normal"
  else if (bmi >= 25 && bmi < 30) category = "Overweight"
  else category = "Obese"
  
  return { value: Math.round(bmi * 10) / 10, category }
}

// Recommend workout program based on user profile
export function getRecommendedProgram(user: UserProfile): string {
  const bmi = calculateBMI(user.height, user.weight)
  
  // Weight loss focused
  if (user.fitnessGoal === "weight-loss") {
    if (user.fitnessLevel === "beginner") return "beginner-fundamentals"
    if (user.fitnessLevel === "intermediate") return "fat-burn-hiit"
    return "advanced-shred"
  }
  
  // Muscle gain focused
  if (user.fitnessGoal === "muscle-gain") {
    if (user.fitnessLevel === "beginner") return "beginner-fundamentals"
    if (user.fitnessLevel === "intermediate") return "strength-builder"
    return "muscle-mastery"
  }
  
  // Endurance focused
  if (user.fitnessGoal === "endurance") {
    if (user.fitnessLevel === "beginner") return "beginner-fundamentals"
    return "cardio-endurance"
  }
  
  // Flexibility focused
  if (user.fitnessGoal === "flexibility") {
    return "flexibility-mobility"
  }
  
  // Default based on BMI
  if (bmi.value >= 25) {
    return user.fitnessLevel === "beginner" ? "beginner-fundamentals" : "fat-burn-hiit"
  }
  
  return "beginner-fundamentals"
}

// Update user profile
export function updateUserProfile(updates: Partial<UserProfile>): { success: boolean; user?: UserProfile } {
  const currentUser = getCurrentUser()
  if (!currentUser) return { success: false }
  
  const usersData = localStorage.getItem(STORAGE_KEY)
  if (!usersData) return { success: false }
  
  const users: UserProfile[] = JSON.parse(usersData)
  const userIndex = users.findIndex(u => u.id === currentUser.id)
  
  if (userIndex === -1) return { success: false }
  
  users[userIndex] = { ...users[userIndex], ...updates }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  
  return { success: true, user: users[userIndex] }
}
