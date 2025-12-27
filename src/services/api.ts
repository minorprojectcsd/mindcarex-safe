import {
  Session,
  Schedule,
  EmotionMetrics,
  ChatMessage,
  Patient,
  ConsentSettings,
  User,
  EmotionFrameRequest,
  EmotionFrameResponse,
  ChatAnalysisRequest,
  SessionSummaryRequest,
  ChatAnalysis,
} from '@/types';
import {
  mockSessions,
  mockSchedules,
  mockEmotionMetrics,
  mockChatMessages,
  mockPatients,
} from './mockData';

// API Base URLs - Configure for production
const SPRING_API_BASE = import.meta.env.VITE_SPRING_API_URL || '/api';
const FLASK_API_BASE = import.meta.env.VITE_FLASK_API_URL || '/ai';

// Simulated API delay for mock mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const USE_MOCK = true; // Toggle for development

// ============= Spring Boot APIs =============

// Authentication API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (USE_MOCK) {
      await delay(500);
      // Mock login logic
      if (email === 'patient@demo.com' && password === 'demo123') {
        return {
          user: { id: 'patient-1', name: 'Sarah Johnson', role: 'PATIENT', created_at: new Date().toISOString(), email },
          token: 'mock-jwt-token',
        };
      }
      if (email === 'doctor@demo.com' && password === 'demo123') {
        return {
          user: { id: 'doctor-1', name: 'Dr. Michael Chen', role: 'DOCTOR', created_at: new Date().toISOString(), email },
          token: 'mock-jwt-token',
        };
      }
      throw new Error('Invalid credentials');
    }
    const res = await fetch(`${SPRING_API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async register(data: { email: string; password: string; name: string; role: string }): Promise<{ user: User; token: string }> {
    if (USE_MOCK) {
      await delay(500);
      return {
        user: { id: `user-${Date.now()}`, name: data.name, role: data.role as 'PATIENT' | 'DOCTOR', created_at: new Date().toISOString(), email: data.email },
        token: 'mock-jwt-token',
      };
    }
    const res = await fetch(`${SPRING_API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async getMe(): Promise<User> {
    if (USE_MOCK) {
      await delay(200);
      throw new Error('No session');
    }
    const res = await fetch(`${SPRING_API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },
};

// Users API
export const usersApi = {
  async getAllUsers(): Promise<User[]> {
    if (USE_MOCK) {
      await delay(400);
      return [...mockPatients];
    }
    const res = await fetch(`${SPRING_API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUser(userId: string): Promise<User | null> {
    if (USE_MOCK) {
      await delay(300);
      return mockPatients.find(p => p.id === userId) || null;
    }
    const res = await fetch(`${SPRING_API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) return null;
    return res.json();
  },
};

// Schedule API
export const scheduleApi = {
  async createSchedule(schedule: Omit<Schedule, 'id'>): Promise<Schedule> {
    if (USE_MOCK) {
      await delay(500);
      const newSchedule: Schedule = {
        ...schedule,
        id: `schedule-${Date.now()}`,
      };
      mockSchedules.push(newSchedule);
      return newSchedule;
    }
    const res = await fetch(`${SPRING_API_BASE}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(schedule),
    });
    if (!res.ok) throw new Error('Failed to create schedule');
    return res.json();
  },

  async getDoctorSchedules(doctorId: string): Promise<Schedule[]> {
    if (USE_MOCK) {
      await delay(400);
      return mockSchedules.filter(s => s.doctor_id === doctorId);
    }
    const res = await fetch(`${SPRING_API_BASE}/schedules/doctor/${doctorId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) throw new Error('Failed to fetch schedules');
    return res.json();
  },

  async getPatientSchedules(patientId: string): Promise<Schedule[]> {
    if (USE_MOCK) {
      await delay(400);
      return mockSchedules.filter(s => s.patient_id === patientId);
    }
    const res = await fetch(`${SPRING_API_BASE}/schedules/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) throw new Error('Failed to fetch schedules');
    return res.json();
  },

  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<void> {
    if (USE_MOCK) {
      await delay(400);
      const idx = mockSchedules.findIndex(s => s.id === scheduleId);
      if (idx !== -1) {
        mockSchedules[idx] = { ...mockSchedules[idx], ...updates };
      }
      return;
    }
    const res = await fetch(`${SPRING_API_BASE}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update schedule');
  },

  async cancelSchedule(scheduleId: string): Promise<void> {
    if (USE_MOCK) {
      await delay(300);
      const idx = mockSchedules.findIndex(s => s.id === scheduleId);
      if (idx !== -1) {
        mockSchedules[idx].status = 'cancelled';
      }
      return;
    }
    await this.updateSchedule(scheduleId, { status: 'cancelled' });
  },
};

// Session API
export const sessionApi = {
  async startSession(doctorId: string, patientId: string): Promise<Session> {
    if (USE_MOCK) {
      await delay(500);
      const session: Session = {
        id: `session-${Date.now()}`,
        doctor_id: doctorId,
        patient_id: patientId,
        start_time: new Date().toISOString(),
        end_time: null,
        status: 'in-progress',
      };
      return session;
    }
    const res = await fetch(`${SPRING_API_BASE}/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ doctorId, patientId }),
    });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  async endSession(sessionId: string): Promise<Session> {
    if (USE_MOCK) {
      await delay(500);
      const session = mockSessions.find(s => s.id === sessionId);
      if (session) {
        session.status = 'completed';
      }
      return {
        id: sessionId,
        doctor_id: 'doctor-1',
        patient_id: 'patient-1',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        status: 'completed',
      };
    }
    const res = await fetch(`${SPRING_API_BASE}/sessions/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error('Failed to end session');
    return res.json();
  },

  async getSession(sessionId: string): Promise<Session | null> {
    if (USE_MOCK) {
      await delay(300);
      return mockSessions.find(s => s.id === sessionId) || null;
    }
    const res = await fetch(`${SPRING_API_BASE}/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) return null;
    return res.json();
  },

  async getSessionHistory(userId: string): Promise<Session[]> {
    if (USE_MOCK) {
      await delay(400);
      return mockSessions.filter(s => s.patient_id === userId || s.doctor_id === userId);
    }
    const res = await fetch(`${SPRING_API_BASE}/sessions/history/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) throw new Error('Failed to fetch session history');
    return res.json();
  },

  // Legacy compatibility methods
  async getSessions(userId: string, role: 'PATIENT' | 'DOCTOR'): Promise<Session[]> {
    return this.getSessionHistory(userId);
  },

  async getEmotionMetrics(sessionId: string): Promise<EmotionMetrics | null> {
    await delay(400);
    return sessionId === 'session-1' ? mockEmotionMetrics : null;
  },

  async getChatTranscript(sessionId: string): Promise<ChatMessage[]> {
    await delay(300);
    return mockChatMessages.filter(m => m.sessionId === sessionId);
  },
};

// ============= Flask ML/AI APIs =============

export const aiApi = {
  async analyzeEmotionFrame(data: EmotionFrameRequest): Promise<EmotionFrameResponse> {
    if (USE_MOCK) {
      await delay(200);
      const emotions = ['happy', 'sad', 'neutral', 'angry', 'stressed'] as const;
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      return {
        emotion,
        confidence: 0.75 + Math.random() * 0.2,
        rollingAverage: {
          happy: 0.3 + Math.random() * 0.2,
          sad: 0.1 + Math.random() * 0.1,
          neutral: 0.4 + Math.random() * 0.2,
          angry: Math.random() * 0.05,
          stressed: 0.1 + Math.random() * 0.1,
        },
      };
    }
    const res = await fetch(`${FLASK_API_BASE}/emotion-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to analyze emotion');
    return res.json();
  },

  async analyzeChatMessages(data: ChatAnalysisRequest): Promise<ChatAnalysis> {
    if (USE_MOCK) {
      await delay(500);
      return {
        session_id: data.sessionId,
        sentiment: 'positive',
        risk_score: 0.15,
        keywords: ['anxiety', 'improvement', 'coping', 'progress'],
      };
    }
    const res = await fetch(`${FLASK_API_BASE}/chat-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to analyze chat');
    return res.json();
  },

  async generateSessionSummary(data: SessionSummaryRequest): Promise<{ summary: string }> {
    if (USE_MOCK) {
      await delay(1000);
      return {
        summary: 'Patient showed positive engagement throughout the session. Key topics discussed include anxiety management techniques and sleep improvement strategies. Mood appeared stable with notable improvement during discussion of coping mechanisms. Recommended continued practice of breathing exercises.',
      };
    }
    const res = await fetch(`${FLASK_API_BASE}/session-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate summary');
    return res.json();
  },
};

// ============= Patient API (for doctors) =============

export const patientApi = {
  async getPatients(doctorId: string): Promise<Patient[]> {
    if (USE_MOCK) {
      await delay(400);
      return mockPatients.filter(p => p.primaryDoctorId === doctorId);
    }
    const users = await usersApi.getAllUsers();
    return users.filter(u => u.role === 'PATIENT') as Patient[];
  },

  async getPatient(patientId: string): Promise<Patient | null> {
    if (USE_MOCK) {
      await delay(300);
      return mockPatients.find(p => p.id === patientId) || null;
    }
    const user = await usersApi.getUser(patientId);
    return user as Patient | null;
  },

  async getPatientSessions(patientId: string): Promise<Session[]> {
    return sessionApi.getSessionHistory(patientId);
  },
};

// ============= Consent API =============

export const consentApi = {
  async getConsent(userId: string): Promise<ConsentSettings> {
    await delay(200);
    const stored = localStorage.getItem(`consent_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      cameraEnabled: true,
      micEnabled: true,
      chatAnalysisEnabled: true,
      emotionTrackingEnabled: true,
    };
  },

  async updateConsent(userId: string, settings: ConsentSettings): Promise<void> {
    await delay(300);
    localStorage.setItem(`consent_${userId}`, JSON.stringify(settings));
  },
};

// ============= Export Utilities =============

export const exportChatTranscript = (messages: ChatMessage[], format: 'txt' | 'pdf' = 'txt'): void => {
  const content = messages
    .map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString();
      const sender = m.senderRole === 'DOCTOR' ? 'Doctor' : 'Patient';
      return `[${time}] ${sender}: ${m.content}`;
    })
    .join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-transcript-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
