import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { ExerciseItem } from './useExercises';

export interface PlanExerciseItem {
  id?: string;
  planId?: string;
  exerciseId: string;
  dayOfWeek: string;
  order: number;
  sets: number;
  reps: string;
  restTime: number;
  exercise?: ExerciseItem;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramItem {
  id: string;
  name: string;
  description: string;
  goals: string[];
  totalDays: number;
  durationWeeks: number;
  durationPerSession: string;
  caloriesPerSession: number;
  difficulty: string;
  sessionsPerWeek?: number;
  isPremium?: boolean | null;
  price?: number | null;
  aiMonitoringFee?: number | null;
  creatorId?: string;
  planExercises?: PlanExerciseItem[];
  createdAt?: string;
  updatedAt?: string;
  enrolledUsers?: number;
  completionRate?: number;
  averageRating?: number;
}

export interface CreateProgramInput {
  name: string;
  description: string;
  goals: string[];
  totalDays: number;
  durationWeeks: number;
  durationPerSession: string;
  caloriesPerSession: number;
  difficulty: string;
  sessionsPerWeek: number;
  planExercises: {
    exerciseId: string;
    dayOfWeek: string;
    order: number;
    sets: number;
    reps: string;
    restTime: number;
  }[];
}

export interface UpdateProgramInput extends Partial<CreateProgramInput> {
  id: string;
}

export interface UpdatePricingInput {
  id: string;
  isPremium: boolean;
  price: number;
  aiMonitoringFee: number;
}

// 1. Hook lấy danh sách tất cả workout programs
export function usePrograms() {
  return useQuery<ProgramItem[]>({
    queryKey: ['programs'],
    queryFn: () => fetchApi<ProgramItem[]>('/workout-plan'),
  });
}

// 2. Hook lấy chi tiết 1 program theo ID
export function useProgram(id: string | null | undefined) {
  return useQuery<ProgramItem>({
    queryKey: ['programs', id],
    queryFn: () => fetchApi<ProgramItem>(`/workout-plan/${id}`),
    enabled: Boolean(id),
  });
}

// 3. Hook tạo mới program kèm danh sách bài tập theo ngày
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProgram: CreateProgramInput) =>
      fetchApi<{ status: boolean; message: string }>('/workout-plan', {
        method: 'POST',
        body: JSON.stringify(newProgram),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

// 4. Hook cập nhật program
export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProgramInput) =>
      fetchApi<{ status: boolean; message: string }>('/workout-plan', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['programs', variables.id] });
      }
    },
  });
}

// 5. Hook xóa program
export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ status: boolean; message: string }>(`/workout-plan/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

// 6. Hook cập nhật giá cho program
export function useUpdateProgramPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...pricingData }: UpdatePricingInput) =>
      fetchApi<{ status: boolean; message: string }>(
        `/workout-plan/${id}/pricing`,
        {
          method: 'PUT',
          body: JSON.stringify(pricingData),
        }
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricings'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['programs', variables.id] });
      }
    },
  });
}

// 7. Hook lấy danh sách giá các program
export function useProgramPricings() {
  return useQuery<ProgramItem[]>({
    queryKey: ['pricings'],
    queryFn: () => fetchApi<ProgramItem[]>('/workout-plan/pricing'),
  });
}

