"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card } from "@/components/ui/card";
import { isAdmin, getCurrentUser } from "@/lib/user-store";
import { TrendingUp, Users, Zap, Target } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/useAdmin";

export default function AnalyticsDashboard() {
  const router = useRouter();

  // Kiểm tra quyền admin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !isAdmin()) {
      router.push("/login");
    }
  }, [router]);

  const { data: analyticsData, isLoading, isError, error } = useAdminAnalytics();

  // Tính toán các giá trị dẫn xuất
  const derived = useMemo(() => {
    if (!analyticsData) return null;

    const { stats, programs, exercises } = analyticsData;

    const engagementRate =
      stats.totalUsers > 0
        ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
        : 0;

    const avgSessionPerUser =
      stats.totalUsers > 0
        ? Math.round(stats.totalWorkoutsSessions / stats.totalUsers)
        : 0;

    const avgCompletionRate =
      programs.length > 0
        ? Math.round(programs.reduce((a, p) => a + p.completionRate, 0) / programs.length)
        : 0;

    const avgPerforms =
      exercises.length > 0
        ? Math.round(exercises.reduce((a, e) => a + e.timesPerformed, 0) / exercises.length)
        : 0;

    const topPrograms = programs.slice(0, 3);

    const topExercises = [...exercises]
      .sort((a, b) => b.timesPerformed - a.timesPerformed)
      .slice(0, 5);

    return { engagementRate, avgSessionPerUser, avgCompletionRate, avgPerforms, topPrograms, topExercises };
  }, [analyticsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">{(error as Error)?.message || "Failed to load analytics data"}</p>
      </div>
    );
  }

  if (!analyticsData || !derived) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const { stats, userActivity, programs, exercises } = analyticsData;
  const { engagementRate, avgSessionPerUser, avgCompletionRate, avgPerforms, topPrograms, topExercises } = derived;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive insights and metrics
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Engagement Rate
                  </p>
                  <p className="text-3xl font-bold mt-2">{engagementRate}%</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.activeUsers} of {stats.totalUsers} users active
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avg Sessions/User
                  </p>
                  <p className="text-3xl font-bold mt-2">{avgSessionPerUser}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.totalWorkoutsSessions} total sessions
                  </p>
                </div>
                <Users className="w-10 h-10 text-accent opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Program Completion
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {avgCompletionRate}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {programs.length} programs
                  </p>
                </div>
                <Target className="w-10 h-10 text-primary opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Exercise Library
                  </p>
                  <p className="text-3xl font-bold mt-2">{exercises.length}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {avgPerforms} avg performs
                  </p>
                </div>
                <Zap className="w-10 h-10 text-accent opacity-20" />
              </div>
            </Card>
          </div>

          {/* Top Programs and Exercises */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Programs */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Top Programs</h2>
              <div className="space-y-4">
                {topPrograms.map((program, idx) => (
                  <div
                    key={idx}
                    className="pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{program.programName}</h3>
                      <span className="text-sm font-bold text-primary">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Enrolled Users
                        </span>
                        <span className="font-semibold">
                          {program.enrolledUsers}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Completion Rate
                        </span>
                        <span className="font-semibold">
                          {Math.round(program.completionRate)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rating</span>
                        <span className="font-semibold">
                          {program.averageRating != null ? (
                            <>
                              {"★".repeat(Math.floor(program.averageRating))}(
                              {program.averageRating.toFixed(1)})
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              No rating
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Most Used Exercises */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Most Used Exercises</h2>
              <div className="space-y-4">
                {topExercises.map((exercise, idx) => (
                  <div
                    key={idx}
                    className="pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{exercise.exerciseName}</h3>
                      <span className="text-sm font-bold text-accent">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Times Performed
                        </span>
                        <span className="font-semibold">
                          {exercise.timesPerformed}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Average Reps
                        </span>
                        <span className="font-semibold">
                          {exercise.averageReps}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.min(
                                (exercise.timesPerformed / 100) * 100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* User Activity Summary */}
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-bold mb-6">Recent User Activity</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm font-semibold p-3">
                      User
                    </th>
                    <th className="text-left text-sm font-semibold p-3">
                      Email
                    </th>
                    <th className="text-left text-sm font-semibold p-3">
                      Sessions
                    </th>
                    <th className="text-left text-sm font-semibold p-3">
                      Current Program
                    </th>
                    <th className="text-left text-sm font-semibold p-3">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userActivity.slice(0, 10).map((user, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border last:border-0"
                    >
                      <td className="p-3 font-semibold text-sm">
                        {user.userName}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="p-3 text-sm font-semibold">
                        {user.workoutsSessions}
                      </td>
                      <td className="p-3 text-sm">
                        {user.currentProgram ? (
                          <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs">
                            {user.currentProgram}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
