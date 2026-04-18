import api from '@/lib/api';

export interface NomadMessage { role: 'user' | 'assistant'; content: string; }

export const nomadService = {
  chat: (message: string, history: NomadMessage[] = [], community?: string) =>
    api.post<{ success: boolean; data: { reply: string } }>('/nomad/chat', { message, history, community })
      .then((r) => r.data.data.reply),
};
