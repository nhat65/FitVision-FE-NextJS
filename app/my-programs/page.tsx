'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnrollmentCard } from '@/components/enrollment/enrollment-card'
import { getCurrentUser } from '@/lib/user-store'
import { getUserEnrollments, type ProgramEnrollment } from '@/lib/subscription-store'
import { workoutPrograms, type WorkoutProgram } from '@/lib/workout-data'
import { BookOpen, Zap, CheckCircle2, Clock } from 'lucide-react'

export default function MyProgramsPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)
    const userEnrollments = getUserEnrollments(currentUser.id)
    setEnrollments(userEnrollments)
    setIsHydrated(true)
  }, [router])

  const getProgramById = (programId: string): WorkoutProgram | undefined => {
    return workoutPrograms.find((p) => p.id === programId)
  }

  const completedPrograms = enrollments.filter((e) => e.completedAt !== null)
  const activePrograms = enrollments.filter((e) => e.completedAt === null)
  const totalProgress = enrollments.length > 0 ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length) : 0

  if (!isHydrated) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-16">
          {/* Header Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">My Programs</h1>
            <p className="text-lg text-muted-foreground">
              Track your progress across all enrolled workout programs.
            </p>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-secondary/20 border-2 border-dashed border-border rounded-xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-2">No Programs Yet</h2>
              <p className="text-muted-foreground mb-8">
                Start your fitness journey by enrolling in a workout program.
              </p>
              <Button asChild size="lg">
                <Link href="/workouts">
                  Explore Programs
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Programs</p>
                        <p className="text-3xl font-bold mt-2">{enrollments.length}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-primary/40" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-3xl font-bold mt-2">{activePrograms.length}</p>
                      </div>
                      <Zap className="w-8 h-8 text-accent/40" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-3xl font-bold mt-2 text-green-600">{completedPrograms.length}</p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-green-500/40" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Overall Progress</p>
                        <p className="text-3xl font-bold mt-2">{totalProgress}%</p>
                      </div>
                      <Clock className="w-8 h-8 text-primary/40" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Programs */}
              {activePrograms.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6">Active Programs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activePrograms.map((enrollment) => {
                      const program = getProgramById(enrollment.programId)
                      if (!program) return null
                      return (
                        <EnrollmentCard
                          key={enrollment.id}
                          enrollment={enrollment}
                          program={program}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Completed Programs */}
              {completedPrograms.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Completed Programs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedPrograms.map((enrollment) => {
                      const program = getProgramById(enrollment.programId)
                      if (!program) return null
                      return (
                        <EnrollmentCard
                          key={enrollment.id}
                          enrollment={enrollment}
                          program={program}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
