"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Flame,
  Play,
  Target,
  Calendar,
  CheckCircle2,
  Coffee,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingModal } from "@/components/payment/pricing-modal";
import { getCurrentUser, type UserProfile } from "@/lib/user-store";
import { difficultyColors } from "@/lib/workout-data";
import { useProgram, type ProgramItem } from "@/hooks/usePrograms";
import {
  useMyEnrollments,
  useCompletedDays,
  useEnroll,
  enrollmentKeys,
} from "@/hooks/useEnrollments";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

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

interface WorkoutDetailPageProps {
  params: Promise<{ id: string }>;
}

/* -------------------------------------------------------------------------- */
/* Mapping: ProgramItem (API) -> Workout (UI)                                 */
/* -------------------------------------------------------------------------- */

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function buildSchedule(
  planExercises: ProgramItem["planExercises"] = [],
  totalDays: number,
): DayWorkout[] {
  const exercisesByDay = planExercises.reduce<
    Record<string, NonNullable<ProgramItem["planExercises"]>>
  >((acc, item) => {
    const dayKey = item.dayOfWeek || "Rest";
    (acc[dayKey] ??= []).push(item);
    return acc;
  }, {});

  Object.values(exercisesByDay).forEach((items) =>
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  );

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const weekDay = WEEK_DAYS[index % WEEK_DAYS.length];
    const dayExercises = exercisesByDay[weekDay] ?? [];

    if (!dayExercises.length) {
      return { day, name: `Day ${day}`, exercises: [], isRestDay: true };
    }

    return {
      day,
      name: weekDay,
      focusArea: `${weekDay} training`,
      exercises: dayExercises.map((item) => {
        const ex = item.exercise as any; // API có thể trả thêm field ngoài ExerciseItem
        return {
          id: ex?.id ?? item.exerciseId ?? `exercise-${item.id}`,
          name: ex?.name ?? "Exercise",
          description: ex?.description ?? "",
          muscleGroups: ex?.muscleGroup ? [ex.muscleGroup] : [],
          difficulty: (ex?.difficulty as DifficultyLevel) ?? "beginner",
          instructions: ex?.instructions ? [ex.instructions] : [],
          reps: item.reps,
          sets: item.sets,
          duration: undefined,
          restTime: item.restTime ?? 0,
          videoUrl: ex?.videoDemoUrl || ex?.videoUrl || undefined,
          thumbnailUrl: undefined,
        };
      }),
    };
  });
}

function mapProgramToWorkout(program: ProgramItem): Workout {
  const raw = program as ProgramItem & {
    category?: Workout["category"];
    imageUrl?: string;
  };
  const totalDays = raw.totalDays ?? 30;

  return {
    id: raw.id,
    name: raw.name ?? "",
    description: raw.description ?? "",
    difficulty: (raw.difficulty as DifficultyLevel) ?? "beginner",
    totalDays,
    durationPerSession: raw.durationPerSession ?? "",
    caloriesPerSession: raw.caloriesPerSession ?? 0,
    category: raw.category ?? "full-body",
    imageUrl: raw.imageUrl ?? undefined,
    goals: raw.goals ?? [],
    isPremium: raw.isPremium ?? false,
    price: raw.price ?? 0,
    aiMonitoringFee: raw.aiMonitoringFee ?? 0,
    schedule: buildSchedule(raw.planExercises, totalDays),
  };
}

/* -------------------------------------------------------------------------- */
/* Small components                                                           */
/* -------------------------------------------------------------------------- */

function StatItem({
  icon: Icon,
  label,
  value,
  iconClassName = "text-primary",
  valueClassName = "",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 ${iconClassName}`} />
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`font-semibold ${valueClassName}`}>{value}</div>
      </div>
    </div>
  );
}

function DayCard({
  dayWorkout,
  workoutId,
  isCompleted,
  isEnrolled,
}: {
  dayWorkout: DayWorkout;
  workoutId: string;
  isCompleted: boolean;
  isEnrolled: boolean;
}) {
  if (dayWorkout.isRestDay) {
    return (
      <div className="rounded-xl border border-border bg-secondary/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-sm font-bold text-green-400">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium">Day {dayWorkout.day}</div>
            <div className="text-sm text-muted-foreground">Rest Day</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="rounded-xl border border-border bg-secondary/30 p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium">Day {dayWorkout.day}</div>
            <div className="text-sm text-muted-foreground">
              {dayWorkout.focusArea} - {dayWorkout.exercises.length} exercises
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/ai-coach?workout=${workoutId}&day=${dayWorkout.day}&dayOfWeek=${encodeURIComponent(dayWorkout.name)}`}
      className="block"
    >
      <Card
        className={`transition-all duration-300 hover:border-primary/50 ${
          isCompleted ? "border-green-500/30 bg-green-500/5" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  dayWorkout.day
                )}
              </div>
              <div>
                <div className="font-medium">Day {dayWorkout.day}</div>
                <div className="text-sm text-muted-foreground">
                  {dayWorkout.focusArea} - {dayWorkout.exercises.length}{" "}
                  exercises
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost">
              <Play className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 pt-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Skeleton className="mb-8 h-10 w-40" />
          <div className="space-y-8">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // UI state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser()); // đọc localStorage nên phải chạy ở client
  }, []);

  // Server state
  const {
    data: program,
    isLoading: isProgramLoading,
    error: programError,
  } = useProgram(id);

  const { data: enrollments, isLoading: isEnrollmentLoading } =
    useMyEnrollments(!!user);

  const isEnrolled = enrollments?.some((e) => e.planId === id) ?? false;

  const { data: completedDays = [] } = useCompletedDays(id, isEnrolled);

  const enroll = useEnroll();

  // Derived state (phải đặt trước mọi return sớm để giữ thứ tự hook)
  const workout = useMemo(
    () => (program ? mapProgramToWorkout(program) : null),
    [program],
  );

  const { weeks, progress } = useMemo(() => {
    if (!workout) return { weeks: [] as DayWorkout[][], progress: 0 };

    const weeks = Array.from(
      { length: Math.ceil(workout.schedule.length / 7) },
      (_, i) => workout.schedule.slice(i * 7, i * 7 + 7),
    );

    const trainingDays = new Set(
      workout.schedule.filter((d) => !d.isRestDay).map((d) => d.day),
    );
    const completedCount = completedDays.filter((d) =>
      trainingDays.has(d),
    ).length;

    return {
      weeks,
      progress: trainingDays.size
        ? Math.round((completedCount / trainingDays.size) * 100)
        : 0,
    };
  }, [workout, completedDays]);

  /* ----------------------------- Render guards ---------------------------- */

  if (isProgramLoading) return <PageSkeleton />;

  if (programError || !workout) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center pb-16 pt-24">
          <div className="text-center">
            <p className="mb-4 text-destructive">
              {programError?.message || "Workout not found"}
            </p>
            <Link href="/workouts">
              <Button>Back to Workouts</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ------------------------------- Handlers ------------------------------- */

  const handleEnrollClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Chương trình trả phí: mở modal thanh toán
    if (workout.isPremium) {
      setPricingOpen(true);
      return;
    }

    // Chương trình miễn phí: đăng ký thẳng
    enroll.mutate(id, {
      onSuccess: () => toast.success("Successfully enrolled in the program!"),
      onError: (err) => toast.error(err.message || "Failed to enroll."),
    });
  };

  const enrollButton = (
    <Button
      size="lg"
      onClick={handleEnrollClick}
      disabled={enroll.isPending}
      className="whitespace-nowrap"
    >
      {enroll.isPending ? "Enrolling..." : "Enroll Now"}
    </Button>
  );

  const difficultyLabel =
    workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1);

  /* --------------------------------- UI ----------------------------------- */

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 pt-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          {/* Back button */}
          <Link
            href="/workouts"
            className="mb-8 flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to programs
          </Link>

          {/* Program header */}
          <div className="mb-12">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex gap-2">
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
                      difficultyColors[workout.difficulty] ||
                      "bg-primary/10 text-primary"
                    }`}
                  >
                    {difficultyLabel}
                  </span>
                  {workout.isPremium && (
                    <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      Premium
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold tracking-tight">
                  {workout.name}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  {workout.description}
                </p>
              </div>

              {isEnrollmentLoading ? (
                <Skeleton className="h-11 w-32 rounded-md" />
              ) : isEnrolled ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2">
                  <div className="text-sm font-semibold text-green-600">
                    Enrolled
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Progress: {progress}%
                  </div>
                </div>
              ) : (
                enrollButton
              )}
            </div>

            {/* Program stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatItem
                icon={Clock}
                label="Per Session"
                value={workout.durationPerSession}
              />
              <StatItem
                icon={Flame}
                label="Calories"
                value={`${workout.caloriesPerSession} kcal`}
                iconClassName="text-accent"
              />
              <StatItem
                icon={Calendar}
                label="Duration"
                value={`${workout.totalDays} Days`}
              />
              <StatItem
                icon={Target}
                label="Category"
                value={workout.category}
                valueClassName="capitalize"
              />
            </div>
          </div>

          {/* Goals */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Program Goals</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workout.goals.map((goal, index) => (
                <Card key={index} className="border-primary/20 bg-primary/5">
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span className="font-medium">{goal}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Schedule */}
          {isEnrollmentLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-56" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : isEnrolled ? (
            <div>
              <h2 className="mb-8 text-2xl font-bold">
                {workout.totalDays}-Day Schedule
              </h2>

              {/* Week tabs */}
              <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
                {weeks.map((_, i) => (
                  <Button
                    key={i}
                    variant={activeWeek === i + 1 ? "default" : "outline"}
                    onClick={() => setActiveWeek(i + 1)}
                    className="whitespace-nowrap"
                  >
                    Week {i + 1}
                  </Button>
                ))}
              </div>

              {/* Week content */}
              <div className="grid gap-4">
                {weeks[activeWeek - 1]?.map((dayWorkout) => (
                  <DayCard
                    key={dayWorkout.day}
                    dayWorkout={dayWorkout}
                    workoutId={id}
                    isCompleted={completedDays.includes(dayWorkout.day)}
                    isEnrolled={isEnrolled}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center">
              <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">Program Locked</h3>
              <p className="mb-6 text-muted-foreground">
                Enroll in this program to view the full {workout.totalDays}-day
                schedule and start training.
              </p>
              {enrollButton}
            </div>
          )}
        </div>
      </main>

      {user && (
        <PricingModal
          open={pricingOpen}
          onOpenChange={setPricingOpen}
          program={workout}
          userId={user.id}
          onSuccess={() => {
            setPricingOpen(false);
            // Thay cho window.location.reload(): làm mới enrollment + tiến độ
            queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
          }}
        />
      )}

      <Footer />
    </div>
  );
}