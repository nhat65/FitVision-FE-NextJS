import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseItem {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  difficulty: DifficultyLevel | string;
  instructions: string;
  videoUrl?: string;
  videoPublicId?: string;
  videoDuration?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExerciseInput {
  name: string;
  description?: string;
  muscleGroup?: string;
  difficulty?: DifficultyLevel | string;
  instructions?: string;
  videoUrl?: string;
  videoPublicId?: string;
  videoDuration?: number;
}

export interface UpdateExerciseInput extends Partial<CreateExerciseInput> {
  id: string;
  removeVideo?: boolean;
}

// 1. Hook lấy danh sách tất cả bài tập
export function useExercises() {
  return useQuery<ExerciseItem[]>({
    queryKey: ['exercises'],
    queryFn: () => fetchApi<ExerciseItem[]>('/exercises'),
  });
}

// 2. Hook lấy chi tiết 1 bài tập theo ID
export function useExercise(id: string) {
  return useQuery<ExerciseItem>({
    queryKey: ['exercises', id],
    queryFn: () => fetchApi<ExerciseItem>(`/exercises/${id}/profile`),
    enabled: Boolean(id),
  });
}

// 3. Hook tạo mới bài tập
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newExercise: CreateExerciseInput) =>
      fetchApi<ExerciseItem>('/exercises', {
        method: 'POST',
        body: JSON.stringify(newExercise),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

// 4. Hook cập nhật bài tập
export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateExerciseInput) =>
      fetchApi<ExerciseItem>('/exercises', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['exercises', variables.id] });
      }
    },
  });
}

// 5. Hook xóa bài tập
export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ status: boolean; message: string }>(`/exercises/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

