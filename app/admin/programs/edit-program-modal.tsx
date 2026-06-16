// components/admin/edit-program-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  X,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

interface AvailableExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  difficulty: string;
}

interface PlanExercise {
  id: string;
  order: number;
  exerciseId: string;
  sets: number;
  reps: string;
  restTime: number;
}

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

interface EditProgramModalProps {
  isOpen: boolean;
  program: EditingProgram | null;
  dailyExercises: {
    [key: string]: PlanExercise[];
  };
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  availableExercises: AvailableExercise[];
  updating: boolean;
}

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

export function EditProgramModal({
  isOpen,
  program,
  dailyExercises: initialExercises,
  onClose,
  onUpdate,
  availableExercises,
  updating,
}: EditProgramModalProps) {
  const [formData, setFormData] = useState<EditingProgram | null>(null);
  const [dailyExercises, setDailyExercises] = useState(initialExercises);
  const [goalInput, setGoalInput] = useState("");
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({
    Monday: true,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });

  // Reset form khi program thay đổi
  useEffect(() => {
    if (program) {
      setFormData(program);
      setDailyExercises(initialExercises);
    }
  }, [program, initialExercises]);

  if (!isOpen || !formData) return null;

  const toggleDay = (day: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const addGoal = () => {
    if (goalInput.trim()) {
      setFormData({
        ...formData,
        goals: [...formData.goals, goalInput.trim()],
      });
      setGoalInput("");
    }
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index),
    });
  };

  const addExerciseToDay = (day: string) => {
    const currentExercises = dailyExercises[day];
    const newExercise = {
      id: `temp-${Date.now()}-${currentExercises.length}`,
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

  const removeExerciseFromDay = (day: string, exerciseId: string) => {
    setDailyExercises((prev) => ({
      ...prev,
      [day]: prev[day].filter((ex) => ex.id !== exerciseId),
    }));
  };

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

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Program name is required");
      return;
    }

    // Tạo planExercises từ dailyExercises (chỉ gửi JSON, không có FormData)
    const planExercises: any[] = [];

    Object.entries(dailyExercises).forEach(([day, exercises]) => {
      exercises.forEach((exercise) => {
        if (exercise.exerciseId) {
          planExercises.push({
            // Chỉ gửi id nếu không phải là exercise mới thêm (không có id tạm thời)
            ...(exercise.id.startsWith("temp-") ? {} : { id: exercise.id }),
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
      id: formData.id,
      name: formData.name,
      description: formData.description,
      goals: formData.goals,
      totalDays: formData.totalDays,
      durationWeeks: formData.durationWeeks,
      durationPerSession: formData.durationPerSession,
      caloriesPerSession: formData.caloriesPerSession,
      difficulty: formData.difficulty,
      sessionsPerWeek: formData.sessionsPerWeek,
      planExercises: planExercises,
    };

    await onUpdate(formData.id, payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2">
            <h2 className="text-2xl font-bold">Edit Program</h2>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              ✕
            </Button>
          </div>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Program Name *
                </label>
                <Input
                  placeholder="e.g., Full Body Strength Plan"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Training sessions per week
                </label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.sessionsPerWeek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sessionsPerWeek: parseInt(e.target.value) as
                        | 3
                        | 4
                        | 5
                        | 6,
                    })
                  }
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
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Difficulty
              </label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value })
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Description
              </label>
              <textarea
                className="w-full p-2 border rounded-md bg-background min-h-24"
                placeholder="Describe the program..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                  onKeyPress={(e) => e.key === "Enter" && addGoal()}
                />
                <Button type="button" onClick={addGoal}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.goals.map((goal, idx) => (
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
                  value={formData.totalDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                  value={formData.durationWeeks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                  value={formData.durationPerSession}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                  value={formData.caloriesPerSession}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caloriesPerSession: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Daily Exercises Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">
                  Weekly Workout Plan
                </label>
                <span className="text-xs text-muted-foreground">
                  {formData.sessionsPerWeek} buổi/tuần
                </span>
              </div>

              <div className="space-y-3">
                {getDaysBySessions(formData.sessionsPerWeek).map((day) => (
                  <div
                    key={day}
                    className="border border-border rounded-lg overflow-hidden"
                  >
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
                          ({dailyExercises[day].length} exercises)
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

                    {expandedDays[day] && (
                      <div className="p-3 space-y-3">
                        {dailyExercises[day].length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-sm">
                            No exercises for{" "}
                            {DAYS_VN[day as keyof typeof DAYS_VN]}. Click "Add
                            Exercise" to add.
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
                                    <option value="">Select Exercise</option>
                                    {availableExercises.map((ex) => (
                                      <option key={ex.id} value={ex.id}>
                                        {ex.name} ({ex.muscleGroup || "General"}
                                        )
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
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Program"
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
