"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { WorkoutCard } from "@/components/workouts/workout-card"
import { Button } from "@/components/ui/button"
import { workoutPrograms, DifficultyLevel, difficultyLabels } from "@/lib/workout-data"
import { Filter } from "lucide-react"

type FilterCategory = "all" | DifficultyLevel

export default function WorkoutsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all")

  const filteredWorkouts = activeFilter === "all" 
    ? workoutPrograms 
    : workoutPrograms.filter(w => w.difficulty === activeFilter)

  const filters: { value: FilterCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "beginner", label: difficultyLabels.beginner },
    { value: "intermediate", label: difficultyLabels.intermediate },
    { value: "advanced", label: difficultyLabels.advanced },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              30-Day Workout Programs
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Choose a 30-day program that matches your level and goals. 
              All programs include AI-powered rep counting and progress tracking.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filter by:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Workout grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>

          {filteredWorkouts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No programs found with current filter.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
