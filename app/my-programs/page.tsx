'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentCard } from "@/components/enrollment/enrollment-card";
import { getCurrentUser } from "@/lib/user-store";
import { workoutPrograms, type WorkoutProgram } from "@/lib/workout-data";
import { BookOpen, Zap, CheckCircle2, Clock } from "lucide-react";
import { getAccessToken } from "@/lib/auth-store";

export interface Plan {
  id: string;
  name: string;
  description: string;
  goals: string[];
  totalDays: number;
  durationWeeks: number;
  durationPerSession: string;
  caloriesPerSession: number;
  isPremium: boolean | null;
  price: number | null;
  aiMonitoringFee: number | null;
  difficulty: string;
  sessionsPerWeek?: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ProgramEnrollment {
  id: string;
  accountId: string;
  planId: string;
  startDate: string;
  currentWeek: number;
  completedDays: number[];        // ← Mảng các ngày đã hoàn thành
  completed: boolean;
  progress?: number;
  progressPercentage?: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
  plan: Plan;
}

export default function MyProgramsPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    fetchEnrollments();
    setIsHydrated(true);
  }, [router]);

  const fetchEnrollments = async () => {
  try {
    const token = getAccessToken();
    if (!token) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-progress/my-program`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;

    const result = await res.json();
    const rawEnrollments: any[] = result.data || [];

    const processedEnrollments = rawEnrollments.map((enroll) => {
      const totalDays = enroll.plan?.totalDays || 30;
      const sessionsPerWeek = enroll.plan?.sessionsPerWeek || 3; // mặc định 3 nếu không có
      const completedDaysArray = Array.isArray(enroll.completedDays) ? enroll.completedDays : [];

      // Tính tổng số buổi tập dự kiến
      const totalWeeks = Math.ceil(totalDays / 7);
      const totalTrainingDays = totalWeeks * sessionsPerWeek;

      const completedTrainingDays = completedDaysArray.length;

      const progressPercentage = totalTrainingDays > 0 
        ? Math.min(Math.round((completedTrainingDays / totalTrainingDays) * 100), 100)
        : 0;

      return {
        ...enroll,
        completedDays: completedDaysArray,
        progress: progressPercentage,
        progressPercentage: progressPercentage,
      };
    });

    setEnrollments(processedEnrollments);
  } catch (error) {
    console.error("Failed to fetch enrollments:", error);
  }
};

  const getProgramById = (programId: string): WorkoutProgram | undefined => {
    return workoutPrograms.find((p) => p.id === programId);
  };

  const activePrograms = enrollments.filter((e) => !e.completed);
  const completedPrograms = enrollments.filter((e) => e.completed);

  const totalProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((acc, e) => acc + (e.progressPercentage || 0), 0) / enrollments.length) 
    : 0;

  if (!isHydrated) return null;

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
                <Link href="/workouts">Explore Programs</Link>
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
                        <p className="text-3xl font-bold mt-2 text-green-600">
                          {completedPrograms.length}
                        </p>
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
                    {activePrograms.map((enrollment) => (
                      <EnrollmentCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        program={enrollment.plan}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Programs */}
              {completedPrograms.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Completed Programs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedPrograms.map((enrollment) => (
                      <EnrollmentCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        program={enrollment.plan}
                      />
                    ))}
                  </div>
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