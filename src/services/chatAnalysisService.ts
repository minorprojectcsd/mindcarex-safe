import type { ChatAnalysisResult } from '@/types/chatAnalysis';

const BASE = import.meta.env.VITE_API_CHAT_URL || 'https://mindcarex-chat-api.onrender.com';

async function unwrap<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (body.success === false) {
    throw new Error(body.error || body.detail || 'Request failed');
  }
  return (body.data ?? body) as T;
}

export const chatAnalysisService = {
  async analyze(file: File, user = 'Overall'): Promise<ChatAnalysisResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('user', user);

    const res = await fetch(`${BASE}/api/analysis/chat/analyze`, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(
        err?.detail || err?.error || `Upload failed (${res.status})`
      );
    }

    return unwrap<ChatAnalysisResult>(res);
  },

  async getSession(sessionId: string): Promise<ChatAnalysisResult> {
    const res = await fetch(`${BASE}/api/analysis/chat/${sessionId}`);
    return unwrap<ChatAnalysisResult>(res);
  },

  async getRisk(sessionId: string) {
    const res = await fetch(`${BASE}/api/analysis/chat/${sessionId}/risk`);
    return unwrap(res);
  },

  async getMentalHealth(sessionId: string) {
    const res = await fetch(`${BASE}/api/analysis/chat/${sessionId}/mental-health`);
    return unwrap(res);
  },

  async getSentimentTimeline(sessionId: string) {
    const res = await fetch(`${BASE}/api/analysis/chat/${sessionId}/sentiment-timeline`);
    return unwrap(res);
  },
};
