export type NotificationType =
  | 'APPOINTMENT_REMINDER'
  | 'SESSION_SUMMARY'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED';

export interface NotificationPreferences {
  userId: string;
  emailReminders: boolean;
  reminderMinutesBefore: number;
  sessionSummaryEmail: boolean;
  statusUpdateEmail: boolean;
}

export interface NotificationLog {
  id: string;
  recipient: string;
  subject: string;
  emailType: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  errorMessage: string | null;
  appointmentId: string;
  sessionId: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface SendNotificationRequest {
  userId: string;
  type: NotificationType;
  appointmentId: string;
  customMessage?: string;
}
