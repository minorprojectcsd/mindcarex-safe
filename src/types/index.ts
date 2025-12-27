export type UserRole = 'PATIENT' | 'DOCTOR';

// ============= Database Schema Types (Supabase) =============

export interface User {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
  // Extended fields for frontend
  email?: string;
  avatar?: string;
}

export interface Patient extends User {
  role: 'PATIENT';
  dateOfBirth?: string;
  primaryDoctorId?: string;
}

export interface Doctor extends User {
  role: 'DOCTOR';
  specialization: string;
  licenseNumber: string;
  availability: Availability[];
}

export interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Schedule table
export interface Schedule {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_time: string;
  status: SessionStatus;
  // Extended fields for frontend
  patientName?: string;
  duration?: number;
  notes?: string;
}

// Session table
export interface Session {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string | null;
  end_time: string | null;
  // Extended fields
  status?: SessionStatus;
  notes?: string;
  summary?: string;
  duration?: number;
}

export type SessionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

// Message table
export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Extended for frontend
  senderRole?: UserRole;
  isRead?: boolean;
}

// Emotion Metrics table
export interface EmotionMetric {
  id: string;
  session_id: string;
  user_id: string;
  emotion: EmotionType;
  confidence: number;
  captured_at: string;
}

export type EmotionType = 'happy' | 'sad' | 'neutral' | 'angry' | 'stressed' | 'fearful' | 'surprised' | 'disgusted';

// Chat Analysis table
export interface ChatAnalysis {
  session_id: string;
  sentiment: string;
  risk_score: number;
  keywords: string[];
}

// Session Summaries table
export interface SessionSummary {
  session_id: string;
  summary: string;
  created_at: string;
}

// ============= API Request/Response Types =============

// Flask Emotion Frame Request
export interface EmotionFrameRequest {
  sessionId: string;
  userId: string;
  timestamp: string;
  imageBase64: string;
}

// Flask Emotion Frame Response
export interface EmotionFrameResponse {
  emotion: EmotionType;
  confidence: number;
  rollingAverage: Record<string, number>;
}

// Flask Chat Analysis Request
export interface ChatAnalysisRequest {
  sessionId: string;
  fullChatText: string;
}

// Flask Session Summary Request
export interface SessionSummaryRequest {
  sessionId: string;
  chatText: string;
  transcriptText: string;
}

// ============= Legacy Types for Compatibility =============

export interface EmotionScores {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  surprised: number;
  disgusted: number;
}

export interface EmotionTimepoint {
  timestamp: number;
  scores: EmotionScores;
}

export interface RiskIndicator {
  type: 'high_anxiety' | 'depression_signs' | 'distress' | 'improvement';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  description: string;
}

export interface EmotionMetrics {
  sessionId: string;
  averages: EmotionScores;
  timeline: EmotionTimepoint[];
  riskIndicators: RiskIndicator[];
}

// Legacy ChatMessage (for compatibility)
export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ConsentSettings {
  cameraEnabled: boolean;
  micEnabled: boolean;
  chatAnalysisEnabled: boolean;
  emotionTrackingEnabled: boolean;
}

// ============= WebRTC & Socket Types =============

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  from: string;
  to: string;
}

// Socket.IO Event Types (matching backend specification)
export interface SocketEvents {
  // Connection events
  connect: void;
  disconnect: void;
  join_room: { roomId: string; userId: string };
  leave_room: { roomId: string; userId: string };

  // Chat events
  chat_message: Message;
  chat_typing: { sessionId: string; userId: string; isTyping: boolean };
  chat_end: { sessionId: string };

  // WebRTC signaling
  webrtc_offer: WebRTCSignal;
  webrtc_answer: WebRTCSignal;
  webrtc_ice_candidate: WebRTCSignal;

  // Analytics & Alerts
  emotion_update: EmotionFrameResponse & { sessionId: string; userId: string };
  risk_alert: RiskIndicator & { sessionId: string };
  session_summary_ready: { sessionId: string; summary: string };
}
