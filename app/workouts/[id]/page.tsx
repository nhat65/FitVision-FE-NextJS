'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  workoutPrograms,
  difficultyColors,
  difficultyLabels,
  DayWorkout,
} from '@/lib/workout-data'
import { PricingModal } from '@/components/payment/pricing-modal'
import { isProgramEnrolled, getProgramEnrollment } from '@/lib/subscription-store'
import { getCurrentUser, type UserProfile } from '@/lib/user-store'
import {
  ArrowLeft,
  Clock,
  Flame,
  Play,
  Camera,
  Target,
  Calendar,
  CheckCircle2,
  Coffee,
  Lock,
} from 'lucide-react'

interface WorkoutDetailPageProps {
  params: Promise<{ id: string }>
}

function DayCard({
  dayWorkout,
  workoutId,
  isCompleted,
  isEnrolled,
}: {
  dayWorkout: DayWorkout
  workoutId: string
  isCompleted: boolean
  isEnrolled: boolean
}) {
  if (dayWorkout.isRestDay) {
    return (
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-400 font-bold text-sm">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">Day {dayWorkout.day}</div>
            <div className="text-sm text-muted-foreground">Rest Day</div>
          </div>
        </div>
      </div>
    )
  }

  if (!isEnrolled) {
    return (
      <div className="p-4 rounded-xl bg-secondary/30 border border-border opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary font-bold text-sm">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">Day {dayWorkout.day}</div>
            <div className="text-sm text-muted-foreground">
              {dayWorkout.focusArea} - {dayWorkout.exercises.length} exercises
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link
      href={`/ai-coach?workout=${workoutId}&day=${dayWorkout.day}`}
      className="block"
    >
      <Card className={`transition-all duration-300 hover:border-primary/50 ${
        isCompleted ? 'bg-green-500/5 border-green-500/30' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : dayWorkout.day}
              </div>
              <div>
                <div className="font-medium">Day {dayWorkout.day}</div>
                <div className="text-sm text-muted-foreground">
                  {dayWorkout.focusArea} - {dayWorkout.exercises.length} exercises
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const { id } = use(params)
  const workout = workoutPrograms.find((w) => w.id === id)
  const [activeWeek, setActiveWeek] = useState(1)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollment, setEnrollment] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    
    if (currentUser) {
      const enrolled = isProgramEnrolled(currentUser.id, id)
      setIsEnrolled(enrolled)
      
      if (enrolled) {
        const enrollmentData = getProgramEnrollment(currentUser.id, id)
        setEnrollment(enrollmentData)
      }
    }
    
    setIsHydrated(true)
  }, [id])

  if (!workout) {
    notFound()
  }

  // Group schedule by weeks
  const weeks = [
    workout.schedule.slice(0, 7),
    workout.schedule.slice(7, 14),
    workout.schedule.slice(14, 21),
    workout.schedule.slice(21, 28),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          {/* Back button */}
          <Link href="/workouts" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to programs
          </Link>

          {/* Program header */}
          <div className="mb-12">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex gap-2 mb-3">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${
                      difficultyColors[workout.difficulty]
                    }`}
                  >
                    {difficultyLabels[workout.difficulty]}
                  </span>
                  {workout.isPremium && (
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent border border-accent/30">
                      Premium
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold tracking-tight">{workout.name}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{workout.description}</p>
              </div>
              {isHydrated && (
                <>
                  {!isEnrolled ? (
                    <Button
                      size="lg"
                      onClick={() => (user ? setPricingOpen(true) : (window.location.href = '/login'))}
                      className="whitespace-nowrap"
                    >
                      Enroll Now
                    </Button>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
                      <div className="text-sm font-semibold text-green-600">Enrolled</div>
                      <div className="text-xs text-muted-foreground">
                        Progress: {enrollment?.progress || 0}%
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Program stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Per Session</div>
                  <div className="font-semibold">{workout.durationPerSession}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-accent" />
                <div>
                  <div className="text-sm text-muted-foreground">Calories</div>
                  <div className="font-semibold">{workout.caloriesPerSession} kcal</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-semibold">{workout.totalDays} Days</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-semibold capitalize">{workout.category}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Program Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workout.goals.map((goal, index) => (
                <Card key={index} className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <span className="font-medium">{goal}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 30-Day Schedule */}
          {isHydrated && (
            <>
              {isEnrolled ? (
                <div>
                  <h2 className="text-2xl font-bold mb-8">30-Day Schedule</h2>

                  {/* Week tabs */}
                  <div className="flex gap-2 mb-8 overflow-x-auto">
                    {[1, 2, 3, 4].map((week) => (
                      <Button
                        key={week}
                        variant={activeWeek === week ? 'default' : 'outline'}
                        onClick={() => setActiveWeek(week)}
                        className="whitespace-nowrap"
                      >
                        Week {week}
                      </Button>
                    ))}
                  </div>

                  {/* Week content */}
                  <div className="grid gap-4">
                    {weeks[activeWeek - 1].map((dayWorkout) => (
                      <DayCard
                        key={dayWorkout.day}
                        dayWorkout={dayWorkout}
                        workoutId={id}
                        isCompleted={
                          enrollment?.sessionsCompleted
                            ? enrollment.sessionsCompleted >= dayWorkout.day
                            : false
                        }
                        isEnrolled={isEnrolled}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-secondary/30 border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Program Locked</h3>
                  <p className="text-muted-foreground mb-6">
                    Enroll in this program to view the full 30-day schedule and start training.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => (user ? setPricingOpen(true) : (window.location.href = '/login'))}
                  >
                    Enroll Now
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {user && (
        <PricingModal
          open={pricingOpen}
          onOpenChange={setPricingOpen}
          program={workout}
          userId={user.id}
          onSuccess={() => window.location.reload()}
        />
      )}

      <Footer />
    </div>
  )
}
