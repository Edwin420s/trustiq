import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrustIQApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['linkedAccounts', user?.id],
    queryFn: () => TrustIQApi.getLinkedAccounts(user!.id),
    enabled: !!user,
  });

  const linkAccountMutation = useMutation({
    mutationFn: (provider: 'github' | 'linkedin') => TrustIQApi.linkAccount(provider),
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to OAuth flow
        window.location.href = data.url;
      } else {
        queryClient.invalidateQueries({ queryKey: ['linkedAccounts', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['trustScore', user?.id] });
        toast.success('Account linked successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to link account');
    },
  });

  const unlinkAccountMutation = useMutation({
    mutationFn: (accountId: string) => TrustIQApi.unlinkAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedAccounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['trustScore', user?.id] });
      toast.success('Account unlinked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unlink account');
    },
  });

  const verifiedAccounts = accounts?.filter(account => account.verified) || [];
  const unverifiedAccounts = accounts?.filter(account => !account.verified) || [];

  return {
    accounts,
    verifiedAccounts,
    unverifiedAccounts,
    isLoading,
    linkAccount: linkAccountMutation.mutate,
    isLinking: linkAccountMutation.isLoading,
    unlinkAccount: unlinkAccountMutation.mutate,
    isUnlinking: unlinkAccountMutation.isLoading,
  };
}