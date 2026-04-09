// Admin store for managing admin-related data and operations
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkoutsSessions: number;
  totalExercises: number;
  totalPrograms: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  email: string;
  lastActive: Date;
  workoutsSessions: number;
  currentProgram: string | null;
}

export interface ProgramStats {
  programId: string;
  programName: string;
  enrolledUsers: number;
  completionRate: number;
  averageRating: number;
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  timesPerformed: number;
  averageReps: number;
}

// Get admin stats
export function getAdminStats(): AdminStats {
  const users = getAllUsers();
  const programs = getAllPrograms();
  const exercises = getAllExercises();
  const progressData = getAllProgressData();

  const activeUsers = users.filter((u) => {
    const lastActive = getLastActiveDate(u.id);
    return lastActive && new Date().getTime() - lastActive.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
  }).length;

  return {
    totalUsers: users.length,
    activeUsers,
    totalWorkoutsSessions: progressData.reduce((acc, p) => acc + p.workoutSessions, 0),
    totalExercises: exercises.length,
    totalPrograms: programs.length,
  };
}

// Get user activity data
export function getUserActivityData(): UserActivity[] {
  const users = getAllUsers();
  return users.map((user) => {
    const progress = getProgressData(user.id);
    return {
      userId: user.id,
      userName: user.name,
      email: user.email,
      lastActive: getLastActiveDate(user.id) || new Date(),
      workoutsSessions: progress?.workoutSessions || 0,
      currentProgram: progress?.currentProgram || null,
    };
  });
}

// Get program statistics
export function getProgramStats(): ProgramStats[] {
  const programs = getAllPrograms();
  const users = getAllUsers();

  return programs.map((program) => {
    const enrolledUsers = users.filter((u) => {
      const progress = getProgressData(u.id);
      return progress?.currentProgram === program.id;
    }).length;

    const completedUsers = users.filter((u) => {
      const progress = getProgressData(u.id);
      return progress?.completedPrograms?.includes(program.id);
    }).length;

    const completionRate = enrolledUsers > 0 ? (completedUsers / enrolledUsers) * 100 : 0;

    return {
      programId: program.id,
      programName: program.name,
      enrolledUsers,
      completionRate,
      averageRating: 4.5, // Could be calculated from user ratings
    };
  });
}

// Get exercise statistics
export function getExerciseStats(): ExerciseStats[] {
  const exercises = getAllExercises();
  const progressData = getAllProgressData();

  return exercises.map((exercise) => {
    let totalPerformed = 0;
    let totalReps = 0;
    let performCount = 0;

    progressData.forEach((progress) => {
      if (progress.exercises) {
        const exerciseData = progress.exercises[exercise.id];
        if (exerciseData) {
          totalPerformed += exerciseData.reps || 0;
          totalReps += exerciseData.reps || 0;
          performCount += 1;
        }
      }
    });

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      timesPerformed: performCount,
      averageReps: performCount > 0 ? Math.round(totalReps / performCount) : 0,
    };
  });
}

// Helper functions to get data from localStorage
function getAllUsers() {
  const data = localStorage.getItem("users");
  return data ? JSON.parse(data) : [];
}

function getAllPrograms() {
  const data = localStorage.getItem("programs");
  return data ? JSON.parse(data) : [];
}

function getAllExercises() {
  const data = localStorage.getItem("exercises");
  return data ? JSON.parse(data) : [];
}

function getAllProgressData() {
  const data = localStorage.getItem("progress");
  return data ? JSON.parse(data) : [];
}

function getProgressData(userId: string) {
  const progressData = getAllProgressData();
  return progressData.find((p: any) => p.userId === userId);
}

function getLastActiveDate(userId: string): Date | null {
  const activityData = localStorage.getItem(`activity_${userId}`);
  if (activityData) {
    return new Date(JSON.parse(activityData).lastActive);
  }
  return null;
}

// Admin action: Delete user
export function deleteUser(userId: string) {
  const users = getAllUsers();
  const filtered = users.filter((u: any) => u.id !== userId);
  localStorage.setItem("users", JSON.stringify(filtered));
}

// Admin action: Update program
export function updateProgram(programId: string, updates: any) {
  const programs = getAllPrograms();
  const updated = programs.map((p: any) => (p.id === programId ? { ...p, ...updates } : p));
  localStorage.setItem("programs", JSON.stringify(updated));
}

// Admin action: Delete program
export function deleteProgram(programId: string) {
  const programs = getAllPrograms();
  const filtered = programs.filter((p: any) => p.id !== programId);
  localStorage.setItem("programs", JSON.stringify(filtered));
}

// Admin action: Add new exercise
export function addExercise(exercise: any) {
  const exercises = getAllExercises();
  const newExercise = {
    id: `exercise_${Date.now()}`,
    ...exercise,
    createdAt: new Date().toISOString(),
  };
  exercises.push(newExercise);
  localStorage.setItem("exercises", JSON.stringify(exercises));
  return newExercise;
}

// Admin action: Update exercise
export function updateExercise(exerciseId: string, updates: any) {
  const exercises = getAllExercises();
  const updated = exercises.map((e: any) => (e.id === exerciseId ? { ...e, ...updates } : e));
  localStorage.setItem("exercises", JSON.stringify(updated));
}

// Admin action: Delete exercise
export function deleteExercise(exerciseId: string) {
  const exercises = getAllExercises();
  const filtered = exercises.filter((e: any) => e.id !== exerciseId);
  localStorage.setItem("exercises", JSON.stringify(filtered));
}
