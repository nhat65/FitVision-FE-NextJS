'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Flame, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { Plan, ProgramEnrollment } from '@/app/my-programs/page'

interface EnrollmentCardProps {
  enrollment: ProgramEnrollment
  program: Plan
}

export function EnrollmentCard({ enrollment, program }: EnrollmentCardProps) {
  const totalDays = program.totalDays || 30;
  const sessionsPerWeek = program.sessionsPerWeek || 3; // quan trọng

  const completedDaysArray = Array.isArray(enrollment.completedDays) 
    ? enrollment.completedDays 
    : [];

  const completedDaysCount = completedDaysArray.length;

  // Tính tổng số buổi tập dự kiến
  const totalWeeks = Math.ceil(totalDays / 7);
  const totalTrainingDays = totalWeeks * sessionsPerWeek;

  const progressPercentage = totalTrainingDays > 0 
    ? Math.min(Math.round((completedDaysCount / totalTrainingDays) * 100), 100)
    : 0;

  const isCompleted = enrollment.completed === true;

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl">{program.name}</CardTitle>
              {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </div>
            <CardDescription className="text-sm">Workout Program</CardDescription>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold text-primary">
              {progressPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {completedDaysCount}/{totalTrainingDays} sessions
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Training Progress</span>
            {isCompleted ? (
              <span className="text-green-600 font-semibold">✓ Completed</span>
            ) : (
              <span>{totalTrainingDays - completedDaysCount} sessions left</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="text-sm font-semibold flex items-center gap-1 mt-1">
              <Clock className="w-4 h-4" />
              {program.durationPerSession || '45 mins'}
            </div>
          </div>

          <div className="bg-secondary/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Sessions/Week</div>
            <div className="text-sm font-semibold mt-1">
              {sessionsPerWeek} days
            </div>
          </div>

          <div className="bg-secondary/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Calories</div>
            <div className="text-sm font-semibold flex items-center gap-1 mt-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {program.caloriesPerSession || '400'}
            </div>
          </div>
        </div>

        {/* Start Date */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Started: {format(new Date(enrollment.startDate), 'MMM d, yyyy')}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          asChild 
          className="w-full" 
          variant={isCompleted ? 'outline' : 'default'}
        >
          <Link href={`/workouts/${program.id}`}>
            {isCompleted ? 'Review Program' : 'Continue Training'} 
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}