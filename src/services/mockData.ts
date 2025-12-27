import { Session, Schedule, EmotionMetrics, ChatMessage, Patient, Doctor } from '@/types';

export const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    email: 'sarah.johnson@email.com',
    name: 'Sarah Johnson',
    role: 'PATIENT',
    dateOfBirth: '1992-05-15',
    primaryDoctorId: 'doctor-1',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'patient-2',
    email: 'james.wilson@email.com',
    name: 'James Wilson',
    role: 'PATIENT',
    dateOfBirth: '1988-11-22',
    primaryDoctorId: 'doctor-1',
    created_at: '2024-02-20T10:00:00Z',
  },
  {
    id: 'patient-3',
    email: 'emily.davis@email.com',
    name: 'Emily Davis',
    role: 'PATIENT',
    dateOfBirth: '1995-03-08',
    primaryDoctorId: 'doctor-1',
    created_at: '2024-03-10T10:00:00Z',
  },
];

export const mockDoctors: Doctor[] = [
  {
    id: 'doctor-1',
    email: 'dr.chen@clinic.com',
    name: 'Dr. Michael Chen',
    role: 'DOCTOR',
    specialization: 'Clinical Psychology',
    licenseNumber: 'PSY-2019-4521',
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
    ],
    created_at: '2023-06-01T10:00:00Z',
  },
];

export const mockSessions: Session[] = [
  {
    id: 'session-1',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    start_time: '2024-12-20T14:00:00Z',
    end_time: '2024-12-20T14:50:00Z',
    status: 'completed',
    duration: 50,
    notes: 'Regular check-in session. Patient showed improvement in anxiety management.',
    summary: 'Patient reported better sleep patterns and reduced anxiety. Continued CBT techniques discussed.',
  },
  {
    id: 'session-2',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    start_time: '2024-12-27T14:00:00Z',
    end_time: null,
    status: 'scheduled',
    duration: 50,
  },
  {
    id: 'session-3',
    patient_id: 'patient-2',
    doctor_id: 'doctor-1',
    start_time: '2024-12-27T10:00:00Z',
    end_time: null,
    status: 'scheduled',
    duration: 50,
  },
  {
    id: 'session-4',
    patient_id: 'patient-3',
    doctor_id: 'doctor-1',
    start_time: '2024-12-15T11:00:00Z',
    end_time: '2024-12-15T12:00:00Z',
    status: 'completed',
    duration: 50,
    summary: 'Initial assessment completed. Treatment plan established.',
  },
];

export const mockEmotionMetrics: EmotionMetrics = {
  sessionId: 'session-1',
  averages: {
    neutral: 0.45,
    happy: 0.25,
    sad: 0.12,
    angry: 0.03,
    fearful: 0.08,
    surprised: 0.05,
    disgusted: 0.02,
  },
  timeline: [
    {
      timestamp: 0,
      scores: { neutral: 0.6, happy: 0.1, sad: 0.15, angry: 0.05, fearful: 0.05, surprised: 0.03, disgusted: 0.02 },
    },
    {
      timestamp: 600,
      scores: { neutral: 0.4, happy: 0.3, sad: 0.1, angry: 0.02, fearful: 0.1, surprised: 0.05, disgusted: 0.03 },
    },
    {
      timestamp: 1200,
      scores: { neutral: 0.5, happy: 0.25, sad: 0.1, angry: 0.03, fearful: 0.06, surprised: 0.04, disgusted: 0.02 },
    },
    {
      timestamp: 1800,
      scores: { neutral: 0.35, happy: 0.35, sad: 0.12, angry: 0.02, fearful: 0.08, surprised: 0.06, disgusted: 0.02 },
    },
    {
      timestamp: 2400,
      scores: { neutral: 0.45, happy: 0.28, sad: 0.1, angry: 0.04, fearful: 0.07, surprised: 0.04, disgusted: 0.02 },
    },
    {
      timestamp: 3000,
      scores: { neutral: 0.5, happy: 0.22, sad: 0.12, angry: 0.03, fearful: 0.08, surprised: 0.03, disgusted: 0.02 },
    },
  ],
  riskIndicators: [
    {
      type: 'improvement',
      severity: 'low',
      timestamp: 1800,
      description: 'Positive emotional shift detected during discussion of coping strategies.',
    },
  ],
};

export const mockSchedules: Schedule[] = [
  {
    id: 'schedule-1',
    doctor_id: 'doctor-1',
    patient_id: 'patient-1',
    scheduled_time: '2024-12-27T14:00:00Z',
    status: 'scheduled',
    patientName: 'Sarah Johnson',
    duration: 50,
    notes: 'Follow-up session',
  },
  {
    id: 'schedule-2',
    doctor_id: 'doctor-1',
    patient_id: 'patient-2',
    scheduled_time: '2024-12-27T10:00:00Z',
    status: 'scheduled',
    patientName: 'James Wilson',
    duration: 50,
    notes: 'Weekly check-in',
  },
  {
    id: 'schedule-3',
    doctor_id: 'doctor-1',
    patient_id: 'patient-3',
    scheduled_time: '2024-12-28T11:00:00Z',
    status: 'scheduled',
    patientName: 'Emily Davis',
    duration: 50,
  },
  {
    id: 'schedule-4',
    doctor_id: 'doctor-1',
    patient_id: 'patient-1',
    scheduled_time: '2024-12-30T15:00:00Z',
    status: 'scheduled',
    patientName: 'Sarah Johnson',
    duration: 50,
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sessionId: 'session-1',
    senderId: 'doctor-1',
    senderRole: 'DOCTOR',
    content: 'Hello Sarah, how have you been feeling since our last session?',
    timestamp: '2024-12-20T14:01:00Z',
    isRead: true,
  },
  {
    id: 'msg-2',
    sessionId: 'session-1',
    senderId: 'patient-1',
    senderRole: 'PATIENT',
    content: 'Hi Dr. Chen! I\'ve been doing better actually. The breathing exercises have really helped with my anxiety.',
    timestamp: '2024-12-20T14:02:00Z',
    isRead: true,
  },
  {
    id: 'msg-3',
    sessionId: 'session-1',
    senderId: 'doctor-1',
    senderRole: 'DOCTOR',
    content: 'That\'s wonderful to hear! Can you tell me more about when you\'ve been using them?',
    timestamp: '2024-12-20T14:03:00Z',
    isRead: true,
  },
  {
    id: 'msg-4',
    sessionId: 'session-1',
    senderId: 'patient-1',
    senderRole: 'PATIENT',
    content: 'Mostly before meetings at work. I used to get really nervous but now I feel much more calm.',
    timestamp: '2024-12-20T14:04:00Z',
    isRead: true,
  },
];
