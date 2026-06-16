"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAdmin, getCurrentUser } from "@/lib/user-store";
import {
  Trash2,
  Eye,
  Plus,
  Edit2,
  Search,
  Loader2,
  Calendar,
  Clock,
  Flame,
  Target,
  Dumbbell,
  Award,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/auth-store";
import { EditProgramModal } from "./edit-program-modal";

interface ProgramStat {
  programId: string;
  programName: string;
  enrolledUsers: number;
  completionRate: number;
  averageRating: number;
  duration?: string;
}

interface ProgramDetail {
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
  creatorId: string;
  planExercises: PlanExercise[];
  createdAt: string;
  updatedAt: string;
}

interface PlanExercise {
  id: string;
  planId: string;
  exerciseId: string;
  dayOfWeek: string;
  order: number;
  sets: number;
  reps: string;
  restTime: number;
  exercise: {
    id: string;
    name: string;
    description: string | null;
    muscleGroup: string | null;
    difficulty: string;
    instructions: string | null;
    videoDemoUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface NewProgram {
  name: string;
  description: string;
  goals: string[];
  totalDays: number;
  durationWeeks: number;
  durationPerSession: string;
  caloriesPerSession: number;
  difficulty: string;
  sessionsPerWeek: 3 | 4 | 5 | 6;
}

interface AvailableExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  difficulty: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAYS_VN = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ Nhật",
};

// Thêm interface cho editing program
interface EditingProgram {
  id: string;
  name: string;
  description: string;
  goals: string[];
  totalDays: number;
  durationWeeks: number;
  durationPerSession: string;
  caloriesPerSession: number;
  difficulty: string;
  sessionsPerWeek: 3 | 4 | 5 | 6;
}

export default function ProgramsManagement() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramStat[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramStat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramStat | null>(
    null,
  );
  const [programDetail, setProgramDetail] = useState<ProgramDetail | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingProgram, setAddingProgram] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<
    AvailableExercise[]
  >([]);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<3 | 4 | 5 | 6>(3);

  // Thêm state trong component
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<EditingProgram | null>(
    null,
  );
  const [editingDailyExercises, setEditingDailyExercises] = useState<{
    [key: string]: {
      id: string;
      order: number;
      exerciseId: string;
      sets: number;
      reps: string;
      restTime: number;
    }[];
  }>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  const [updatingProgram, setUpdatingProgram] = useState(false);

  // Form state cho add program
  const [newProgram, setNewProgram] = useState<NewProgram>({
    name: "",
    description: "",
    goals: [],
    totalDays: 30,
    durationWeeks: 4,
    durationPerSession: "1 hour",
    caloriesPerSession: 400,
    difficulty: "beginner",
    sessionsPerWeek: 3,
  });

  const [goalInput, setGoalInput] = useState("");

  // State cho exercises theo từng ngày
  const [dailyExercises, setDailyExercises] = useState<{
    [key: string]: {
      id: string;
      order: number;
      exerciseId: string;
      sets: number;
      reps: string;
      restTime: number;
    }[];
  }>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });

  // State để mở/đóng từng ngày
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({
    Monday: true,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });

  // Fetch available exercises
  const fetchAvailableExercises = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/exercises/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableExercises(
          data.data.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            difficulty: ex.difficulty,
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
  };

  // Kiểm tra quyền Admin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !isAdmin()) {
      router.push("/login");
      return;
    }
    fetchPrograms();
    fetchAvailableExercises();
  }, [router]);

  // Gọi API lấy danh sách workout plans
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch workout programs");
      }

      const data = await res.json();

      const formattedPrograms = data.data.map((p: any) => ({
        programId: p.id,
        programName: p.name || "Untitled Program",
        enrolledUsers: p.enrolledUsers || 0,
        completionRate: p.completionRate || 0,
        averageRating: p.averageRating || 0,
        duration: `${p.totalDays || 30} Days`,
      }));

      setPrograms(formattedPrograms);
      setFilteredPrograms(formattedPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to load workout programs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Gọi API lấy chi tiết program
  const fetchProgramDetail = async (programId: string) => {
    try {
      setLoadingDetail(true);
      const token = getAccessToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan/${programId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch program details");
      }

      const data = await res.json();
      setProgramDetail(data.data);
    } catch (error) {
      console.error("Error fetching program detail:", error);
      toast.error("Failed to load program details");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Xử lý khi click vào nút View
  const handleViewProgram = async (program: ProgramStat) => {
    setSelectedProgram(program);
    await fetchProgramDetail(program.programId);
  };

  // Tìm kiếm
  useEffect(() => {
    const filtered = programs.filter((program) =>
      program.programName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredPrograms(filtered);
  }, [searchTerm, programs]);

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    setDeletingId(programId);

    try {
      const token = getAccessToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan/${programId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to delete program");
      }

      setPrograms(programs.filter((p) => p.programId !== programId));
      setFilteredPrograms(
        filteredPrograms.filter((p) => p.programId !== programId),
      );

      toast.success("Program deleted successfully");
    } catch (error) {
      toast.error("Failed to delete program");
    } finally {
      setDeletingId(null);
    }
  };

  // Helper để nhóm exercises theo ngày
  const groupExercisesByDay = (exercises: PlanExercise[]) => {
    const grouped = exercises.reduce(
      (acc, exercise) => {
        const day = exercise.dayOfWeek;
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(exercise);
        return acc;
      },
      {} as Record<string, PlanExercise[]>,
    );

    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => a.order - b.order);
    });

    return grouped;
  };

  // Add goal
  const addGoal = () => {
    if (goalInput.trim()) {
      setNewProgram({
        ...newProgram,
        goals: [...newProgram.goals, goalInput.trim()],
      });
      setGoalInput("");
    }
  };

  const removeGoal = (index: number) => {
    setNewProgram({
      ...newProgram,
      goals: newProgram.goals.filter((_, i) => i !== index),
    });
  };

  // Toggle mở/đóng ngày
  const toggleDay = (day: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  // Thêm exercise cho một ngày cụ thể
  const addExerciseToDay = (day: string) => {
    const currentExercises = dailyExercises[day];
    const newExercise = {
      id: `${day}-${Date.now()}-${currentExercises.length}`,
      order: currentExercises.length + 1,
      exerciseId: "",
      sets: 3,
      reps: "10-12",
      restTime: 60,
    };

    setDailyExercises((prev) => ({
      ...prev,
      [day]: [...prev[day], newExercise],
    }));
  };

  // Xóa exercise khỏi một ngày
  const removeExerciseFromDay = (day: string, exerciseId: string) => {
    setDailyExercises((prev) => ({
      ...prev,
      [day]: prev[day].filter((ex) => ex.id !== exerciseId),
    }));
  };

  // Cập nhật exercise trong một ngày
  const updateExerciseInDay = (
    day: string,
    exerciseId: string,
    field: string,
    value: any,
  ) => {
    setDailyExercises((prev) => ({
      ...prev,
      [day]: prev[day].map((ex) =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex,
      ),
    }));
  };

  // Create program
  const handleCreateProgram = async () => {
    if (!newProgram.name.trim()) {
      toast.error("Program name is required");
      return;
    }

    setAddingProgram(true);

    try {
      const token = getAccessToken();

      // Tạo planExercises từ dailyExercises
      const planExercises: any[] = [];

      Object.entries(dailyExercises).forEach(([day, exercises]) => {
        exercises.forEach((exercise) => {
          if (exercise.exerciseId) {
            planExercises.push({
              exerciseId: exercise.exerciseId,
              dayOfWeek: day,
              order: exercise.order,
              sets: exercise.sets,
              reps: exercise.reps,
              restTime: exercise.restTime,
            });
          }
        });
      });

      const payload = {
        name: newProgram.name,
        description: newProgram.description,
        goals: newProgram.goals,
        totalDays: newProgram.totalDays,
        durationWeeks: newProgram.durationWeeks,
        durationPerSession: newProgram.durationPerSession,
        caloriesPerSession: newProgram.caloriesPerSession,
        difficulty: newProgram.difficulty,
        sessionsPerWeek: sessionsPerWeek,
        planExercises: planExercises,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create program");
      }

      toast.success("Program created successfully");
      setShowAddForm(false);
      resetForm();
      fetchPrograms();
    } catch (error: any) {
      console.error("Error creating program:", error);
      toast.error(error.message || "Failed to create program");
    } finally {
      setAddingProgram(false);
    }
  };

  const resetForm = () => {
    setNewProgram({
      name: "",
      description: "",
      goals: [],
      totalDays: 30,
      durationWeeks: 4,
      durationPerSession: "1 hour",
      caloriesPerSession: 400,
      difficulty: "beginner",
      sessionsPerWeek: 3,
    });
    setDailyExercises({
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    });
    setGoalInput("");
  };

  // Hàm mở modal edit
  const handleEditProgram = async (program: ProgramStat) => {
    try {
      const token = getAccessToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan/${program.programId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch program details");
      }

      const data = await res.json();
      const programData = data.data;

      // Set basic info
      setEditingProgram({
        id: programData.id,
        name: programData.name,
        description: programData.description || "",
        goals: programData.goals || [],
        totalDays: programData.totalDays,
        durationWeeks: programData.durationWeeks,
        durationPerSession: programData.durationPerSession,
        caloriesPerSession: programData.caloriesPerSession,
        difficulty: programData.difficulty,
        sessionsPerWeek: programData.sessionsPerWeek,
      });

      // Set exercises by day
      const exercisesByDay: typeof editingDailyExercises = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      };

      programData.planExercises?.forEach((exercise: any) => {
        const day = exercise.dayOfWeek;
        exercisesByDay[day].push({
          id: exercise.id,
          order: exercise.order,
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restTime,
        });
      });

      // Sort exercises by order
      Object.keys(exercisesByDay).forEach((day) => {
        exercisesByDay[day].sort((a, b) => a.order - b.order);
      });

      setEditingDailyExercises(exercisesByDay);
      setShowEditForm(true);
    } catch (error) {
      console.error("Error fetching program for edit:", error);
      toast.error("Failed to load program data for editing");
    }
  };

  // Hàm xử lý update
  const handleUpdateProgram = async (id: string, payload: any) => {
    try {
      setUpdatingProgram(true);
      const token = getAccessToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update program");
      }

      toast.success("Program updated successfully");
      setShowEditForm(false);
      setEditingProgram(null);
      fetchPrograms(); // Refresh danh sách
    } catch (error: any) {
      console.error("Error updating program:", error);
      toast.error(error.message || "Failed to update program");
      throw error;
    } finally {
      setUpdatingProgram(false);
    }
  };

  // Hàm lấy danh sách ngày theo số buổi
  const getDaysBySessions = (sessions: number): string[] => {
    switch (sessions) {
      case 3:
        return ["Monday", "Wednesday", "Friday"];
      case 4:
        return ["Monday", "Tuesday", "Friday", "Saturday"];
      case 5:
        return ["Monday", "Tuesday", "Wednesday", "Saturday", "Sunday"];
      case 6:
        return [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
      default:
        return ["Monday", "Wednesday", "Friday"];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-muted-foreground">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Workout Programs</h1>
              <p className="text-muted-foreground mt-2">
                Manage all workout programs
              </p>
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="w-5 h-5" />
              Add Program
            </Button>
          </div>

          {/* Add Program Form - Hiển thị trực tiếp như Exercise */}
          {showAddForm && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Add New Program</h3>
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Program Name *
                    </label>
                    <Input
                      placeholder="e.g., Full Body Strength Plan"
                      value={newProgram.name}
                      onChange={(e) =>
                        setNewProgram({ ...newProgram, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Difficulty
                    </label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={newProgram.difficulty}
                      onChange={(e) =>
                        setNewProgram({
                          ...newProgram,
                          difficulty: e.target.value,
                        })
                      }
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md bg-background min-h-24"
                    placeholder="Describe the program..."
                    value={newProgram.description}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Goals */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Goals
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="e.g., Increase strength"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addGoal()}
                    />
                    <Button type="button" onClick={addGoal}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newProgram.goals.map((goal, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary/10 rounded-md text-sm flex items-center gap-1"
                      >
                        {goal}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeGoal(idx)}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Duration Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Total Days
                    </label>
                    <Input
                      type="number"
                      value={newProgram.totalDays}
                      onChange={(e) =>
                        setNewProgram({
                          ...newProgram,
                          totalDays: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Duration (weeks)
                    </label>
                    <Input
                      type="number"
                      value={newProgram.durationWeeks}
                      onChange={(e) =>
                        setNewProgram({
                          ...newProgram,
                          durationWeeks: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Per Session
                    </label>
                    <Input
                      placeholder="e.g., 1 hour"
                      value={newProgram.durationPerSession}
                      onChange={(e) =>
                        setNewProgram({
                          ...newProgram,
                          durationPerSession: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Calories/Session
                    </label>
                    <Input
                      type="number"
                      value={newProgram.caloriesPerSession}
                      onChange={(e) =>
                        setNewProgram({
                          ...newProgram,
                          caloriesPerSession: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Training sessions per week
                  </label>
                  <select
                    className="w-full p-3 border rounded-md bg-background"
                    value={sessionsPerWeek}
                    onChange={(e) => {
                      const newSessions = parseInt(e.target.value) as
                        | 3
                        | 4
                        | 5
                        | 6;
                      setSessionsPerWeek(newSessions);

                      // Reset dailyExercises based on the new number of sessions
                      const activeDays = getDaysBySessions(newSessions);
                      const newDailyExercises: any = {};

                      DAYS_OF_WEEK.forEach((day) => {
                        newDailyExercises[day] = activeDays.includes(day)
                          ? dailyExercises[day] || []
                          : [];
                      });

                      setDailyExercises(newDailyExercises);
                    }}
                  >
                    <option value={3}>3 sessions/week (Mon, Wed, Fri)</option>
                    <option value={4}>
                      4 sessions/week (Mon, Tue, Thu, Fri)
                    </option>
                    <option value={5}>
                      5 sessions/week (Mon, Tue, Wed, Fri, Sat)
                    </option>
                    <option value={6}>6 sessions/week (Mon → Sat)</option>
                  </select>
                </div>

                {/* Daily Exercises Section - Theo từng ngày trong tuần */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium">
                      Weekly Workout Plan
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {sessionsPerWeek} sessions per week
                    </span>
                  </div>

                  <div className="space-y-3">
                    {getDaysBySessions(sessionsPerWeek).map((day) => (
                      <div
                        key={day}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        {/* Day Header */}
                        <div
                          className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleDay(day)}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <h4 className="font-semibold">
                              {DAYS_VN[day as keyof typeof DAYS_VN]} ({day})
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              ({dailyExercises[day]?.length || 0} exercises)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                addExerciseToDay(day);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              Add Exercise
                            </Button>
                            {expandedDays[day] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                        {/* Day Content */}
                        {expandedDays[day] && (
                          <div className="p-3 space-y-3">
                            {dailyExercises[day].length === 0 ? (
                              <p className="text-center text-muted-foreground py-4 text-sm">
                                No exercises for{" "}
                                {DAYS_VN[day as keyof typeof DAYS_VN]}. Click
                                "Add Exercise" to add.
                              </p>
                            ) : (
                              dailyExercises[day].map((exercise, idx) => (
                                <div
                                  key={exercise.id}
                                  className="border border-border rounded-lg p-3 bg-background"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                      Exercise #{idx + 1}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeExerciseFromDay(day, exercise.id)
                                      }
                                    >
                                      <X className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <div>
                                      <label className="text-xs font-medium mb-1 block text-muted-foreground">
                                        Exercise *
                                      </label>
                                      <select
                                        className="w-full p-2 border rounded-md bg-background text-sm"
                                        value={exercise.exerciseId}
                                        onChange={(e) =>
                                          updateExerciseInDay(
                                            day,
                                            exercise.id,
                                            "exerciseId",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="">
                                          Select Exercise
                                        </option>
                                        {availableExercises.map((ex) => (
                                          <option key={ex.id} value={ex.id}>
                                            {ex.name} (
                                            {ex.muscleGroup || "General"})
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium mb-1 block text-muted-foreground">
                                        Sets
                                      </label>
                                      <Input
                                        type="number"
                                        placeholder="e.g., 3"
                                        value={exercise.sets}
                                        onChange={(e) =>
                                          updateExerciseInDay(
                                            day,
                                            exercise.id,
                                            "sets",
                                            parseInt(e.target.value),
                                          )
                                        }
                                        className="text-sm"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium mb-1 block text-muted-foreground">
                                        Reps
                                      </label>
                                      <Input
                                        placeholder="e.g., 10-12, 45s hold"
                                        value={exercise.reps}
                                        onChange={(e) =>
                                          updateExerciseInDay(
                                            day,
                                            exercise.id,
                                            "reps",
                                            e.target.value,
                                          )
                                        }
                                        className="text-sm"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium mb-1 block text-muted-foreground">
                                        Rest (seconds)
                                      </label>
                                      <Input
                                        type="number"
                                        placeholder="e.g., 60"
                                        value={exercise.restTime}
                                        onChange={(e) =>
                                          updateExerciseInDay(
                                            day,
                                            exercise.id,
                                            "restTime",
                                            parseInt(e.target.value),
                                          )
                                        }
                                        className="text-sm"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium mb-1 block text-muted-foreground">
                                        Order
                                      </label>
                                      <Input
                                        type="number"
                                        placeholder="e.g., 1, 2, 3"
                                        value={exercise.order}
                                        onChange={(e) =>
                                          updateExerciseInDay(
                                            day,
                                            exercise.id,
                                            "order",
                                            parseInt(e.target.value),
                                          )
                                        }
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    💡 Tip: You can configure different exercises for each day
                    of the week. Click on each day to expand and add exercises.
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateProgram}
                    disabled={addingProgram}
                  >
                    {addingProgram ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Program"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Edit Program Modal */}
          <EditProgramModal
            isOpen={showEditForm}
            program={editingProgram}
            dailyExercises={editingDailyExercises}
            onClose={() => {
              setShowEditForm(false);
              setEditingProgram(null);
            }}
            onUpdate={handleUpdateProgram}
            availableExercises={availableExercises}
            updating={updatingProgram}
          />

          {/* Search Bar */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by program name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredPrograms.length} programs found
              </p>
            </div>
          </Card>

          {/* Programs Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Enrolled Users</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map((program) => (
                    <TableRow key={program.programId}>
                      <TableCell className="font-semibold">
                        {program.programName}
                      </TableCell>
                      <TableCell>{program.duration || "30 Days"}</TableCell>
                      <TableCell>{program.enrolledUsers} users</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${program.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {Math.round(program.completionRate)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {"★".repeat(Math.floor(program.averageRating))}
                          <span className="text-sm text-muted-foreground">
                            ({program.averageRating.toFixed(1)})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProgram(program)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProgram(program)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeleteProgram(program.programId)
                            }
                            disabled={deletingId === program.programId}
                          >
                            {deletingId === program.programId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No programs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Program Details Modal */}
          {selectedProgram && programDetail && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2">
                    <h2 className="text-2xl font-bold">{programDetail.name}</h2>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedProgram(null);
                        setProgramDetail(null);
                      }}
                    >
                      ✕
                    </Button>
                  </div>

                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Description */}
                      {programDetail.description && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Description
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {programDetail.description}
                          </p>
                        </div>
                      )}

                      {/* Goals */}
                      {programDetail.goals &&
                        programDetail.goals.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Goals
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {programDetail.goals.map((goal, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-primary/10 rounded-md text-sm"
                                >
                                  {goal}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Program Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="w-4 h-4" />
                            <p className="text-xs uppercase font-semibold">
                              Duration
                            </p>
                          </div>
                          <p className="font-bold text-lg">
                            {programDetail.totalDays} Days
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({programDetail.durationWeeks} weeks)
                          </p>
                        </div>

                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Clock className="w-4 h-4" />
                            <p className="text-xs uppercase font-semibold">
                              Per Session
                            </p>
                          </div>
                          <p className="font-bold text-lg">
                            {programDetail.durationPerSession || "N/A"}
                          </p>
                        </div>

                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Flame className="w-4 h-4" />
                            <p className="text-xs uppercase font-semibold">
                              Calories
                            </p>
                          </div>
                          <p className="font-bold text-lg">
                            {programDetail.caloriesPerSession || 0} cal
                          </p>
                        </div>

                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Award className="w-4 h-4" />
                            <p className="text-xs uppercase font-semibold">
                              Difficulty
                            </p>
                          </div>
                          <span
                            className={`inline-block px-2 py-1 rounded-md text-sm font-medium ${
                              programDetail.difficulty === "beginner"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : programDetail.difficulty === "intermediate"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {programDetail.difficulty?.charAt(0).toUpperCase() +
                              programDetail.difficulty?.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Exercises by Day */}
                      {programDetail.planExercises &&
                        programDetail.planExercises.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Dumbbell className="w-5 h-5" />
                              <h3 className="text-lg font-semibold">
                                Workout Plan
                              </h3>
                            </div>

                            {Object.entries(
                              groupExercisesByDay(programDetail.planExercises),
                            ).map(([day, exercises]) => (
                              <div key={day} className="mb-6">
                                <h4 className="font-semibold text-md mb-3 bg-primary/10 px-3 py-2 rounded-md">
                                  {day}
                                </h4>
                                <div className="space-y-3">
                                  {exercises.map((exercise, idx) => (
                                    <div
                                      key={exercise.id}
                                      className="border border-border rounded-lg p-3"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="font-semibold">
                                            {idx + 1}. {exercise.exercise.name}
                                          </p>
                                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                                            <span>Sets: {exercise.sets}</span>
                                            <span>Reps: {exercise.reps}</span>
                                            <span>
                                              Rest: {exercise.restTime}s
                                            </span>
                                          </div>
                                        </div>
                                        {exercise.exercise.videoDemoUrl && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                exercise.exercise.videoDemoUrl,
                                                "_blank",
                                              )
                                            }
                                          >
                                            Watch Demo
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Meta Info */}
                      <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                        <p>
                          Created:{" "}
                          {new Date(
                            programDetail.createdAt,
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          Last Updated:{" "}
                          {new Date(
                            programDetail.updatedAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedProgram(null);
                            setProgramDetail(null);
                          }}
                        >
                          Close
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            handleDeleteProgram(selectedProgram.programId);
                            setSelectedProgram(null);
                            setProgramDetail(null);
                          }}
                        >
                          Delete Program
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
