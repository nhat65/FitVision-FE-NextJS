export type DifficultyLevel = "beginner" | "intermediate" | "advanced"

export interface Exercise {
  id: string
  name: string
  description: string
  muscleGroups: string[]
  difficulty: DifficultyLevel
  instructions: string[]
  reps?: string
  sets?: number
  duration?: string
  restTime: number // seconds
  videoUrl?: string
  thumbnailUrl?: string
}

export interface DayWorkout {
  day: number
  name: string
  exercises: Exercise[]
  isRestDay?: boolean
  focusArea?: string
}

export interface WorkoutProgram {
  id: string
  name: string
  description: string
  difficulty: DifficultyLevel
  totalDays: number
  durationPerSession: string
  caloriesPerSession: number
  schedule: DayWorkout[]
  category: "strength" | "cardio" | "flexibility" | "full-body"
  imageUrl?: string
  goals: string[]
  isPremium?: boolean
  price?: number
  aiMonitoringFee?: number
}

export const exercises: Exercise[] = [
  {
    id: "push-up",
    name: "Push-up",
    description: "Basic exercise for chest, shoulders and triceps",
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    difficulty: "beginner",
    instructions: [
      "Lie face down, hands wider than shoulder-width",
      "Keep body straight from head to heels",
      "Lower body until chest nearly touches floor",
      "Push body up to starting position",
    ],
    reps: "10-15 reps",
    sets: 3,
    restTime: 60,
  },
  {
    id: "squat",
    name: "Squat",
    description: "Basic exercise for legs and glutes",
    muscleGroups: ["Quadriceps", "Glutes", "Core"],
    difficulty: "beginner",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Lower body as if sitting on a chair, keep back straight",
      "Knees should not extend past toes",
      "Push body up to starting position",
    ],
    reps: "15-20 reps",
    sets: 3,
    restTime: 60,
  },
  {
    id: "plank",
    name: "Plank",
    description: "Core exercise to strengthen abdominal muscles",
    muscleGroups: ["Core", "Shoulders", "Back"],
    difficulty: "beginner",
    instructions: [
      "Lie face down, support on hands or forearms",
      "Keep body straight from head to heels",
      "Tighten core muscles",
      "Hold position for specified time",
    ],
    duration: "30-60 seconds",
    sets: 3,
    restTime: 45,
  },
  {
    id: "burpee",
    name: "Burpee",
    description: "Full body exercise that burns lots of calories",
    muscleGroups: ["Full Body"],
    difficulty: "intermediate",
    instructions: [
      "Stand straight, then squat down",
      "Place hands on floor, jump feet back into push-up position",
      "Perform one push-up",
      "Jump feet forward, then jump up high",
    ],
    reps: "8-12 reps",
    sets: 3,
    restTime: 90,
  },
  {
    id: "lunge",
    name: "Lunge",
    description: "Leg exercise that improves balance",
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
    difficulty: "beginner",
    instructions: [
      "Stand straight, step one foot forward",
      "Lower body until back knee nearly touches floor",
      "Front knee should not extend past toes",
      "Push body up and switch legs",
    ],
    reps: "10 reps each leg",
    sets: 3,
    restTime: 60,
  },
  {
    id: "mountain-climber",
    name: "Mountain Climber",
    description: "Cardio exercise combined with core work",
    muscleGroups: ["Core", "Shoulders", "Legs"],
    difficulty: "intermediate",
    instructions: [
      "Start in push-up position",
      "Pull right knee to chest",
      "Quickly switch legs, pull left knee up",
      "Continue alternating quickly like running",
    ],
    duration: "30-45 seconds",
    sets: 3,
    restTime: 60,
  },
  {
    id: "diamond-pushup",
    name: "Diamond Push-up",
    description: "Advanced exercise for triceps",
    muscleGroups: ["Triceps", "Chest", "Shoulders"],
    difficulty: "intermediate",
    instructions: [
      "Push-up position with hands forming diamond shape",
      "Lower body, keep elbows close to body",
      "Push body up to starting position",
      "Keep core tight throughout exercise",
    ],
    reps: "8-12 reps",
    sets: 3,
    restTime: 75,
  },
  {
    id: "pistol-squat",
    name: "Pistol Squat",
    description: "Single leg squat, advanced exercise",
    muscleGroups: ["Quadriceps", "Glutes", "Core"],
    difficulty: "advanced",
    instructions: [
      "Stand on one leg, other leg extended straight forward",
      "Slowly lower body, keep back straight",
      "Go as low as possible",
      "Push body up using one leg",
    ],
    reps: "5-8 reps each leg",
    sets: 3,
    restTime: 90,
  },
  {
    id: "handstand-pushup",
    name: "Handstand Push-up",
    description: "Super advanced exercise for shoulders and arms",
    muscleGroups: ["Shoulders", "Triceps", "Core"],
    difficulty: "advanced",
    instructions: [
      "Handstand against wall",
      "Lower head nearly to floor",
      "Push body up to starting position",
      "Keep core tight for balance",
    ],
    reps: "3-8 reps",
    sets: 3,
    restTime: 120,
  },
  {
    id: "jump-squat",
    name: "Jump Squat",
    description: "Squat combined with jump, increases explosiveness",
    muscleGroups: ["Quadriceps", "Glutes", "Calves"],
    difficulty: "intermediate",
    instructions: [
      "Perform regular squat",
      "When rising, use force to jump high",
      "Land softly with slightly bent knees",
      "Immediately perform next rep",
    ],
    reps: "12-15 reps",
    sets: 3,
    restTime: 75,
  },
  {
    id: "glute-bridge",
    name: "Glute Bridge",
    description: "Strengthen glutes and lower back",
    muscleGroups: ["Glutes", "Hamstrings", "Core"],
    difficulty: "beginner",
    instructions: [
      "Lie on back with knees bent, feet flat on floor",
      "Push hips up by squeezing glutes",
      "Hold at top for 2 seconds",
      "Lower back down slowly",
    ],
    reps: "15-20 reps",
    sets: 3,
    restTime: 45,
  },
  {
    id: "superman",
    name: "Superman",
    description: "Strengthen lower back and posterior chain",
    muscleGroups: ["Lower Back", "Glutes", "Shoulders"],
    difficulty: "beginner",
    instructions: [
      "Lie face down with arms extended forward",
      "Lift arms, chest and legs off the ground",
      "Hold for 2-3 seconds",
      "Lower back down with control",
    ],
    reps: "10-15 reps",
    sets: 3,
    restTime: 45,
  },
]

// Helper function to generate 30-day schedule
function generateSchedule(
  exercises: Exercise[],
  focusAreas: string[],
  restDays: number[] = [7, 14, 21, 28]
): DayWorkout[] {
  const schedule: DayWorkout[] = []
  
  for (let day = 1; day <= 30; day++) {
    if (restDays.includes(day)) {
      schedule.push({
        day,
        name: "Rest Day",
        exercises: [],
        isRestDay: true,
      })
    } else {
      const focusIndex = (day - 1) % focusAreas.length
      const focusArea = focusAreas[focusIndex]
      const dayExercises = exercises.filter(
        (e, i) => i % focusAreas.length === focusIndex || e.muscleGroups.includes("Full Body") || e.muscleGroups.includes("Core")
      ).slice(0, 4)
      
      schedule.push({
        day,
        name: `Day ${day} - ${focusArea}`,
        exercises: dayExercises,
        focusArea,
      })
    }
  }
  
  return schedule
}

export const workoutPrograms: WorkoutProgram[] = [
  {
    id: "beginner-full-body-30",
    name: "30-Day Beginner Foundation",
    description: "A comprehensive 30-day program designed for beginners. Build a solid fitness foundation with progressive bodyweight exercises. Perfect for those just starting their fitness journey.",
    difficulty: "beginner",
    totalDays: 30,
    durationPerSession: "20-25 min",
    caloriesPerSession: 150,
    category: "full-body",
    goals: [
      "Build basic strength",
      "Learn proper form",
      "Establish workout habit",
      "Improve flexibility",
    ],
    schedule: generateSchedule(
      [
        exercises.find(e => e.id === "squat")!,
        exercises.find(e => e.id === "push-up")!,
        exercises.find(e => e.id === "lunge")!,
        exercises.find(e => e.id === "plank")!,
        exercises.find(e => e.id === "glute-bridge")!,
        exercises.find(e => e.id === "superman")!,
      ],
      ["Lower Body", "Upper Body", "Core & Balance"]
    ),
  },
  {
    id: "hiit-cardio-30",
    name: "30-Day HIIT Fat Burn",
    description: "High intensity interval training program to maximize fat burning over 30 days. Short but intense workouts that boost metabolism and improve cardiovascular health.",
    difficulty: "intermediate",
    totalDays: 30,
    durationPerSession: "15-20 min",
    caloriesPerSession: 250,
    category: "cardio",
    goals: [
      "Burn fat effectively",
      "Boost metabolism",
      "Improve endurance",
      "Increase energy levels",
    ],
    schedule: generateSchedule(
      [
        exercises.find(e => e.id === "burpee")!,
        exercises.find(e => e.id === "mountain-climber")!,
        exercises.find(e => e.id === "jump-squat")!,
        exercises.find(e => e.id === "squat")!,
        exercises.find(e => e.id === "plank")!,
        exercises.find(e => e.id === "lunge")!,
      ],
      ["Full Body HIIT", "Lower Body HIIT", "Core HIIT"],
      [7, 14, 21, 28]
    ),
  },
  {
    id: "upper-body-30",
    name: "30-Day Upper Body Strength",
    description: "Focus on developing chest, shoulder and arm muscles with progressive bodyweight exercises. Build a strong and defined upper body in just 30 days.",
    difficulty: "intermediate",
    totalDays: 30,
    durationPerSession: "25-30 min",
    caloriesPerSession: 180,
    category: "strength",
    goals: [
      "Build upper body strength",
      "Improve push-up capacity",
      "Define arm muscles",
      "Strengthen shoulders",
    ],
    schedule: generateSchedule(
      [
        exercises.find(e => e.id === "push-up")!,
        exercises.find(e => e.id === "diamond-pushup")!,
        exercises.find(e => e.id === "plank")!,
        exercises.find(e => e.id === "mountain-climber")!,
        exercises.find(e => e.id === "superman")!,
      ],
      ["Chest Focus", "Triceps Focus", "Shoulders & Core"],
      [7, 14, 21, 28]
    ),
  },
  {
    id: "lower-body-30",
    name: "30-Day Lower Body Power",
    description: "Leg and glute focused program that increases strength, power, and endurance. Transform your lower body with progressive overload principles.",
    difficulty: "intermediate",
    totalDays: 30,
    durationPerSession: "25-30 min",
    caloriesPerSession: 220,
    category: "strength",
    goals: [
      "Build leg strength",
      "Tone glutes",
      "Improve jumping power",
      "Enhance balance",
    ],
    schedule: generateSchedule(
      [
        exercises.find(e => e.id === "squat")!,
        exercises.find(e => e.id === "lunge")!,
        exercises.find(e => e.id === "jump-squat")!,
        exercises.find(e => e.id === "glute-bridge")!,
        exercises.find(e => e.id === "plank")!,
      ],
      ["Quad Focus", "Glute Focus", "Power & Explosiveness"],
      [7, 14, 21, 28]
    ),
  },
  {
    id: "advanced-calisthenics-30",
    name: "30-Day Advanced Calisthenics",
    description: "Challenge yourself with this advanced 30-day program. For those with a solid fitness foundation looking to master advanced bodyweight movements.",
    difficulty: "advanced",
    totalDays: 30,
    durationPerSession: "35-45 min",
    caloriesPerSession: 300,
    category: "strength",
    goals: [
      "Master advanced movements",
      "Build functional strength",
      "Improve body control",
      "Achieve new skills",
    ],
    schedule: generateSchedule(
      [
        exercises.find(e => e.id === "pistol-squat")!,
        exercises.find(e => e.id === "handstand-pushup")!,
        exercises.find(e => e.id === "diamond-pushup")!,
        exercises.find(e => e.id === "burpee")!,
        exercises.find(e => e.id === "jump-squat")!,
        exercises.find(e => e.id === "plank")!,
      ],
      ["Skill Work", "Strength", "Power & Conditioning"],
      [7, 14, 21, 28]
    ),
  },
  {
    id: "core-crusher-30",
    name: "30-Day Core Crusher",
    description: "Focused core training program to strengthen your abs, obliques, and lower back. Build a strong foundation for all other exercises.",
    difficulty: "intermediate",
    totalDays: 30,
    durationPerSession: "20-25 min",
    caloriesPerSession: 160,
    category: "strength",
    goals: [
      "Strengthen core muscles",
      "Improve posture",
      "Build visible abs",
      "Reduce back pain",
    ],
    schedule: generateSchedule(
      [
        exercises.find(e => e.id === "plank")!,
        exercises.find(e => e.id === "mountain-climber")!,
        exercises.find(e => e.id === "superman")!,
        exercises.find(e => e.id === "glute-bridge")!,
        exercises.find(e => e.id === "burpee")!,
      ],
      ["Front Core", "Rotational Core", "Posterior Chain"],
      [7, 14, 21, 28]
    ),
  },
]

export const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: "bg-green-500/20 text-green-400 border-green-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
}

export const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}
