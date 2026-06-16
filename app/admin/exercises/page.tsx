"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAdmin, getCurrentUser } from "@/lib/user-store";
import {
  deleteExercise,
  getExerciseStats,
  addExercise,
} from "@/lib/admin-store";
import {
  Trash2,
  Eye,
  Plus,
  Edit2,
  Search,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { getAccessToken } from "@/lib/auth-store";
import { toastSuccess } from "@/lib/toast-utils";
import { EditExerciseModal } from "./edit-exercise-modal";

interface ExerciseStat {
  exerciseId: string;
  exerciseName: string;
  description: string;
  muscleGroup: string;
  difficulty: string;
  instructions: string;
  videoDemoUrl?: string; // URL trả về từ server sau khi upload
}

interface ApiExercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  difficulty: string;
  instructions: string;
  videoDemoUrl?: string;
}

export default function ExercisesManagement() {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseStat[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseStat[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseStat | null>(
    null,
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // State cho form thêm exercise với video file
  const [newExercise, setNewExercise] = useState({
    name: "",
    description: "",
    muscleGroup: "General",
    difficulty: "intermediate",
    instructions: "",
    videoFile: null as File | null,
    videoPreviewUrl: "" as string, // Để preview video trước khi upload
  });

  const [editingExercise, setEditingExercise] = useState<ExerciseStat | null>(null);

  // Hàm fetch exercises từ API
  const fetchExercisesFromAPI = async () => {
    try {
      setApiError(null);
      const token = getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/exercises/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform data từ API về format ExerciseStat
      const transformedExercises: ExerciseStat[] = data.data.map(
        (exercise: any) => ({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          description: exercise.description || "",
          muscleGroup: exercise.muscleGroup || "General",
          difficulty: exercise.difficulty || "intermediate",
          instructions: exercise.instructions || "",
          videoDemoUrl: exercise.videoDemoUrl || "",
        }),
      );

      setExercises(transformedExercises);
      setFilteredExercises(transformedExercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      setApiError("Failed to load exercises from server");
      toast({
        title: "Error",
        description: "Failed to load exercises. Please try again later.",
        variant: "destructive",
      });

      // Fallback to local data nếu API fails
      const exercisesData = getExerciseStats();
      const transformedLocalData: ExerciseStat[] = exercisesData.map(
        (exercise: any) => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          description: "",
          muscleGroup: "General",
          difficulty: "intermediate",
          instructions: "",
          videoUrl: "",
        }),
      );
      setExercises(transformedLocalData);
      setFilteredExercises(transformedLocalData);
    } finally {
      setLoading(false);
    }
  };

  // Hàm thêm exercise qua API với video file upload
  const addExerciseViaAPI = async (exerciseData: {
    name: string;
    description: string;
    muscleGroup: string;
    difficulty: string;
    instructions: string;
    videoFile?: File | null;
  }) => {
    try {
      setUploading(true);
      const token = getAccessToken();

      // Tạo FormData object
      const formData = new FormData();
      formData.append("name", exerciseData.name);
      formData.append("description", exerciseData.description);
      formData.append("muscleGroup", exerciseData.muscleGroup);
      formData.append("difficulty", exerciseData.difficulty);
      formData.append("instructions", exerciseData.instructions);

      if (exerciseData.videoFile) {
        formData.append("video", exerciseData.videoFile); // Field name 'video' cho backend
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/exercises/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const newExercise = await response.json();

      toast({
        title: "Success",
        description: "Exercise added successfully",
      });

      await fetchExercisesFromAPI();

      return newExercise;
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add exercise. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Hàm xóa exercise qua API
  const deleteExerciseViaAPI = async (
    exerciseId: string,
    exerciseName?: string,
  ) => {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/exercises/${exerciseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      toastSuccess(data.message, "Delete exercise");

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      await fetchExercisesFromAPI();

      return true;
    } catch (error) {
      console.error("Error deleting exercise:", error);

      // Error toast

      throw error;
    }
  };

  // Hàm update exercise qua API
  const updateExerciseViaAPI = async (
    exerciseId: string,
    exerciseData: {
      name: string;
      description: string;
      muscleGroup: string;
      difficulty: string;
      instructions: string;
      videoFile?: File | null;
      removeVideo?: boolean;
    },
  ) => {
    try {
      setUploading(true);
      const token = getAccessToken();

      // Tạo FormData object
      const formData = new FormData();
      formData.append("name", exerciseData.name);
      formData.append("description", exerciseData.description);
      formData.append("muscleGroup", exerciseData.muscleGroup);
      formData.append("difficulty", exerciseData.difficulty);
      formData.append("instructions", exerciseData.instructions);

      if (exerciseData.removeVideo) {
        formData.append("removeVideo", "true");
      }

      if (exerciseData.videoFile) {
        formData.append("video", exerciseData.videoFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/exercises/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const updatedExercise = await response.json();

      toast({
        title: "Success",
        description: "Exercise updated successfully",
      });

      await fetchExercisesFromAPI();

      return updatedExercise;
    } catch (error) {
      console.error("Error updating exercise:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update exercise. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Xử lý chọn video file
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra loại file
      const validTypes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description:
            "Please upload a valid video file (MP4, WebM, OGG, or MOV)",
          variant: "destructive",
        });
        return;
      }

      // Kiểm tra kích thước file (max 200MB)
      if (file.size > 200 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Video file size must be less than 200MB",
          variant: "destructive",
        });
        return;
      }

      // Tạo preview URL
      const previewUrl = URL.createObjectURL(file);

      setNewExercise({
        ...newExercise,
        videoFile: file,
        videoPreviewUrl: previewUrl,
      });
    }
  };

  // Xóa video đã chọn
  const clearVideoFile = () => {
    if (newExercise.videoPreviewUrl) {
      URL.revokeObjectURL(newExercise.videoPreviewUrl);
    }
    setNewExercise({
      ...newExercise,
      videoFile: null,
      videoPreviewUrl: "",
    });
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !isAdmin()) {
      router.push("/login");
      return;
    }

    fetchExercisesFromAPI();

    // Cleanup preview URL khi unmount
    return () => {
      if (newExercise.videoPreviewUrl) {
        URL.revokeObjectURL(newExercise.videoPreviewUrl);
      }
    };
  }, [router]);

  useEffect(() => {
    const filtered = exercises.filter((exercise) =>
      exercise.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredExercises(filtered);
  }, [searchTerm, exercises]);

  const handleDeleteExercise = async (
    exerciseId: string,
    exerciseName: string,
  ) => {
    if (confirm("Are you sure you want to delete this exercise?")) {
      try {
        await deleteExerciseViaAPI(exerciseId, exerciseName);
      } catch (error) {
        // Error handling is done in deleteExerciseViaAPI
      }
    }
  };

  const handleAddExercise = async () => {
    if (newExercise.name.trim()) {
      try {
        await addExerciseViaAPI({
          name: newExercise.name,
          description: newExercise.description,
          muscleGroup: newExercise.muscleGroup,
          difficulty: newExercise.difficulty,
          instructions: newExercise.instructions,
          videoFile: newExercise.videoFile,
        });

        // Cleanup preview
        if (newExercise.videoPreviewUrl) {
          URL.revokeObjectURL(newExercise.videoPreviewUrl);
        }

        setNewExercise({
          name: "",
          description: "",
          muscleGroup: "General",
          difficulty: "intermediate",
          instructions: "",
          videoFile: null,
          videoPreviewUrl: "",
        });
        setShowAddForm(false);
      } catch (error) {
        // Error handling is done in addExerciseViaAPI
      }
    } else {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
    }
  };

  // Hàm xử lý update
  const handleUpdateExercise = async (id: string, data: any) => {
    try {
      await updateExerciseViaAPI(id, data);
      setEditingExercise(null);
    } catch (error) {
      console.error("Error updating exercise:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-muted-foreground">Loading exercises...</p>
        </div>
      </div>
    );
  }

  if (apiError && exercises.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1">
          <div className="p-8">
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Unable to Load Exercises
              </h2>
              <p className="text-muted-foreground mb-6">{apiError}</p>
              <Button onClick={fetchExercisesFromAPI}>Try Again</Button>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Exercises Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage exercise library
              </p>
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="w-5 h-5" />
              Add Exercise
            </Button>
          </div>

          {/* Add Exercise Form */}
          {showAddForm && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Add New Exercise</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Exercise Name *
                  </label>
                  <Input
                    placeholder="e.g., Bench Press, Squat, Push-up..."
                    value={newExercise.name}
                    onChange={(e) =>
                      setNewExercise({ ...newExercise, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md bg-background min-h-20"
                    placeholder="Describe the exercise..."
                    value={newExercise.description}
                    onChange={(e) =>
                      setNewExercise({
                        ...newExercise,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Muscle Group
                    </label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={newExercise.muscleGroup}
                      onChange={(e) =>
                        setNewExercise({
                          ...newExercise,
                          muscleGroup: e.target.value,
                        })
                      }
                    >
                      <option value="General">General</option>
                      <option value="Chest">Chest</option>
                      <option value="Back">Back</option>
                      <option value="Legs">Legs</option>
                      <option value="Shoulders">Shoulders</option>
                      <option value="Arms">Arms</option>
                      <option value="Core">Core</option>
                      <option value="Cardio">Cardio</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Difficulty
                    </label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={newExercise.difficulty}
                      onChange={(e) =>
                        setNewExercise({
                          ...newExercise,
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
                    Instructions
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md bg-background min-h-30"
                    placeholder="Step by step instructions...
1. Start position...
2. Movement...
3. Return to start..."
                    value={newExercise.instructions}
                    onChange={(e) =>
                      setNewExercise({
                        ...newExercise,
                        instructions: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Video Upload Section */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Demo Video (optional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        onChange={handleVideoFileChange}
                        className="hidden"
                        id="video-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Choose Video File
                      </Button>
                      {newExercise.videoFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearVideoFile}
                          className="text-red-500"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>

                    {newExercise.videoFile && (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Selected: {newExercise.videoFile.name} (
                          {(newExercise.videoFile.size / (1024 * 1024)).toFixed(
                            2,
                          )}{" "}
                          MB)
                        </p>
                        {newExercise.videoPreviewUrl && (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                            <video
                              src={newExercise.videoPreviewUrl}
                              controls
                              className="absolute inset-0 w-full h-full"
                              controlsList="nodownload"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Supported formats: MP4, WebM, OGG, MOV (Max size: 200MB)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleAddExercise} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Add Exercise"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (newExercise.videoPreviewUrl) {
                        URL.revokeObjectURL(newExercise.videoPreviewUrl);
                      }
                      setShowAddForm(false);
                      setNewExercise({
                        name: "",
                        description: "",
                        muscleGroup: "General",
                        difficulty: "intermediate",
                        instructions: "",
                        videoFile: null,
                        videoPreviewUrl: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Search Bar */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by exercise name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground">
                {filteredExercises.length} exercises found
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchExercisesFromAPI}
              >
                Refresh
              </Button>
            </div>
          </Card>

          {/* Exercises Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise Name</TableHead>
                  <TableHead>Muscle Group</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise) => (
                    <TableRow key={exercise.exerciseId}>
                      <TableCell className="font-semibold">
                        {exercise.exerciseName}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded-md text-sm">
                          {exercise.muscleGroup}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-md text-sm ${
                            exercise.difficulty === "beginner"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : exercise.difficulty === "intermediate"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {exercise.difficulty}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedExercise(exercise)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingExercise(exercise)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeleteExercise(
                                exercise.exerciseId,
                                exercise.exerciseName,
                              )
                            }
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
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No exercises found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Exercise Details Modal */}
          {selectedExercise && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2">
                    <h2 className="text-2xl font-bold">Exercise Details</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedExercise(null)}
                      className="h-8 w-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* ID */}
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        ID
                      </p>
                      <p className="font-mono text-sm">
                        {selectedExercise.exerciseId}
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        Exercise Name
                      </p>
                      <p className="text-xl font-bold">
                        {selectedExercise.exerciseName}
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        Description
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedExercise.description ||
                          "No description available"}
                      </p>
                    </div>

                    {/* Muscle Group & Difficulty - Grid layout */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                          Muscle Group
                        </p>
                        <span className="inline-block px-3 py-1 bg-muted rounded-md text-sm font-medium">
                          {selectedExercise.muscleGroup}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                          Difficulty
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
                            selectedExercise.difficulty === "beginner"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : selectedExercise.difficulty === "intermediate"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {selectedExercise.difficulty.charAt(0).toUpperCase() +
                            selectedExercise.difficulty.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-2">
                        Instructions
                      </p>
                      {selectedExercise.instructions ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                            {selectedExercise.instructions}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">
                          No instructions provided
                        </p>
                      )}
                    </div>

                    {/* Video Demo from URL */}
                    {selectedExercise.videoDemoUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-2">
                          Demo Video
                        </p>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <video
                            src={`${process.env.NEXT_PUBLIC_API_URL}${selectedExercise.videoDemoUrl}`}
                            controls
                            className="absolute inset-0 w-full h-full"
                            controlsList="nodownload"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedExercise(null)}
                        >
                          Close
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            handleDeleteExercise(
                              selectedExercise.exerciseId,
                              selectedExercise.exerciseName,
                            );
                            setSelectedExercise(null);
                          }}
                        >
                          Delete Exercise
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
       <EditExerciseModal
        isOpen={!!editingExercise}
        exercise={editingExercise}
        onClose={() => setEditingExercise(null)}
        onUpdate={handleUpdateExercise}
        uploading={uploading}
      />
    </div>
  );
}
