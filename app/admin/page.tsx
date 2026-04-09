'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isAdmin, getCurrentUser } from '@/lib/user-store'
import { getAdminStats, getUserActivityData, getProgramStats } from '@/lib/admin-store'
import { Users, Dumbbell, Zap, TrendingUp, Calendar, Activity } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [userActivity, setUserActivity] = useState<any[]>([])
  const [programStats, setProgramStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || !isAdmin()) {
      router.push('/login')
      return
    }

    // Load all stats
    const adminStats = getAdminStats()
    const userActivityData = getUserActivityData()
    const programs = getProgramStats()

    setStats(adminStats)
    setUserActivity(userActivityData)
    setProgramStats(programs)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back to FitVision Admin</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold mt-2">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="w-10 h-10 text-primary opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-3xl font-bold mt-2">{stats?.activeUsers || 0}</p>
                </div>
                <Activity className="w-10 h-10 text-accent opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Programs</p>
                  <p className="text-3xl font-bold mt-2">{stats?.totalPrograms || 0}</p>
                </div>
                <Dumbbell className="w-10 h-10 text-primary opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exercises</p>
                  <p className="text-3xl font-bold mt-2">{stats?.totalExercises || 0}</p>
                </div>
                <Zap className="w-10 h-10 text-accent opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Workout Sessions</p>
                  <p className="text-3xl font-bold mt-2">{stats?.totalWorkoutsSessions || 0}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary opacity-20" />
              </div>
            </Card>
          </div>

          {/* Recent Users Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-xl font-bold mb-4">Recent User Activity</h2>
              <div className="space-y-4">
                {userActivity.slice(0, 5).map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-semibold">{user.userName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{user.workoutsSessions} sessions</p>
                      <p className="text-xs text-muted-foreground">
                        Last active: {new Date(user.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full mt-4">
                  View All Users
                </Button>
              </Link>
            </Card>

            {/* Top Programs */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Top Programs</h2>
              <div className="space-y-3">
                {programStats.slice(0, 5).map((program, idx) => (
                  <div key={idx} className="pb-3 border-b border-border last:border-0">
                    <p className="font-semibold text-sm">{program.programName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(program.enrolledUsers / (stats?.totalUsers || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{program.enrolledUsers} users</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
