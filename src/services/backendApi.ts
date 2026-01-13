// Spring Boot & Flask API calls (used when backends are deployed)
import { API_CONFIG, getSpringHeaders, getFlaskHeaders, handleApiResponse } from '@/config/api';
import type {
  Session,
  Schedule,
  Patient,
  User,
  EmotionFrameRequest,
  EmotionFrameResponse,
  ChatAnalysisRequest,
  ChatAnalysis,
  SessionSummaryRequest,
} from '@/types';

const { SPRING_BOOT_URL, FLASK_URL } = API_CONFIG;

// ============= Spring Boot APIs =============

export const springAuthApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${SPRING_BOOT_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleApiResponse(res);
  },

  async register(data: { email: string; password: string; name: string; role: string }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${SPRING_BOOT_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${SPRING_BOOT_URL}/auth/me`, {
      headers: getSpringHeaders(),
    });
    return handleApiResponse(res);
  },

  async refreshToken(): Promise<{ token: string }> {
    const res = await fetch(`${SPRING_BOOT_URL}/auth/refresh`, {
      method: 'POST',
      headers: getSpringHeaders(),
    });
    return handleApiResponse(res);
  },
};

export const springScheduleApi = {
  async createSchedule(schedule: Omit<Schedule, 'id'>): Promise<Schedule> {
    const res = await fetch(`${SPRING_BOOT_URL}/schedules`, {
      method: 'POST',
      headers: getSpringHeaders(),
      body: JSON.stringify(schedule),
    });
    return handleApiResponse(res);
  },

  async getDoctorSchedules(doctorId: string): Promise<Schedule[]> {
    const res = await fetch(`${SPRING_BOOT_URL}/schedules/doctor/${doctorId}`, {
      headers: getSpringHeaders(),
    });
    return handleApiResponse(res);
  },

  async getPatientSchedules(patientId: string): Promise<Schedule[]> {
    const res = await fetch(`${SPRING_BOOT_URL}/schedules/patient/${patientId}`, {
      headers: getSpringHeaders(),
    });
    return handleApiResponse(res);
  },

  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<void> {
    const res = await fetch(`${SPRING_BOOT_URL}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: getSpringHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to update schedule' }));
      throw new Error(error.message);
    }
  },

  async cancelSchedule(scheduleId: string): Promise<void> {
    await this.updateSchedule(scheduleId, { status: 'cancelled' });
  },
};

export const springSessionApi = {
  async startSession(doctorId: string, patientId: string): Promise<Session> {
    const res = await fetch(`${SPRING_BOOT_URL}/sessions/start`, {
      method: 'POST',
      headers: getSpringHeaders(),
      body: JSON.stringify({ doctorId, patientId }),
    });
    return handleApiResponse(res);
  },

  async endSession(sessionId: string): Promise<Session> {
    const res = await fetch(`${SPRING_BOOT_URL}/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: getSpringHeaders(),
    });
    return handleApiResponse(res);
  },

  async getSession(sessionId: string): Promise<Session | null> {
    const res = await fetch(`${SPRING_BOOT_URL}/sessions/${sessionId}`, {
      headers: getSpringHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async getSessionHistory(userId: string): Promise<Session[]> {
    const res = await fetch(`${SPRING_BOOT_URL}/sessions/history/${userId}`, {
      headers: getSpringHeaders(),
    });
    return handleApiResponse(res);
  },

  async getMessages(sessionId: string) {
    const res = await fetch(`${SPRING_BOOT_URL}/sessions/${sessionId}/messages`, {
      headers: getSpringHeaders(),
    });
    return handleApiResponse(res);
  },

  async sendMessage(sessionId: string, content: string) {
    const res = await fetch(`${SPRING_BOOT_URL}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: getSpringHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleApiResponse(res);
  },
};

export const springPatientApi = {
  async getPatients(doctorId: string): Promise<Patient[]> {
    const res = await fetch(`${SPRING_BOOT_URL}/doctors/${doctorId}/patients`, {
      headers: getSpringHeaders(),
    });
    return handleApiResponse(res);
  },

  async getPatient(patientId: string): Promise<Patient | null> {
    const res = await fetch(`${SPRING_BOOT_URL}/patients/${patientId}`, {
      headers: getSpringHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },
};

// ============= Flask ML/AI APIs =============

export const flaskAiApi = {
  async analyzeEmotionFrame(data: EmotionFrameRequest): Promise<EmotionFrameResponse> {
    const res = await fetch(`${FLASK_URL}/emotion-frame`, {
      method: 'POST',
      headers: getFlaskHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(res);
  },

  async analyzeChatMessages(data: ChatAnalysisRequest): Promise<ChatAnalysis> {
    const res = await fetch(`${FLASK_URL}/chat-analysis`, {
      method: 'POST',
      headers: getFlaskHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(res);
  },

  async generateSessionSummary(data: SessionSummaryRequest): Promise<{ summary: string }> {
    const res = await fetch(`${FLASK_URL}/session-summary`, {
      method: 'POST',
      headers: getFlaskHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(res);
  },
};
