"use client"

// Progress data types
export interface WorkoutSession {
  id: string
  date: string
  workoutId: string
  workoutName: string
  duration: number // in seconds
  calories: number
  exercises: ExerciseSession[]
}

export interface ExerciseSession {
  exerciseId: string
  exerciseName: string
  reps: number
  sets: number
  formScore: number // 0-100
}

export interface UserProgress {
  totalWorkouts: number
  totalMinutes: number
  totalCalories: number
  currentStreak: number
  longestStreak: number
  weeklyGoal: number
  workoutsThisWeek: number
  sessions: WorkoutSession[]
}

const STORAGE_KEY = "fitvision_progress"

// Get default progress
function getDefaultProgress(): UserProgress {
  return {
    totalWorkouts: 0,
    totalMinutes: 0,
    totalCalories: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyGoal: 5,
    workoutsThisWeek: 0,
    sessions: [],
  }
}

// Load progress from localStorage
export function loadProgress(): UserProgress {
  if (typeof window === "undefined") {
    return getDefaultProgress()
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error("Failed to load progress:", e)
  }
  
  return getDefaultProgress()
}

// Save progress to localStorage
export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (e) {
    console.error("Failed to save progress:", e)
  }
}

// Add a workout session
export function addWorkoutSession(session: Omit<WorkoutSession, "id">): UserProgress {
  const progress = loadProgress()
  
  const newSession: WorkoutSession = {
    ...session,
    id: Date.now().toString(),
  }
  
  // Calculate streak
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const lastWorkoutDate = progress.sessions.length > 0 
    ? new Date(progress.sessions[progress.sessions.length - 1].date).toDateString()
    : null
  
  let newStreak = progress.currentStreak
  if (lastWorkoutDate === yesterday || lastWorkoutDate === today) {
    if (lastWorkoutDate !== today) {
      newStreak += 1
    }
  } else {
    newStreak = 1
  }
  
  // Calculate workouts this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  
  const workoutsThisWeek = progress.sessions.filter(s => 
    new Date(s.date) >= weekStart
  ).length + 1
  
  const updatedProgress: UserProgress = {
    ...progress,
    totalWorkouts: progress.totalWorkouts + 1,
    totalMinutes: progress.totalMinutes + Math.round(session.duration / 60),
    totalCalories: progress.totalCalories + session.calories,
    currentStreak: newStreak,
    longestStreak: Math.max(progress.longestStreak, newStreak),
    workoutsThisWeek,
    sessions: [...progress.sessions, newSession].slice(-50), // Keep last 50 sessions
  }
  
  saveProgress(updatedProgress)
  return updatedProgress
}

// Get weekly stats
export function getWeeklyStats(progress: UserProgress): { day: string; workouts: number; calories: number }[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)
  
  const stats = days.map((day, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    const dateStr = date.toDateString()
    
    const daySessions = progress.sessions.filter(s => 
      new Date(s.date).toDateString() === dateStr
    )
    
    return {
      day,
      workouts: daySessions.length,
      calories: daySessions.reduce((sum, s) => sum + s.calories, 0),
    }
  })
  
  return stats
}

// Get monthly progress
export function getMonthlyProgress(progress: UserProgress): { week: string; minutes: number }[] {
  const weeks: { week: string; minutes: number }[] = []
  const today = new Date()
  
  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() - (i * 7))
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    
    const weekSessions = progress.sessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= weekStart && sessionDate <= weekEnd
    })
    
    const minutes = weekSessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0)
    
    weeks.push({
      week: `Week ${4 - i}`,
      minutes,
    })
  }
  
  return weeks
}

// Generate demo data for preview
export function generateDemoData(): UserProgress {
  const sessions: WorkoutSession[] = []
  const today = new Date()
  
  // Generate some sessions over the past 2 weeks
  for (let i = 14; i >= 0; i--) {
    if (Math.random() > 0.4) { // 60% chance of workout each day
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      
      sessions.push({
        id: `demo-${i}`,
        date: date.toISOString(),
        workoutId: "demo",
        workoutName: ["Full Body", "HIIT Cardio", "Upper Body"][Math.floor(Math.random() * 3)],
        duration: 900 + Math.floor(Math.random() * 1200), // 15-35 minutes
        calories: 100 + Math.floor(Math.random() * 200),
        exercises: [
          {
            exerciseId: "push-up",
            exerciseName: "Push-up",
            reps: 30 + Math.floor(Math.random() * 20),
            sets: 3,
            formScore: 75 + Math.floor(Math.random() * 25),
          },
        ],
      })
    }
  }
  
  const totalWorkouts = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0)
  const totalCalories = sessions.reduce((sum, s) => sum + s.calories, 0)
  
  return {
    totalWorkouts,
    totalMinutes,
    totalCalories,
    currentStreak: 5,
    longestStreak: 7,
    weeklyGoal: 5,
    workoutsThisWeek: 3,
    sessions,
  }
}
