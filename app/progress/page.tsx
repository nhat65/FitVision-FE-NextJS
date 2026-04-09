"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  loadProgress, 
  getWeeklyStats, 
  getMonthlyProgress,
  generateDemoData,
  type UserProgress 
} from "@/lib/progress-store"
import {
  Flame,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Zap,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  iconColor = "text-primary"
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

function WeeklyChart({ data }: { data: { day: string; workouts: number; calories: number }[] }) {
  const maxCalories = Math.max(...data.map(d => d.calories), 1)
  
  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((item, index) => {
        const height = item.calories > 0 ? (item.calories / maxCalories) * 100 : 5
        const isToday = index === new Date().getDay()
        
        return (
          <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className={`w-full rounded-t-md transition-all duration-300 ${
                item.workouts > 0 
                  ? "bg-primary" 
                  : "bg-secondary"
              } ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              style={{ height: `${height}%`, minHeight: "8px" }}
            />
            <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
              {item.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MonthlyChart({ data }: { data: { week: string; minutes: number }[] }) {
  const maxMinutes = Math.max(...data.map(d => d.minutes), 1)
  
  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = item.minutes > 0 ? (item.minutes / maxMinutes) * 100 : 0
        
        return (
          <div key={item.week} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.week}</span>
              <span className="font-medium">{item.minutes} min</span>
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

function RecentWorkouts({ sessions }: { sessions: UserProgress["sessions"] }) {
  const recentSessions = sessions.slice(-5).reverse()
  
  if (recentSessions.length === 0) {
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
      {recentSessions.map((session) => {
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

export default function ProgressPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const loadedProgress = loadProgress()
    // If no real data, show demo data
    if (loadedProgress.totalWorkouts === 0) {
      setProgress(generateDemoData())
      setIsDemo(true)
    } else {
      setProgress(loadedProgress)
      setIsDemo(false)
    }
  }, [])

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const weeklyStats = getWeeklyStats(progress)
  const monthlyProgress = getMonthlyProgress(progress)
  const goalProgress = Math.min((progress.workoutsThisWeek / progress.weeklyGoal) * 100, 100)

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
            {isDemo && (
              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-primary">
                  This is demo data. Start training to track your real progress!
                </p>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon={Target}
              label="Total Workouts"
              value={progress.totalWorkouts}
              subtext="sessions"
            />
            <StatCard 
              icon={Clock}
              label="Training Time"
              value={progress.totalMinutes}
              subtext="minutes"
              iconColor="text-blue-500"
            />
            <StatCard 
              icon={Flame}
              label="Calories Burned"
              value={progress.totalCalories.toLocaleString()}
              subtext="kcal"
              iconColor="text-orange-500"
            />
            <StatCard 
              icon={TrendingUp}
              label="Current Streak"
              value={progress.currentStreak}
              subtext={`Best: ${progress.longestStreak} days`}
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
                  {progress.workoutsThisWeek} / {progress.weeklyGoal} workouts
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

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    progress.totalWorkouts >= 1 ? "bg-primary/10" : "bg-secondary"
                  }`}>
                    <div className={`p-2 rounded-full ${
                      progress.totalWorkouts >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">First Workout</p>
                      <p className="text-xs text-muted-foreground">Complete 1 workout</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    progress.currentStreak >= 3 ? "bg-primary/10" : "bg-secondary"
                  }`}>
                    <div className={`p-2 rounded-full ${
                      progress.currentStreak >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">3 Day Streak</p>
                      <p className="text-xs text-muted-foreground">Maintain a 3-day streak</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    progress.totalCalories >= 1000 ? "bg-primary/10" : "bg-secondary"
                  }`}>
                    <div className={`p-2 rounded-full ${
                      progress.totalCalories >= 1000 ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Burn 1000 Calories</p>
                      <p className="text-xs text-muted-foreground">Total 1000 kcal burned</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    progress.currentStreak >= 7 ? "bg-primary/10" : "bg-secondary"
                  }`}>
                    <div className={`p-2 rounded-full ${
                      progress.currentStreak >= 7 ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">7 Day Warrior</p>
                      <p className="text-xs text-muted-foreground">7 consecutive day streak</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly progress */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Progress</CardTitle>
                <CardDescription>Training time in the last 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyChart data={monthlyProgress} />
              </CardContent>
            </Card>

            {/* Recent workouts */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Workouts</CardTitle>
                  <CardDescription>Your training history</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/workouts">
                    Continue
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <RecentWorkouts sessions={progress.sessions} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
