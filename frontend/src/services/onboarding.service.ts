import api from '@/lib/api';
import type { ProfessionalRole } from '@/lib/types';

export interface OnboardingPayload {
  communities: string[];          // community slugs to join
  professional_roles: ProfessionalRole[]; // persona(s) driving differentiation
  goals: string[];
  interests?: string[];
  skills: string[];
  // Backend ENUM: beginner | intermediate | expert
  experience_level: 'beginner' | 'intermediate' | 'expert';
  headline: string;
  bio: string;
  location: string;
}

export const onboardingService = {
  getStatus: () => api.get('/onboarding').then((r) => r.data.data),
  submit: (data: OnboardingPayload) => api.post('/onboarding', data).then((r) => r.data),
};
