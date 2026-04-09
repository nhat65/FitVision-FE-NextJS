'use client'

import { useState } from 'react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Flame, Calendar, ArrowRight, Lock } from "lucide-react"
import { WorkoutProgram, difficultyColors, difficultyLabels } from "@/lib/workout-data"
import { PricingModal } from "@/components/payment/pricing-modal"
import { getCurrentUser } from "@/lib/user-store"

interface WorkoutCardProps {
  workout: WorkoutProgram
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const [pricingOpen, setPricingOpen] = useState(false)
  const user = getCurrentUser()

  return (
    <>
      <Card className="group hover:border-primary/50 transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${difficultyColors[workout.difficulty]}`}>
                {difficultyLabels[workout.difficulty]}
              </span>
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/30">
                {workout.totalDays} Days
              </span>
              {workout.isPremium && (
                <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent border border-accent/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
          </div>
          <CardTitle className="mt-3 text-xl group-hover:text-primary transition-colors">
            {workout.name}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {workout.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{workout.durationPerSession}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent" />
              <span>{workout.caloriesPerSession} kcal</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{workout.totalDays} days</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {workout.goals.slice(0, 3).map((goal, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground"
              >
                {goal}
              </span>
            ))}
            {workout.goals.length > 3 && (
              <span className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                +{workout.goals.length - 3} more
              </span>
            )}
          </div>

          {/* Pricing section */}
          {workout.isPremium && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm">
              <div className="font-semibold text-accent">
                ${workout.price}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                + ${workout.aiMonitoringFee || 9.99}/month for AI monitoring
              </div>
            </div>
          )}

          <Button 
            className="w-full mt-4"
            onClick={() => user ? setPricingOpen(true) : window.location.href = '/login'}
          >
            {user ? 'Enroll Now' : 'Sign In to Enroll'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {user && (
        <PricingModal
          open={pricingOpen}
          onOpenChange={setPricingOpen}
          program={workout}
          userId={user.id}
          onSuccess={() => {
            window.location.href = `/workouts/${workout.id}`
          }}
        />
      )}
    </>
  )
}
