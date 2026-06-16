"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Flame,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Zap,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { getAccessToken } from "@/lib/auth-store"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryData {
  totalWorkouts: number
  totalMinutes: number
  totalCalories: number
  workoutsThisWeek: number
}

interface WeeklyStatItem {
  day: string
  workouts: number
  calories: number
}

interface MonthlyStatItem {
  week: string
  minutes: number
}

interface SessionItem {
  id: string
  date: string
  workoutId: string
  workoutName: string
  duration: number   // seconds
  calories: number
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

/** Trả về ISO date string của ngày đầu tuần hiện tại (Monday), dạng YYYY-MM-DD */
function getCurrentWeek(): string {
  const now = new Date()
  const day = now.getDay() // 0 = Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // về Monday
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split("T")[0] // "YYYY-MM-DD"
}

function authHeaders(): HeadersInit {
  const token = getAccessToken()
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

async function fetchSummary(): Promise<SummaryData> {
  const res = await fetch(`${BASE_URL}/api/user-progress/summary`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error("Failed to fetch summary")
  const json = await res.json()
  return json.data as SummaryData
}

async function fetchWeeklyStats(): Promise<WeeklyStatItem[]> {
  const week = getCurrentWeek()
  const res = await fetch(`${BASE_URL}/api/user-progress/weekly-stats?week=${week}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error("Failed to fetch weekly stats")
  const json = await res.json()
  return json.data as WeeklyStatItem[]
}

async function fetchMonthlyStats(): Promise<MonthlyStatItem[]> {
  const res = await fetch(`${BASE_URL}/api/user-progress/monthly-stats`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error("Failed to fetch monthly stats")
  const json = await res.json()
  return json.data as MonthlyStatItem[]
}

async function fetchRecentSessions(): Promise<SessionItem[]> {
  const res = await fetch(`${BASE_URL}/api/user-progress/top-5-recent`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error("Failed to fetch recent sessions")
  const json = await res.json()
  return json.data as SessionItem[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconColor = "text-primary",
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  iconColor?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-secondary ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WeeklyChart({ data }: { data: WeeklyStatItem[] }) {
  const maxCalories = Math.max(...data.map((d) => d.calories), 1)
  const todayIndex = new Date().getDay()

  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((item, index) => {
        const height = item.calories > 0 ? (item.calories / maxCalories) * 100 : 5
        const isToday = index === todayIndex

        return (
          <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
            <div
              className={`w-full rounded-t-md transition-all duration-300 ${
                item.workouts > 0 ? "bg-primary" : "bg-secondary"
              } ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              style={{ height: `${height}%`, minHeight: "8px" }}
            />
            <span
              className={`text-xs ${
                isToday ? "font-bold text-primary" : "text-muted-foreground"
              }`}
            >
              {item.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MonthlyChart({ data }: { data: MonthlyStatItem[] }) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1)

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = item.minutes > 0 ? (item.minutes / maxMinutes) * 100 : 0

        return (
          <div key={item.week} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.week}</span>
              <span className="font-medium">{Math.ceil(item.minutes / 60)} min</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RecentWorkouts({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No workouts yet</p>
        <Button asChild>
          <Link href="/workouts">Start Training</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const date = new Date(session.date)
        const formattedDate = date.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })

        return (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{session.workoutName}</p>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{Math.round(session.duration / 60)} min</p>
              <p className="text-sm text-muted-foreground">{session.calories} kcal</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatItem[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatItem[]>([])
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true)
        const [summaryRes, weeklyRes, monthlyRes, sessionsRes] = await Promise.all([
          fetchSummary(),
          fetchWeeklyStats(),
          fetchMonthlyStats(),
          fetchRecentSessions(),
        ])
        setSummary(summaryRes)
        setWeeklyStats(weeklyRes)
        setMonthlyStats(monthlyRes)
        setSessions(sessionsRes)
      } catch (err) {
        console.error(err)
        setError("Failed to load progress data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error ?? "Something went wrong."}</p>
      </div>
    )
  }

  const goalProgress = Math.min(
    (summary.workoutsThisWeek / 5) * 100, // weeklyGoal mặc định 5, điều chỉnh nếu BE trả về
    100
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your Progress
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track your fitness journey and achieve your goals
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Target}
              label="Total Workouts"
              value={summary.totalWorkouts}
              subtext="sessions"
            />
            <StatCard
              icon={Clock}
              label="Training Time"
              value={summary.totalMinutes}
              subtext="minutes"
              iconColor="text-blue-500"
            />
            <StatCard
              icon={Flame}
              label="Calories Burned"
              value={summary.totalCalories.toLocaleString()}
              subtext="kcal"
              iconColor="text-orange-500"
            />
            <StatCard
              icon={TrendingUp}
              label="This Week"
              value={summary.workoutsThisWeek}
              subtext="workouts"
              iconColor="text-green-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Weekly goal */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Weekly Goal
                </CardTitle>
                <CardDescription>
                  {summary.workoutsThisWeek} / 5 workouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(goalProgress)}%</span>
                  </div>
                  <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${goalProgress}%` }}
                    />
                  </div>
                </div>
                <WeeklyChart data={weeklyStats} />
              </CardContent>
            </Card>

            {/* Monthly progress */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Progress</CardTitle>
                <CardDescription>Training time in the last 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyChart data={monthlyStats} />
              </CardContent>
            </Card>

            {/* Recent workouts */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Workouts</CardTitle>
                  <CardDescription>Your last 5 training sessions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/workouts">
                    Continue
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <RecentWorkouts sessions={sessions} />
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}