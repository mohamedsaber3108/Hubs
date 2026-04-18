import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useMe() {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: userService.getMe,
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoginMutation() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  return useMutation({
    mutationFn: ({ email, password, remember }: { email: string; password: string; remember?: boolean }) =>
      login(email, password, remember),
    onSuccess: () => { toast.success('Welcome back!'); navigate('/dashboard'); },
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Login failed'),
  });
}

export function useRegisterMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => { toast.success('Account created! Please verify your email.'); navigate('/auth/signin'); },
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Registration failed'),
  });
}

export function useLogoutMutation() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => navigate('/'),
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userService.updateMe,
    onSuccess: (u) => { qc.setQueryData(queryKeys.me, u); toast.success('Profile saved'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save'),
  });
}
