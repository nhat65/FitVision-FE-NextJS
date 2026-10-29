"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Calendar, ArrowRight, Lock, Play } from "lucide-react";
import { Workout } from "@/app/workouts/page"; // Import type từ page
import { PricingModal } from "@/components/payment/pricing-modal";
import { getCurrentUser } from "@/lib/user-store";
import {
  WorkoutProgram,
  difficultyColors,
  difficultyLabels,
} from "@/lib/workout-data";

interface WorkoutCardProps {
  workout: Workout;
  isEnrolled?: boolean;
  onEnroll?: (planId: string) => void;
}

export function WorkoutCard({
  workout,
  isEnrolled = false,
  onEnroll,
}: WorkoutCardProps) {
  const [pricingOpen, setPricingOpen] = useState(false);
  const user = getCurrentUser();

  return (
  <>
    <Card className="group flex h-full flex-col transition-all duration-300 hover:border-primary/50">
      <CardHeader>
        <div className="flex flex-wrap items-start gap-2">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${difficultyColors[workout.difficulty]}`}
          >
            {difficultyLabels[workout.difficulty]}
          </span>
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {workout.totalDays} Days
          </span>
          {workout.isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Lock className="h-3 w-3" />
              Premium
            </span>
          )}
          {isEnrolled && (
            <span className="inline-block rounded-full border border-green-300 bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Enrolled
            </span>
          )}
        </div>

        <CardTitle className="mt-3 text-xl transition-colors group-hover:text-primary">
          {workout.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {workout.description}
        </CardDescription>
      </CardHeader>

      {/* flex-1 để chiếm phần còn lại của thẻ */}
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{workout.durationPerSession}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent" />
            <span>{workout.caloriesPerSession} kcal</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{workout.totalDays} days</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {workout.goals.slice(0, 3).map((goal, index) => (
            <span
              key={index}
              className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground"
            >
              {goal}
            </span>
          ))}
          {workout.goals.length > 3 && (
            <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
              +{workout.goals.length - 3} more
            </span>
          )}
        </div>

        {workout.isPremium && (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">
            <div className="font-semibold text-accent">${workout.price}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              + ${workout.aiMonitoringFee || 9.99}/month for AI monitoring
            </div>
          </div>
        )}

        {/* mt-auto đẩy button xuống sát đáy */}
        <div className="mt-auto pt-2">
          {isEnrolled ? (
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href={`/workouts/${workout.id}`}>
                <Play className="mr-2 h-4 w-4" />
                Continue Program
              </Link>
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                if (!user) {
                  window.location.href = "/login";
                } else if (workout.isPremium) {
                  setPricingOpen(true);
                } else {
                  onEnroll?.(workout.id);
                }
              }}
            >
              {user ? "Enroll Now" : "Sign In to Enroll"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {user && workout.isPremium && !isEnrolled && (
      <PricingModal
        open={pricingOpen}
        onOpenChange={setPricingOpen}
        program={workout}
        userId={user.id}
        onSuccess={() => {
          window.location.href = `/workouts/${workout.id}`;
        }}
      />
    )}
  </>
);
}
