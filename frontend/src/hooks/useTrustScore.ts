import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrustIQApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useTrustScore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trustScore, isLoading } = useQuery({
    queryKey: ['trustScore', user?.id],
    queryFn: () => TrustIQApi.getTrustScore(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: scoreHistory } = useQuery({
    queryKey: ['scoreHistory', user?.id],
    queryFn: () => TrustIQApi.getScoreHistory(user!.id),
    enabled: !!user,
  });

  const recalculateMutation = useMutation({
    mutationFn: () => TrustIQApi.recalculateTrustScore(),
    onSuccess: (newScore) => {
      queryClient.setQueryData(['trustScore', user?.id], newScore);
      queryClient.invalidateQueries({ queryKey: ['scoreHistory', user?.id] });
      toast.success('Trust score recalculated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to recalculate trust score');
    },
  });

  const mintBadgeMutation = useMutation({
    mutationFn: () => TrustIQApi.mintBadge(),
    onSuccess: () => {
      toast.success('Trust badge minted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mint trust badge');
    },
  });

  return {
    trustScore,
    scoreHistory,
    isLoading,
    recalculateTrustScore: recalculateMutation.mutate,
    isRecalculating: recalculateMutation.isLoading,
    mintBadge: mintBadgeMutation.mutate,
    isMinting: mintBadgeMutation.isLoading,
  };
}