'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ProgramEnrollment } from '@/lib/subscription-store'
import { WorkoutProgram } from '@/lib/workout-data'
import { Calendar, Flame, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface EnrollmentCardProps {
  enrollment: ProgramEnrollment
  program: WorkoutProgram
}

export function EnrollmentCard({ enrollment, program }: EnrollmentCardProps) {
  const isCompleted = enrollment.completedAt !== null
  const daysRemaining = 30 - enrollment.sessionsCompleted

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl">{program.name}</CardTitle>
              {isCompleted && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
            <CardDescription className="text-sm">
              {program.category.charAt(0).toUpperCase() + program.category.slice(1)}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-primary">
              {Math.round(enrollment.progress)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {enrollment.sessionsCompleted}/{enrollment.totalSessions} days
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={enrollment.progress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {isCompleted ? (
              <span className="text-green-600 font-semibold">
                ✓ Completed on {format(new Date(enrollment.completedAt), 'MMM d, yyyy')}
              </span>
            ) : (
              <span>{daysRemaining} days remaining</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="text-sm font-semibold flex items-center gap-1 mt-1">
              <Clock className="w-4 h-4" />
              {program.durationPerSession}
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Difficulty</div>
            <div className="text-sm font-semibold mt-1">
              {program.difficulty.charAt(0).toUpperCase() + program.difficulty.slice(1)}
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Calories</div>
            <div className="text-sm font-semibold flex items-center gap-1 mt-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {program.caloriesPerSession}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Started: {format(new Date(enrollment.startDate), 'MMM d, yyyy')}
          </div>
        </div>

        {/* Action Button */}
        <Button asChild className="w-full" variant={isCompleted ? 'outline' : 'default'}>
          <Link href={`/workouts/${program.id}`}>
            {isCompleted ? 'View Program' : 'Continue'} <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
