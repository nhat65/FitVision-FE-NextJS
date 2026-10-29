// components/admin/edit-exercise-modal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface EditExerciseModalProps {
  isOpen: boolean;
  exercise: {
    id?: string;
    exerciseId?: string;
    name?: string;
    exerciseName?: string;
    description?: string;
    muscleGroup?: string;
    difficulty?: string;
    instructions?: string;
    videoUrl?: string;
    videoDemoUrl?: string;
  } | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  uploading: boolean;
}

export function EditExerciseModal({
  isOpen,
  exercise,
  onClose,
  onUpdate,
  uploading,
}: EditExerciseModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    muscleGroup: "General",
    difficulty: "intermediate",
    instructions: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [existingVideoUrl, setExistingVideoUrl] = useState<
    string | undefined
  >();
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Reset form khi exercise thay đổi
  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.name || exercise.exerciseName || "",
        description: exercise.description || "",
        muscleGroup: exercise.muscleGroup || "General",
        difficulty: exercise.difficulty || "intermediate",
        instructions: exercise.instructions || "",
      });
      setExistingVideoUrl(exercise.videoUrl || exercise.videoDemoUrl);
      // Cleanup preview URL cũ
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      setVideoFile(null);
      setVideoPreviewUrl("");
    }
  }, [exercise]);

  // Cleanup preview URL khi unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  if (!isOpen || !exercise) return null;

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
          description:
            "Please upload a valid video file (MP4, WebM, OGG, or MOV)",
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

      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoPreviewUrl(previewUrl);
    }
  };

  const clearVideoFile = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl("");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    const targetId = exercise.id || exercise.exerciseId;
    if (!targetId) return;

    await onUpdate(targetId, {
      ...formData,
      videoFile,
      removeVideo: !existingVideoUrl && !videoFile,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2">
            <h2 className="text-2xl font-bold">Edit Exercise</h2>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              ✕
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Exercise Name *
              </label>
              <Input
                name="name"
                placeholder="e.g., Bench Press, Squat, Push-up..."
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Description
              </label>
              <textarea
                name="description"
                className="w-full p-2 border rounded-md bg-background min-h-20"
                placeholder="Describe the exercise..."
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Muscle Group
                </label>
                <select
                  name="muscleGroup"
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.muscleGroup}
                  onChange={handleInputChange}
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
                  name="difficulty"
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.difficulty}
                  onChange={handleInputChange}
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
                name="instructions"
                className="w-full p-2 border rounded-md bg-background min-h-30"
                placeholder="Step by step instructions..."
                value={formData.instructions}
                onChange={handleInputChange}
              />
            </div>

            {/* Video Section */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Demo Video
              </label>

              {existingVideoUrl && !videoFile && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    Current video:
                  </p>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <video
                      src={`${process.env.NEXT_PUBLIC_API_URL}${existingVideoUrl}`}
                      controls
                      className="absolute inset-0 w-full h-full"
                      controlsList="nodownload"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-500"
                    onClick={() => {
                      setExistingVideoUrl(undefined);
                      setVideoFile(null);
                    }}
                  >
                    Remove current video
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoFileChange}
                    className="hidden"
                    id="edit-video-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("edit-video-upload")?.click()
                    }
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {videoFile ? "Change Video" : "Upload New Video"}
                  </Button>
                  {videoFile && (
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

                {videoFile && videoPreviewUrl && (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      New video: {videoFile.name} (
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="absolute inset-0 w-full h-full"
                        controlsList="nodownload"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Supported formats: MP4, WebM, OGG, MOV (Max size: 200MB)
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Exercise"
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
