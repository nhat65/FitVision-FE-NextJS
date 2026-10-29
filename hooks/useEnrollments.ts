import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { ProgramItem } from './usePrograms';

/* ---------- Types ---------- */

export interface UserProgressDay {
  id: string;
  userProgressId: string;
  dayNumber: number;
  weekNumber: number;
  totalCalories: number;
  totalTime: number;
  completed: boolean;
  completedAt: string | null;
}

export interface EnrollmentItem {
  id: string;
  accountId: string;
  planId: string;
  startDate: string;
  currentWeek: number;
  completed: boolean;
  notes: string | null;
  userProgressDay?: UserProgressDay[];
  plan?: ProgramItem;
}

/* ---------- Query keys (tập trung một chỗ để invalidate cho dễ) ---------- */

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  mine: () => [...enrollmentKeys.all, 'mine'] as const,
  completedDays: (planId: string | null | undefined) =>
    [...enrollmentKeys.all, 'completed-days', planId] as const,
  myPrograms: () => [...enrollmentKeys.all, 'my-programs'] as const,
};

/* ---------- Helper dùng chung cho mọi trang ---------- */

// Payload: data[].userProgressDay[] -> danh sách dayNumber đã hoàn thành
export function extractCompletedDays(
  enrollments: EnrollmentItem[] = [],
): number[] {
  const days = enrollments
    .flatMap((e) => e.userProgressDay ?? [])
    .filter((d) => d.completed)
    .map((d) => Number(d.dayNumber))
    .filter((n) => Number.isFinite(n));

  return Array.from(new Set(days));
}

/* ---------- Queries ---------- */

// Danh sách enrollment của user hiện tại. Truyền enabled=false khi chưa đăng nhập.
export function useMyEnrollments(enabled = true) {
  return useQuery<EnrollmentItem[]>({
    queryKey: enrollmentKeys.mine(),
    queryFn: () => fetchApi<EnrollmentItem[]>('/user-enrollment/'),
    enabled,
  });
}

// Các ngày đã hoàn thành của 1 plan -> trả thẳng number[] nhờ `select`
export function useCompletedDays(
  planId: string | null | undefined,
  enabled = true,
) {
  return useQuery<EnrollmentItem[], Error, number[]>({
    queryKey: enrollmentKeys.completedDays(planId),
    queryFn: () =>
      fetchApi<EnrollmentItem[]>(`/user-enrollment/${planId}/completed-days`),
    select: extractCompletedDays,
    enabled: Boolean(planId) && enabled,
    staleTime: 0, // tiến độ cần luôn mới, không dùng staleTime 3 phút mặc định
  });
}

// Dành cho trang /my-programs
export function useMyPrograms(enabled = true) {
  return useQuery<EnrollmentItem[]>({
    queryKey: enrollmentKeys.myPrograms(),
    queryFn: () => fetchApi<EnrollmentItem[]>('/user-progress/my-program'),
    enabled,
    staleTime: 0,
  });
}

/* ---------- Mutations ---------- */

export function useEnroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      fetchApi<{ status: boolean; message: string }>('/user-enrollment/', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}

export interface CompleteDayInput {
  planId: string;
  dayNumber: number;
  totalCalories: number;
  totalTime: number;
}

export function useCompleteDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompleteDayInput) =>
      fetchApi<{ status: boolean; message: string }>(
        '/user-progress/complete-day',
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
      ),
    onSuccess: (_, variables) => {
      // Làm mới tiến độ của plan này và danh sách my-programs
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.completedDays(variables.planId),
      });
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.myPrograms() });
    },
  });
}