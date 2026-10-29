import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

// --- Types ---

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPrograms: number;
  totalExercises: number;
  totalWorkoutsSessions: number;
}

export interface UserActivity {
  userName: string;
  email: string;
  workoutsSessions: number;
  lastActive: string;
}

export interface ProgramStat {
  programName: string;
  enrolledUsers: number;
}

export interface DashboardData extends DashboardStats {
  recentActivity: UserActivity[];
  topPrograms: ProgramStat[];
}

// --- Analytics Types ---

export interface AnalyticsStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkoutsSessions: number;
}

export interface AnalyticsUserActivity {
  userName: string;
  email: string;
  workoutsSessions: number;
  currentProgram: string | null;
  lastActive: string;
}

export interface AnalyticsProgramStat {
  programName: string;
  enrolledUsers: number;
  completionRate: number;
  averageRating: number;
}

export interface AnalyticsExerciseStat {
  exerciseName: string;
  timesPerformed: number;
  averageReps: number;
}

export interface AnalyticsData {
  stats: AnalyticsStats;
  userActivity: AnalyticsUserActivity[];
  programs: AnalyticsProgramStat[];
  exercises: AnalyticsExerciseStat[];
}

// --- Hooks ---

/** Lấy thống kê tổng quan admin dashboard */
export function useAdminDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: () => fetchApi('/admin/dashboard-stats'),
  });
}

/** Lấy dữ liệu analytics chi tiết */
export function useAdminAnalytics(params?: {
  activityLimit?: number;
  programLimit?: number;
  exerciseLimit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.activityLimit != null) searchParams.set('activityLimit', String(params.activityLimit));
  if (params?.programLimit != null) searchParams.set('programLimit', String(params.programLimit));
  if (params?.exerciseLimit != null) searchParams.set('exerciseLimit', String(params.exerciseLimit));

  const query = searchParams.toString();
  const url = query ? `/admin/analytics?${query}` : '/admin/analytics';

  return useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics', params],
    queryFn: () => fetchApi(url),
  });
}

