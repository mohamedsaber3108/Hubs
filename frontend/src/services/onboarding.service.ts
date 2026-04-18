import api from '@/lib/api';

export const onboardingService = {
  getStatus: () => api.get('/onboarding').then((r) => r.data.data),
  submit: (data: {
    communities: string[];
    role: string;
    goals: string[];
    skills: string[];
    experience_level: string;
    headline: string;
    bio: string;
    location: string;
  }) => api.post('/onboarding', data).then((r) => r.data),
};
