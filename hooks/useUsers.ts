import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

export interface UserAccount {
  id?: string;
  email: string;
  role?: 'admin' | 'user' | string;
}

export interface UserItem {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  weight?: number;
  height?: number;
  avatarUrl?: string;
  dateOfBirth?: string;
  fitnessLevel?: string;
  fitnessGoal?: string;
  accountId?: string;
  account?: UserAccount;
  createdAt?: string;
  updatedAt?: string;
  lastActive?: string | Date;
  workoutsSessions?: number;
  currentProgram?: string | null;
}

export interface UpdateUserInput {
  fullName?: string;
  weight?: number;
  height?: number;
  dateOfBirth?: string;
  fitnessLevel?: string;
  fitnessGoal?: string;
}

// 1. Hook lấy danh sách tất cả users (dành cho Admin)
export function useUsers() {
  return useQuery<UserItem[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const users = await fetchApi<any[]>('/users');
      return (users || []).map((u: any) => ({
        id: u.id || u.userId,
        fullName: u.fullName || u.userName || 'N/A',
        name: u.fullName || u.userName || 'N/A',
        email: u.account?.email || u.email || 'N/A',
        weight: u.weight,
        height: u.height,
        avatarUrl: u.avatarUrl,
        dateOfBirth: u.dateOfBirth,
        fitnessLevel: u.fitnessLevel,
        fitnessGoal: u.fitnessGoal,
        account: u.account,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        lastActive: u.lastActive || u.updatedAt || u.createdAt || new Date(),
        workoutsSessions: u.workoutsSessions || 0,
        currentProgram: u.currentProgram || null,
      }));
    },
  });
}

// 2. Hook lấy chi tiết user theo ID (Admin view staff/user profile)
export function useUser(id: string | null | undefined) {
  return useQuery<UserItem>({
    queryKey: ['users', id],
    queryFn: () => fetchApi<UserItem>(`/users/${id}/profile`),
    enabled: Boolean(id),
  });
}

// 3. Hook lấy thông tin Profile của chính user đang đăng nhập
export function useUserProfile() {
  return useQuery<UserItem>({
    queryKey: ['users', 'profile'],
    queryFn: () => fetchApi<UserItem>('/users/profile'),
  });
}

// 4. Hook cập nhật thông tin user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserInput) =>
      fetchApi<UserItem>('/users', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// 5. Hook xóa user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      fetchApi<{ status: boolean; message: string }>(`/users/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

