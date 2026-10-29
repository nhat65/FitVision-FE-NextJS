"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAdmin, getCurrentUser } from "@/lib/user-store";
import {
  useExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
  type ExerciseItem,
} from "@/hooks/useExercises";
import {
  Trash2,
  Eye,
  Plus,
  Edit2,
  Search,
  Loader2,
  Upload,
  X,
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
import { toast } from "@/components/ui/use-toast";
import { EditExerciseModal } from "./edit-exercise-modal";
import { uploadVideoToCloudinary } from "@/lib/uploadVideo";

export default function ExercisesManagement() {
  const router = useRouter();

  // TanStack Query Hooks
  const {
    data: exercises = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useExercises();

  const createExerciseMutation = useCreateExercise();
  const updateExerciseMutation = useUpdateExercise();
  const deleteExerciseMutation = useDeleteExercise();

  // Local UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Form State cho tạo mới Exercise
  const [newExercise, setNewExercise] = useState({
    name: "",
    description: "",
    muscleGroup: "General",
    difficulty: "intermediate",
    instructions: "",
    videoFile: null as File | null,
    videoPreviewUrl: "",
  });

  // Kiểm tra quyền Admin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !isAdmin()) {
      router.push("/login");
    }
  }, [router]);

  // Cleanup preview url khi unmount
  useEffect(() => {
    return () => {
      if (newExercise.videoPreviewUrl) {
        URL.revokeObjectURL(newExercise.videoPreviewUrl);
      }
    };
  }, [newExercise.videoPreviewUrl]);

  // Filter exercises theo tìm kiếm
  const filteredExercises = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return exercises;
    return exercises.filter(
      (exercise) =>
        (exercise.name || "").toLowerCase().includes(term) ||
        (exercise.muscleGroup || "").toLowerCase().includes(term) ||
        (exercise.difficulty || "").toLowerCase().includes(term)
    );
  }, [exercises, searchTerm]);

  // Xử lý chọn video file
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please upload a valid video file (MP4, WebM, OGG, or MOV)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 200 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Video file size must be less than 200MB",
          variant: "destructive",
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setNewExercise((prev) => ({
        ...prev,
        videoFile: file,
        videoPreviewUrl: previewUrl,
      }));
    }
  };

  // Xóa video đã chọn
  const clearVideoFile = () => {
    if (newExercise.videoPreviewUrl) {
      URL.revokeObjectURL(newExercise.videoPreviewUrl);
    }
    setNewExercise((prev) => ({
      ...prev,
      videoFile: null,
      videoPreviewUrl: "",
    }));
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // Thêm Exercise mới
  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      let videoData: {
        url: string;
        publicId: string;
        duration: number;
      } | null = null;

      // Bước 1: Upload video lên Cloudinary nếu có
      if (newExercise.videoFile) {
        videoData = await uploadVideoToCloudinary(
          newExercise.videoFile,
          (percent) => setUploadProgress(percent)
        );
      }

      // Bước 2: Gọi mutation qua React Query
      await createExerciseMutation.mutateAsync({
        name: newExercise.name.trim(),
        description: newExercise.description.trim(),
        muscleGroup: newExercise.muscleGroup,
        difficulty: newExercise.difficulty,
        instructions: newExercise.instructions.trim(),
        videoUrl: videoData?.url,
        videoPublicId: videoData?.publicId,
        videoDuration: videoData?.duration,
      });

      toast({
        title: "Success",
        description: "Exercise created successfully!",
      });

      // Reset form
      clearVideoFile();
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
    } catch (err: any) {
      console.error("Add exercise error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create exercise. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Cập nhật Exercise
  const handleUpdateExercise = async (id: string, data: any) => {
    try {
      setUploading(true);
      let videoData: {
        url: string;
        publicId: string;
        duration: number;
      } | null = null;

      if (data.videoFile) {
        videoData = await uploadVideoToCloudinary(data.videoFile);
      }

      await updateExerciseMutation.mutateAsync({
        id,
        name: data.name,
        description: data.description,
        muscleGroup: data.muscleGroup,
        difficulty: data.difficulty,
        instructions: data.instructions,
        ...(videoData
          ? {
              videoUrl: videoData.url,
              videoPublicId: videoData.publicId,
              videoDuration: videoData.duration,
            }
          : data.removeVideo
          ? { videoUrl: "", videoPublicId: "" }
          : {}),
      });

      toast({
        title: "Success",
        description: "Exercise updated successfully!",
      });
      setEditingExercise(null);
    } catch (err: any) {
      console.error("Update exercise error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update exercise.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Xóa Exercise
  const handleDeleteExercise = async (exercise: ExerciseItem) => {
    if (confirm(`Are you sure you want to delete "${exercise.name}"?`)) {
      try {
        await deleteExerciseMutation.mutateAsync(exercise.id);
        toast({
          title: "Success",
          description: `Exercise "${exercise.name}" deleted successfully`,
        });
      } catch (err: any) {
        console.error("Delete exercise error:", err);
        toast({
          title: "Cannot Delete Exercise",
          description: err.message || "Failed to delete exercise.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading exercises...</p>
        </div>
      </div>
    );
  }

  if (isError && exercises.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1">
          <div className="p-8">
            <Card className="p-8 text-center max-w-lg mx-auto mt-20">
              <h2 className="text-2xl font-bold mb-4">Unable to Load Exercises</h2>
              <p className="text-muted-foreground mb-6">
                {(error as Error)?.message || "Failed to load exercises from server."}
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
              <h1 className="text-3xl font-bold">Exercises Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage exercise library, instructions and demonstration videos
              </p>
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="w-5 h-5" />
              {showAddForm ? "Close Form" : "Add Exercise"}
            </Button>
          </div>

          {/* Add Exercise Form */}
          {showAddForm && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4 text-lg">Add New Exercise</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Exercise Name *
                  </label>
                  <Input
                    placeholder="e.g., Bench Press, Squat, Pull-up..."
                    value={newExercise.name}
                    onChange={(e) =>
                      setNewExercise((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md bg-background min-h-20"
                    placeholder="Describe the exercise..."
                    value={newExercise.description}
                    onChange={(e) =>
                      setNewExercise((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Muscle Group</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={newExercise.muscleGroup}
                      onChange={(e) =>
                        setNewExercise((prev) => ({
                          ...prev,
                          muscleGroup: e.target.value,
                        }))
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
                    <label className="text-sm font-medium mb-2 block">Difficulty</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={newExercise.difficulty}
                      onChange={(e) =>
                        setNewExercise((prev) => ({
                          ...prev,
                          difficulty: e.target.value,
                        }))
                      }
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Instructions</label>
                  <textarea
                    className="w-full p-2 border rounded-md bg-background min-h-28"
                    placeholder="Step-by-step instructions..."
                    value={newExercise.instructions}
                    onChange={(e) =>
                      setNewExercise((prev) => ({
                        ...prev,
                        instructions: e.target.value,
                      }))
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
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>

                    {newExercise.videoFile && (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Selected: {newExercise.videoFile.name} (
                          {(newExercise.videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                        {newExercise.videoPreviewUrl && (
                          <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-black">
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

                    {uploading && uploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Uploading video: {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAddExercise}
                    disabled={uploading || createExerciseMutation.isPending}
                  >
                    {uploading || createExerciseMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Exercise"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearVideoFile();
                      setShowAddForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Search Bar */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by exercise name, muscle group or difficulty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredExercises.length} / {exercises.length} exercises
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
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
                  <TableHead>Video Demo</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-semibold">
                        {exercise.name}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded-md text-sm">
                          {exercise.muscleGroup || "General"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-md text-sm ${
                            exercise.difficulty === "beginner"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
                              : exercise.difficulty === "intermediate"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                          }`}
                        >
                          {exercise.difficulty}
                        </span>
                      </TableCell>
                      <TableCell>
                        {exercise.videoUrl ? (
                          <span className="text-xs text-primary font-medium">Available</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedExercise(exercise)}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingExercise(exercise)}
                            title="Edit exercise"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteExercise(exercise)}
                            disabled={deleteExerciseMutation.isPending}
                            title="Delete exercise"
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
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        ID
                      </p>
                      <p className="font-mono text-sm">{selectedExercise.id}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        Exercise Name
                      </p>
                      <p className="text-xl font-bold">{selectedExercise.name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        Description
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedExercise.description || "No description available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                          Muscle Group
                        </p>
                        <span className="inline-block px-3 py-1 bg-muted rounded-md text-sm font-medium">
                          {selectedExercise.muscleGroup || "General"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                          Difficulty
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
                            selectedExercise.difficulty === "beginner"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
                              : selectedExercise.difficulty === "intermediate"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                          }`}
                        >
                          {selectedExercise.difficulty}
                        </span>
                      </div>
                    </div>

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
                        <p className="text-gray-500 italic">No instructions provided</p>
                      )}
                    </div>

                    {selectedExercise.videoUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-2">
                          Demo Video
                        </p>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <video
                            src={selectedExercise.videoUrl}
                            controls
                            className="absolute inset-0 w-full h-full"
                            controlsList="nodownload"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border flex gap-3">
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
                          handleDeleteExercise(selectedExercise);
                          setSelectedExercise(null);
                        }}
                      >
                        Delete Exercise
                      </Button>
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
        uploading={uploading || updateExerciseMutation.isPending}
      />
    </div>
  );
}
