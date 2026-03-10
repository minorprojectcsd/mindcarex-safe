import api from '@/lib/api';

export interface StartSessionResponse {
  sessionId: string;
  status: string;
}

export interface SessionDetails {
  id: string;
  appointment: {
    id: string;
    doctor: { id: string; fullName: string; user?: { fullName: string } };
    patient: { id: string; fullName: string; user?: { fullName: string } };
  };
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  summary: string | null;
}

/** Helper to extract display name from session participant */
export function getParticipantName(
  participant: { fullName: string; user?: { fullName: string } } | undefined
): string {
  if (!participant) return 'Participant';
  return participant.user?.fullName || participant.fullName || 'Participant';
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

export const sessionService = {
  async startSession(appointmentId: string): Promise<StartSessionResponse> {
    const response = await api.post<StartSessionResponse>(`/api/sessions/${appointmentId}/start`);
    return response.data;
  },

  async joinSession(appointmentId: string): Promise<StartSessionResponse> {
    const response = await api.post<StartSessionResponse>(`/api/sessions/${appointmentId}/start`);
    return response.data;
  },

  async getSession(sessionId: string): Promise<SessionDetails> {
    const response = await api.get<SessionDetails>(`/api/sessions/${sessionId}`);
    return response.data;
  },

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/api/sessions/${sessionId}/chat`);
    return response.data;
  },

  async endSession(sessionId: string): Promise<string> {
    const response = await api.post<string>(`/api/sessions/${sessionId}/end`);
    return response.data;
  },
};

export default sessionService;
