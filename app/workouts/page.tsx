"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WorkoutCard } from "@/components/workouts/workout-card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // ← Thêm skeleton loading
import { toast } from "sonner";
import { getAccessToken } from "@/lib/auth-store";

// Định nghĩa type cho workout (bạn có thể điều chỉnh sau khi xem response từ API)
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  difficulty: DifficultyLevel;
  instructions: string[];
  reps?: string;
  sets?: number;
  duration?: string;
  restTime: number; // seconds
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface DayWorkout {
  day: number;
  name: string;
  exercises: Exercise[];
  isRestDay?: boolean;
  focusArea?: string;
}

export type Workout = {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  totalDays: number;
  durationPerSession: string;
  caloriesPerSession: number;
  schedule: DayWorkout[];
  category: "strength" | "cardio" | "flexibility" | "full-body";
  imageUrl?: string;
  goals: string[];
  isPremium?: boolean;
  price?: number;
  aiMonitoringFee?: number;
};

type FilterCategory = "all" | "beginner" | "intermediate" | "advanced";

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [enrolledPlanIds, setEnrolledPlanIds] = useState<Set<string>>(
    new Set(),
  );

  // Fetch workouts từ API
 useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const token = getAccessToken(); // hoặc getAccessToken()

      // Fetch tất cả workout plans
      const plansRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan`);

      if (!plansRes.ok) throw new Error("Failed to fetch plans");
      const plansData = await plansRes.json();
      const workoutList = plansData.data || plansData;
      setWorkouts(workoutList);

      if (token) {
        try {
          const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-enrollment/`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
    
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            const enrollments = enrollData.data || enrollData;
            const enrolledIds = new Set<string>(
              enrollments.map((item: any) => item.planId || item.plan?.id)
            );
            setEnrolledPlanIds(enrolledIds);
            
          }
        } catch (enrollError) {
          console.warn("Không lấy được danh sách enrollment:", enrollError);
          // Không throw error, chỉ bỏ qua vì user chưa login
        }
      }
      // Nếu không có token → enrolledPlanIds vẫn là Set rỗng (user chưa enroll gì)

    } catch (err) {
      console.error("Error fetching workouts:", err);
      setError("Unable to load workout programs.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);

const handleEnroll = async (planId: string) => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-enrollment/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Enroll failed");
      }

      // Thêm vào danh sách đã enroll
      setEnrolledPlanIds(prev => new Set(prev).add(planId));
      
      toast.success("Successfully enrolled in the program!");
      
      // Optional: Refresh dữ liệu enrollment
      // fetchData();

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to enroll. Please try again.");
    }
  };

  // Lọc theo difficulty
 const filteredWorkouts = activeFilter === "all"
    ? workouts
    : workouts.filter((w) => w.difficulty === activeFilter);

  const filters: { value: FilterCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

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
              Choose a 30-day program that matches your level and goals. All
              programs include AI-powered rep counting and progress tracking.
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
                  variant={
                    activeFilter === filter.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setActiveFilter(filter.value)}
                  disabled={isLoading}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </div>
          )}

          {/* Workout grid */}
          {!isLoading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    isEnrolled={enrolledPlanIds.has(workout.id)} // ← Truyền prop này
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>

              {filteredWorkouts.length === 0 && workouts.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No programs found with current filter.
                  </p>
                </div>
              )}

              {workouts.length === 0 && !error && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No workout programs available at the moment.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
