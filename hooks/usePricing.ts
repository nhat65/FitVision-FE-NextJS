import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

export interface ProgramPricingItem {
  id: string;
  name: string;
  difficulty: string;
  totalDays?: number;
  durationWeeks?: number;
  isPremium: boolean;
  price: number;
  aiMonitoringFee: number;
}

export interface UpdatePricingInput {
  id: string;
  isPremium: boolean;
  price: number;
  aiMonitoringFee: number;
}

// 1. Hook lấy danh sách cấu hình giá của các workout plans
export function useProgramPricings() {
  return useQuery<ProgramPricingItem[]>({
    queryKey: ['pricings'],
    queryFn: () => fetchApi<ProgramPricingItem[]>('/workout-plan/pricing'),
  });
}

// 2. Hook cập nhật giá cho workout plan
export function useUpdateProgramPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...pricingData }: UpdatePricingInput) =>
      fetchApi<{ status: boolean; message: string; data?: any }>(
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

