"use client";

import { useEffect, useState, useMemo } from "react";
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
  Dumbbell,
  Award,
  X,
  ChevronUp,
  ChevronDown,
  RefreshCw,
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
import { EditProgramModal } from "./edit-program-modal";
import {
  usePrograms,
  useProgram,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
  type ProgramItem,
  type PlanExerciseItem,
} from "@/hooks/usePrograms";
import { useExercises } from "@/hooks/useExercises";
import { fetchApi } from "@/lib/api";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAYS_VN: Record<string, string> = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ Nhật",
};

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

export default function ProgramsManagement() {
  const router = useRouter();

  // TanStack Query Hooks
  const {
    data: programs = [],
    isLoading: loadingPrograms,
    isError,
    error,
    refetch,
    isFetching,
  } = usePrograms();

  const { data: availableExercises = [], isLoading: loadingExercises } =
    useExercises();

  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const deleteProgramMutation = useDeleteProgram();

  // Local UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState<3 | 4 | 5 | 6>(3);

  // Hook lấy chi tiết program khi bấm View
  const { data: programDetail, isLoading: loadingDetail } = useProgram(
    selectedProgramId
  );

  // State cho Edit Modal
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<EditingProgram | null>(null);
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

  // State cho exercises theo từng ngày (Add Form)
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

  // Kiểm tra quyền Admin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !isAdmin()) {
      router.push("/login");
    }
  }, [router]);

  // Lọc programs theo search term
  const filteredPrograms = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return programs;
    return programs.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.difficulty || "").toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term)
    );
  }, [programs, searchTerm]);

  // Helper lấy danh sách ngày theo số buổi tập/tuần
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

  // Helper gom nhóm exercises theo ngày
  const groupExercisesByDay = (exercises: PlanExerciseItem[] = []) => {
    const grouped = exercises.reduce((acc, exercise) => {
      const day = exercise.dayOfWeek || "Rest";
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(exercise);
      return acc;
    }, {} as Record<string, PlanExerciseItem[]>);

    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return grouped;
  };

  // Goals handler
  const addGoal = () => {
    if (goalInput.trim()) {
      setNewProgram((prev) => ({
        ...prev,
        goals: [...prev.goals, goalInput.trim()],
      }));
      setGoalInput("");
    }
  };

  const removeGoal = (index: number) => {
    setNewProgram((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  // Toggle ngày trong Add Form
  const toggleDay = (day: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  // Exercise handlers trong Add Form
  const addExerciseToDay = (day: string) => {
    const currentExercises = dailyExercises[day] || [];
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
      [day]: [...(prev[day] || []), newExercise],
    }));
  };

  const removeExerciseFromDay = (day: string, exerciseId: string) => {
    setDailyExercises((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((ex) => ex.id !== exerciseId),
    }));
  };

  const updateExerciseInDay = (
    day: string,
    exerciseId: string,
    field: string,
    value: any
  ) => {
    setDailyExercises((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((ex) =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      ),
    }));
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

  // Tạo Program mới
  const handleCreateProgram = async () => {
    if (!newProgram.name.trim()) {
      toast.error("Program name is required");
      return;
    }

    try {
      const planExercises: {
        exerciseId: string;
        dayOfWeek: string;
        order: number;
        sets: number;
        reps: string;
        restTime: number;
      }[] = [];

      Object.entries(dailyExercises).forEach(([day, exercises]) => {
        exercises.forEach((exercise) => {
          if (exercise.exerciseId) {
            planExercises.push({
              exerciseId: exercise.exerciseId,
              dayOfWeek: day,
              order: exercise.order,
              sets: Number(exercise.sets) || 3,
              reps: String(exercise.reps || "10-12"),
              restTime: Number(exercise.restTime) || 60,
            });
          }
        });
      });

      await createProgramMutation.mutateAsync({
        name: newProgram.name.trim(),
        description: newProgram.description.trim(),
        goals: newProgram.goals,
        totalDays: Number(newProgram.totalDays) || 30,
        durationWeeks: Number(newProgram.durationWeeks) || 4,
        durationPerSession: newProgram.durationPerSession || "1 hour",
        caloriesPerSession: Number(newProgram.caloriesPerSession) || 400,
        difficulty: newProgram.difficulty,
        sessionsPerWeek: sessionsPerWeek,
        planExercises,
      });

      toast.success("Program created successfully");
      setShowAddForm(false);
      resetForm();
    } catch (err: any) {
      console.error("Error creating program:", err);
      toast.error(err.message || "Failed to create program");
    }
  };

  // Mở modal Edit Program
  const handleEditProgram = async (program: ProgramItem) => {
    try {
      // Lấy data chi tiết qua fetchApi (có cache hoặc gọi API mới nhất)
      const programData = await fetchApi<ProgramItem>(
        `/workout-plan/${program.id}`
      );

      setEditingProgram({
        id: programData.id,
        name: programData.name,
        description: programData.description || "",
        goals: programData.goals || [],
        totalDays: programData.totalDays || 30,
        durationWeeks: programData.durationWeeks || 4,
        durationPerSession: programData.durationPerSession || "1 hour",
        caloriesPerSession: programData.caloriesPerSession || 400,
        difficulty: programData.difficulty || "beginner",
        sessionsPerWeek: (programData.sessionsPerWeek as 3 | 4 | 5 | 6) || 3,
      });

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
        if (exercisesByDay[day]) {
          exercisesByDay[day].push({
            id: exercise.id,
            order: exercise.order,
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            restTime: exercise.restTime,
          });
        }
      });

      Object.keys(exercisesByDay).forEach((day) => {
        exercisesByDay[day].sort((a, b) => a.order - b.order);
      });

      setEditingDailyExercises(exercisesByDay);
      setShowEditForm(true);
    } catch (err: any) {
      console.error("Error fetching program for edit:", err);
      toast.error("Failed to load program data for editing");
    }
  };

  // Lưu cập nhật Program
  const handleUpdateProgram = async (id: string, payload: any) => {
    try {
      await updateProgramMutation.mutateAsync({
        ...payload,
        id,
      });

      toast.success("Program updated successfully");
      setShowEditForm(false);
      setEditingProgram(null);
    } catch (err: any) {
      console.error("Error updating program:", err);
      toast.error(err.message || "Failed to update program");
      throw err;
    }
  };

  // Xóa Program
  const handleDeleteProgram = async (programId: string, programName?: string) => {
    if (confirm(`Are you sure you want to delete "${programName || "this program"}"?`)) {
      try {
        await deleteProgramMutation.mutateAsync(programId);
        toast.success("Program deleted successfully");
        if (selectedProgramId === programId) {
          setSelectedProgramId(null);
        }
      } catch (err: any) {
        console.error("Error deleting program:", err);
        toast.error(err.message || "Failed to delete program");
      }
    }
  };

  if (loadingPrograms) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (isError && programs.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1">
          <div className="p-8">
            <Card className="p-8 text-center max-w-lg mx-auto mt-20">
              <h2 className="text-2xl font-bold mb-4">Unable to Load Programs</h2>
              <p className="text-muted-foreground mb-6">
                {(error as Error)?.message || "Failed to load workout programs from server."}
              </p>
              <Button onClick={() => refetch()} className="flex items-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Workout Programs</h1>
              <p className="text-muted-foreground mt-2">
                Manage all workout programs, training schedules and assigned exercises
              </p>
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="w-5 h-5" />
              {showAddForm ? "Close Form" : "Add Program"}
            </Button>
          </div>

          {/* Add Program Form */}
          {showAddForm && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4 text-lg">Add New Program</h3>
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
                  <label className="text-sm font-medium mb-2 block">Goals</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="e.g., Increase strength"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                    />
                    <Button type="button" onClick={addGoal}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newProgram.goals.map((goal, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-primary/10 rounded-md text-sm flex items-center gap-1.5"
                      >
                        {goal}
                        <X
                          className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-foreground"
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
                          totalDays: parseInt(e.target.value) || 0,
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
                          durationWeeks: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Per Session
                    </label>
                    <Input
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
                      Calories / Session
                    </label>
                    <Input
                      type="number"
                      value={newProgram.caloriesPerSession}
                      onChange={(e) =>
                        setNewProgram({
                          ...newProgram,
                          caloriesPerSession: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Sessions Per Week Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Sessions Per Week
                  </label>
                  <div className="flex gap-2">
                    {([3, 4, 5, 6] as const).map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant={sessionsPerWeek === num ? "default" : "outline"}
                        onClick={() => setSessionsPerWeek(num)}
                        size="sm"
                      >
                        {num} days/week
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Exercises by Day Schedule */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-md mb-3">Weekly Schedule</h4>
                  <div className="space-y-4">
                    {getDaysBySessions(sessionsPerWeek).map((day) => (
                      <div key={day} className="border border-border rounded-lg p-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleDay(day)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {DAYS_VN[day] || day} ({day})
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {dailyExercises[day]?.length || 0} exercises
                            </span>
                          </div>
                          {expandedDays[day] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>

                        {expandedDays[day] && (
                          <div className="mt-4 space-y-3">
                            {(dailyExercises[day] || []).map((ex, index) => (
                              <div
                                key={ex.id}
                                className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-lg"
                              >
                                <span className="text-xs font-mono font-bold w-6">
                                  #{index + 1}
                                </span>
                                <div className="flex-1 min-w-[180px]">
                                  <select
                                    className="w-full p-2 border rounded-md bg-background text-sm"
                                    value={ex.exerciseId}
                                    onChange={(e) =>
                                      updateExerciseInDay(
                                        day,
                                        ex.id,
                                        "exerciseId",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">Select Exercise</option>
                                    {availableExercises.map((ae) => (
                                      <option key={ae.id} value={ae.id}>
                                        {ae.name} ({ae.muscleGroup || "General"})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="w-20">
                                  <Input
                                    type="number"
                                    placeholder="Sets"
                                    value={ex.sets}
                                    onChange={(e) =>
                                      updateExerciseInDay(
                                        day,
                                        ex.id,
                                        "sets",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="text-sm"
                                  />
                                </div>
                                <div className="w-24">
                                  <Input
                                    placeholder="Reps"
                                    value={ex.reps}
                                    onChange={(e) =>
                                      updateExerciseInDay(
                                        day,
                                        ex.id,
                                        "reps",
                                        e.target.value
                                      )
                                    }
                                    className="text-sm"
                                  />
                                </div>
                                <div className="w-24">
                                  <Input
                                    type="number"
                                    placeholder="Rest (s)"
                                    value={ex.restTime}
                                    onChange={(e) =>
                                      updateExerciseInDay(
                                        day,
                                        ex.id,
                                        "restTime",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="text-sm"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExerciseFromDay(day, ex.id)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addExerciseToDay(day)}
                              className="w-full flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> Add Exercise to {day}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateProgram}
                    disabled={createProgramMutation.isPending}
                  >
                    {createProgramMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Program"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
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
            updating={updateProgramMutation.isPending}
          />

          {/* Search Bar */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by program name, difficulty or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredPrograms.length} / {programs.length} programs
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </Card>

          {/* Programs Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-semibold">
                        {program.name || "Untitled Program"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-md text-sm ${
                            program.difficulty === "beginner"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
                              : program.difficulty === "intermediate"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                          }`}
                        >
                          {program.difficulty}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {program.totalDays || 30} Days (
                          {program.durationWeeks || 4} wks)
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {program.sessionsPerWeek || 3} days / week
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProgramId(program.id)}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProgram(program)}
                            title="Edit program"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeleteProgram(program.id, program.name)
                            }
                            disabled={deleteProgramMutation.isPending}
                            title="Delete program"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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
          {selectedProgramId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2">
                    <h2 className="text-2xl font-bold">
                      {programDetail?.name || "Program Details"}
                    </h2>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedProgramId(null)}
                      className="h-8 w-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>

                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : programDetail ? (
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
                      {programDetail.goals && programDetail.goals.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Goals</p>
                          <div className="flex flex-wrap gap-2">
                            {programDetail.goals.map((goal, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 bg-primary/10 rounded-md text-sm font-medium"
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
                            <p className="text-xs uppercase font-semibold">Duration</p>
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
                            <p className="text-xs uppercase font-semibold">Calories</p>
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
                            className={`inline-block px-2 py-0.5 rounded-md text-sm font-medium ${
                              programDetail.difficulty === "beginner"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
                                : programDetail.difficulty === "intermediate"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                            }`}
                          >
                            {programDetail.difficulty?.charAt(0).toUpperCase() +
                              programDetail.difficulty?.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Exercises by Day Schedule */}
                      {programDetail.planExercises &&
                        programDetail.planExercises.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Dumbbell className="w-5 h-5" />
                              <h3 className="text-lg font-semibold">
                                Workout Schedule
                              </h3>
                            </div>

                            {Object.entries(
                              groupExercisesByDay(programDetail.planExercises)
                            ).map(([day, dayExercises]) => (
                              <div key={day} className="mb-6">
                                <h4 className="font-semibold text-md mb-3 bg-primary/10 px-3 py-2 rounded-md">
                                  {DAYS_VN[day] || day} ({day})
                                </h4>
                                <div className="space-y-3">
                                  {dayExercises.map((pe, idx) => (
                                    <div
                                      key={pe.id || idx}
                                      className="border border-border rounded-lg p-3"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="font-semibold">
                                            {idx + 1}.{" "}
                                            {pe.exercise?.name || "Exercise"}
                                          </p>
                                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                                            <span>Sets: {pe.sets}</span>
                                            <span>Reps: {pe.reps}</span>
                                            <span>Rest: {pe.restTime}s</span>
                                          </div>
                                        </div>
                                        {pe.exercise?.videoUrl && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                pe.exercise?.videoUrl,
                                                "_blank"
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
                        {programDetail.createdAt && (
                          <p>
                            Created:{" "}
                            {new Date(programDetail.createdAt).toLocaleDateString()}
                          </p>
                        )}
                        {programDetail.updatedAt && (
                          <p>
                            Last Updated:{" "}
                            {new Date(programDetail.updatedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedProgramId(null)}
                        >
                          Close
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            handleDeleteProgram(
                              programDetail.id,
                              programDetail.name
                            );
                            setSelectedProgramId(null);
                          }}
                        >
                          Delete Program
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      Program details not found.
                    </p>
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
