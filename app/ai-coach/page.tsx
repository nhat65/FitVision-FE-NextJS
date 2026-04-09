'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PricingModal } from '@/components/payment/pricing-modal'
import { usePoseDetection } from '@/hooks/use-pose-detection'
import {
  analyzeExercise,
  createRepCounter,
  updateRepCounter,
  type RepCounter,
} from '@/lib/exercise-analyzer'
import { workoutPrograms, exercises, Exercise } from '@/lib/workout-data'
import { isAIMonitoringActive, getProgramPricing } from '@/lib/subscription-store'
import { getCurrentUser } from '@/lib/user-store'
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Timer,
  Flame,
  Dumbbell,
  Lock,
} from 'lucide-react'

function AICoachContent() {
  const searchParams = useSearchParams()
  const workoutId = searchParams.get('workout')
  const dayParam = searchParams.get('day')
  const noCamera = searchParams.get('mode') === 'no-camera'

  const user = getCurrentUser()
  const hasAIMonitoring = user ? isAIMonitoringActive(user.id) : false
  const workout = workoutId ? workoutPrograms.find((w) => w.id === workoutId) : null
  const currentDay = dayParam ? parseInt(dayParam) : 1
  const dayWorkout = workout?.schedule.find((d) => d.day === currentDay)

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    dayWorkout?.exercises[0] || exercises[0]
  )
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [repCounter, setRepCounter] = useState<RepCounter>(createRepCounter())
  const [workoutTime, setWorkoutTime] = useState(0)
  const [totalCalories, setTotalCalories] = useState(0)
  const [pricingOpen, setPricingOpen] = useState(false)

  const {
    isLoading,
    isDetecting,
    poseData,
    videoRef,
    canvasRef,
    startDetection,
    stopDetection,
  } = usePoseDetection()

  // Analyze pose when data changes
  useEffect(() => {
    if (poseData && selectedExercise && isWorkoutActive && !isPaused) {
      const analysis = analyzeExercise(selectedExercise.id, poseData.landmarks)

      // Update rep counter
      const newCounter = updateRepCounter(repCounter, analysis.phase, selectedExercise.id)
      if (newCounter.count !== repCounter.count) {
        setRepCounter(newCounter)
        // Add calories for each rep
        setTotalCalories((prev) => prev + 5)
      }
    }
  }, [poseData, selectedExercise, isWorkoutActive, isPaused, repCounter])

  // Workout timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isWorkoutActive && !isPaused) {
      interval = setInterval(() => {
        setWorkoutTime((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isWorkoutActive, isPaused])

  const handleStartWorkout = useCallback(async () => {
    if (!noCamera && hasAIMonitoring) {
      await startDetection()
    }
    setIsWorkoutActive(true)
    setIsPaused(false)
  }, [noCamera, hasAIMonitoring, startDetection])

  const handleStopWorkout = useCallback(() => {
    stopDetection()
    setIsWorkoutActive(false)
    setIsPaused(false)
  }, [stopDetection])

  const handleNextExercise = useCallback(() => {
    const exercisesCount = selectedExercise ? 5 : exercises.length
    if (currentExerciseIndex < exercisesCount - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
      setRepCounter(createRepCounter())
    }
  }, [currentExerciseIndex, selectedExercise])

  const handlePrevExercise = useCallback(() => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1)
      setRepCounter(createRepCounter())
    }
  }, [currentExerciseIndex])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Show paywall if no AI monitoring
  if (!hasAIMonitoring && !noCamera) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <Link
              href={workoutId ? `/workouts/${workoutId}` : '/workouts'}
              className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-dashed border-accent/30 rounded-2xl p-12 text-center">
              <Lock className="w-16 h-16 text-accent mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Unlock AI Monitoring</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                Get real-time form feedback, automatic rep counting, and AI-powered performance analysis to maximize your workout results.
              </p>

              <div className="bg-card rounded-xl p-6 mb-8 border border-border">
                <div className="text-4xl font-bold text-accent mb-2">
                  $9.99<span className="text-base text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mb-6">Or included with premium programs</p>

                <ul className="space-y-3 text-sm mb-6 text-left">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    Real-time pose detection
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    Automatic rep counting
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    Form feedback
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    Performance analytics
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    Workout history
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  onClick={() => {
                    if (workoutId) {
                      window.location.href = `/ai-coach?workout=${workoutId}&day=${currentDay}&mode=no-camera`
                    }
                  }}
                >
                  <span>Train Without AI</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => setPricingOpen(true)}
                  className="bg-accent hover:bg-accent/90"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        </main>

        {user && workout && (
          <PricingModal
            open={pricingOpen}
            onOpenChange={setPricingOpen}
            program={workout}
            userId={user.id}
            onSuccess={() => window.location.reload()}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Back button */}
          <Link
            href={workoutId ? `/workouts/${workoutId}` : '/workouts'}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to program
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main workout area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Camera/Video feed */}
              <Card className="bg-black">
                <CardContent className="p-0 relative">
                  {hasAIMonitoring && !noCamera && (
                    <>
                      <video
                        ref={videoRef}
                        className="hidden"
                      />
                      <canvas
                        ref={canvasRef}
                        className="w-full bg-black rounded-lg"
                      />
                    </>
                  )}
                  {(noCamera || !hasAIMonitoring) && (
                    <div className="aspect-video bg-gradient-to-br from-secondary to-background flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <CameraOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Camera mode disabled</p>
                      </div>
                    </div>
                  )}

                  {/* Workout controls overlay */}
                  {isWorkoutActive && (
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-4 py-2 rounded-lg flex gap-2">
                      <Timer className="w-5 h-5 text-primary" />
                      <span className="text-white font-mono">{formatTime(workoutTime)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exercise info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-primary" />
                    {selectedExercise?.name || 'Exercise'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {selectedExercise?.description}
                  </p>

                  {/* Workout stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {repCounter.count}
                      </div>
                      <div className="text-sm text-muted-foreground">Reps</div>
                    </div>
                    <div className="bg-accent/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-accent">
                        {totalCalories}
                      </div>
                      <div className="text-sm text-muted-foreground">Calories</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{formatTime(workoutTime)}</div>
                      <div className="text-sm text-muted-foreground">Time</div>
                    </div>
                  </div>

                  {/* Control buttons */}
                  <div className="flex gap-3 pt-4">
                    {!isWorkoutActive ? (
                      <Button
                        onClick={handleStartWorkout}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Exercise
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => setIsPaused(!isPaused)}
                          variant="secondary"
                          className="flex-1"
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleStopWorkout}
                          variant="destructive"
                          className="flex-1"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Finish
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Exercises list */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Program Exercises</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayWorkout?.exercises.map((exercise, index) => (
                    <button
                      key={exercise.id}
                      onClick={() => {
                        setSelectedExercise(exercise)
                        setCurrentExerciseIndex(index)
                        setRepCounter(createRepCounter())
                        setIsWorkoutActive(false)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedExercise?.id === exercise.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <div className="font-medium text-sm">{exercise.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {exercise.reps || exercise.duration}
                      </div>
                    </button>
                  )) || (
                    <div className="text-sm text-muted-foreground">
                      No exercises for this day
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats summary */}
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="text-lg">Session Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Reps:</span>
                    <span className="font-semibold">{repCounter.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Calories:</span>
                    <span className="font-semibold">{totalCalories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workout Time:</span>
                    <span className="font-semibold">{formatTime(workoutTime)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AICoachPage() {
  return (
    <Suspense>
      <AICoachContent />
    </Suspense>
  )
}
