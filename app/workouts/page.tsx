"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // nếu cần redirect
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WorkoutCard } from "@/components/workouts/workout-card";
import { Button } from "@/components/ui/button";
import { Filter, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/auth-store";
import { getCurrentUser } from "@/lib/user-store";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Exercise { /* ... giữ nguyên */ }

export type Workout = {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  totalDays: number;
  durationPerSession: string;
  caloriesPerSession: number;
  category?: string;
  imageUrl?: string;
  goals: string[];
  isPremium?: boolean;
  price?: number;
  aiMonitoringFee?: number;
  sessionsPerWeek?: number;
};

type FilterCategory = "all" | "beginner" | "intermediate" | "advanced";

export default function WorkoutsPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [recommendedWorkouts, setRecommendedWorkouts] = useState<Workout[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [enrolledPlanIds, setEnrolledPlanIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  // Fetch data
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const token = getAccessToken();

        // Fetch tất cả workout plans
        const plansRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan`);
        if (!plansRes.ok) throw new Error("Failed to fetch plans");

        const plansData = await plansRes.json();
        const workoutList: Workout[] = plansData.data || plansData;
        setWorkouts(workoutList);

        // Fetch enrolled plans
        if (token) {
          try {
            const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-enrollment/`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (enrollRes.ok) {
              const enrollData = await enrollRes.json();
              const enrollments = enrollData.data || [];
              const enrolledIds = new Set<string>(
                enrollments.map((item: any) => item.planId || item.plan?.id)
              );
              setEnrolledPlanIds(enrolledIds);
            }
          } catch (e) {
            console.warn("Cannot fetch enrollments", e);
          }
        }

        // Tính Recommended workouts
        if (currentUser && workoutList.length > 0) {
          const recommended = getRecommendedWorkouts(workoutList, currentUser);
          setRecommendedWorkouts(recommended);
        }

      } catch (err) {
        console.error("Error fetching workouts:", err);
        setError("Unable to load workout programs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Logic recommend dựa trên fitnessLevel và fitnessGoal
  const getRecommendedWorkouts = (allWorkouts: Workout[], currentUser: any): Workout[] => {
    if (!currentUser) return [];

    const userLevel = currentUser.fitnessLevel?.toLowerCase() || "beginner";
    const userGoal = currentUser.fitnessGoal?.toLowerCase() || "";

    return allWorkouts
      .filter((w) => {
        const difficultyMatch = w.difficulty.toLowerCase() === userLevel;
        const goalMatch = w.goals?.some((goal) =>
          goal.toLowerCase().includes(userGoal) ||
          (userGoal.includes("muscle") && goal.toLowerCase().includes("muscle")) ||
          (userGoal.includes("weight") && goal.toLowerCase().includes("loss")) ||
          (userGoal.includes("endurance") && (goal.toLowerCase().includes("endurance") || goal.toLowerCase().includes("cardio")))
        );

        return difficultyMatch || goalMatch;
      })
      .sort((a, b) => {
        // Ưu tiên match cả level + goal
        const aScore = (a.difficulty.toLowerCase() === userLevel ? 2 : 0) +
                      (a.goals?.some(g => g.toLowerCase().includes(userGoal)) ? 1 : 0);
        const bScore = (b.difficulty.toLowerCase() === userLevel ? 2 : 0) +
                      (b.goals?.some(g => g.toLowerCase().includes(userGoal)) ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 6); // Giới hạn 6 chương trình recommend
  };

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

      if (!res.ok) throw new Error("Enroll failed");

      setEnrolledPlanIds(prev => new Set(prev).add(planId));
      toast.success("Successfully enrolled in the program!");

    } catch (error: any) {
      toast.error(error.message || "Failed to enroll.");
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
              Choose a program that matches your level and goals.
            </p>
          </div>

          {/* === RECOMMENDED SECTION === */}
          {recommendedWorkouts.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl font-bold">Recommended for You</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedWorkouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    isEnrolled={enrolledPlanIds.has(workout.id)}
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filter by difficulty:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.value)}
                  disabled={isLoading}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading / Error / Grid giữ nguyên như cũ */}
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

          {!isLoading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    isEnrolled={enrolledPlanIds.has(workout.id)}
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>

              {filteredWorkouts.length === 0 && workouts.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No programs found with current filter.</p>
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