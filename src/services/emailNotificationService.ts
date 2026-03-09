import api from '@/lib/api';
import type {
  NotificationPreferences,
  NotificationLog,
  NotificationStats,
} from '@/types/notification';

const BASE = '/api/notifications';

export const emailNotificationService = {
  async getHistory(): Promise<NotificationLog[]> {
    const res = await api.get<NotificationLog[]>(`${BASE}/history`);
    return res.data;
  },

  async getStatistics(): Promise<NotificationStats> {
    const res = await api.get<NotificationStats>(`${BASE}/statistics`);
    return res.data;
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get<NotificationPreferences>(`${BASE}/preferences`);
    return res.data;
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const res = await api.put<NotificationPreferences>(`${BASE}/preferences`, prefs);
    return res.data;
  },

  async resendNotification(notificationId: string): Promise<{ status: string }> {
    const res = await api.post<{ status: string }>(`${BASE}/${notificationId}/resend`);
    return res.data;
  },
};

export default emailNotificationService;
