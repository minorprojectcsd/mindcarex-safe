import api from '@/lib/api';

// ============= Types matching Spring Boot API responses =============

export interface StartSessionResponse {
  sessionId: string;
  status: string;
}

export interface SessionDetails {
  id: string;
  appointment: {
    id: string;
    doctor: { id: string; fullName: string };
    patient: { id: string; fullName: string };
  };
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  summary: string | null;
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
  // POST /api/sessions/{appointmentId}/start - Start session (DOCTOR only)
  async startSession(appointmentId: string): Promise<StartSessionResponse> {
    const response = await api.post<StartSessionResponse>(`/api/sessions/${appointmentId}/start`);
    return response.data;
  },

  // GET /api/sessions/{sessionId} - Get session details
  async getSession(sessionId: string): Promise<SessionDetails> {
    const response = await api.get<SessionDetails>(`/api/sessions/${sessionId}`);
    return response.data;
  },

  // GET /api/sessions/{sessionId}/chat - Get chat history
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/api/sessions/${sessionId}/chat`);
    return response.data;
  },

  // POST /api/sessions/{sessionId}/end - End session (DOCTOR only)
  async endSession(sessionId: string): Promise<string> {
    const response = await api.post<string>(`/api/sessions/${sessionId}/end`);
    return response.data;
  },
};

export default sessionService;
