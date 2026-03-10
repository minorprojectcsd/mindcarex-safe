import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, Clock, CheckCircle, XCircle, RefreshCw, AlertTriangle, BarChart3, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import emailNotificationService from '@/services/emailNotificationService';
import type { NotificationPreferences, NotificationLog } from '@/types/notification';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    userId: '',
    emailReminders: true,
    reminderMinutesBefore: 10,
    sessionSummaryEmail: true,
    statusUpdateEmail: true,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['notification-history'],
    queryFn: emailNotificationService.getHistory,
  });

  const { data: stats } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: emailNotificationService.getStatistics,
  });

  const resendMutation = useMutation({
    mutationFn: emailNotificationService.resendNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast({ title: 'Notification resent', description: 'The email has been queued for resending.' });
    },
    onError: () => {
      toast({ title: 'Resend failed', description: 'Could not resend the notification.', variant: 'destructive' });
    },
  });

  const handleClearAll = () => {
    queryClient.setQueryData(['notification-history'], []);
    queryClient.setQueryData(['notification-stats'], { total: 0, sent: 0, failed: 0, pending: 0 });
    toast({ title: 'Cleared', description: 'All notifications have been cleared.' });
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await emailNotificationService.updatePreferences(preferences);
      toast({ title: 'Saved', description: 'Notification preferences updated.' });
    } catch {
      toast({ title: 'Error', description: 'Could not save preferences.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredLogs = statusFilter === 'all'
    ? logs
    : logs.filter((l: NotificationLog) => l.status === statusFilter);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SENT': return 'default' as const;
      case 'FAILED': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold sm:text-2xl">Notifications</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Email notifications & history</p>
          </div>
          {logs.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:mx-auto sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all notification history from view.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="w-full sm:w-auto" onClick={handleClearAll}>
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Card>
              <CardContent className="flex items-center gap-2.5 p-3 sm:p-4">
                <BarChart3 className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                <div>
                  <p className="text-lg font-bold sm:text-2xl">{stats.total}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2.5 p-3 sm:p-4">
                <CheckCircle className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
                <div>
                  <p className="text-lg font-bold sm:text-2xl">{stats.sent}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Sent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2.5 p-3 sm:p-4">
                <XCircle className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />
                <div>
                  <p className="text-lg font-bold sm:text-2xl">{stats.failed}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Failed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2.5 p-3 sm:p-4">
                <Clock className="h-4 w-4 text-yellow-500 sm:h-5 sm:w-5" />
                <div>
                  <p className="text-lg font-bold sm:text-2xl">{stats.pending}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs sm:text-sm">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-3 mt-3 sm:mt-4">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    Email History
                  </CardTitle>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm h-8 sm:h-9">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                {logsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : filteredLogs.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredLogs.map((log: NotificationLog) => (
                      <div key={log.id} className="flex flex-col gap-2 rounded-lg border border-border p-2.5 sm:p-3">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">{statusIcon(log.status)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{log.subject}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {log.sentAt ? new Date(log.sentAt).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                            </p>
                            {log.errorMessage && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-destructive">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span className="truncate">{log.errorMessage}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {log.emailType.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant={statusBadgeVariant(log.status)} className="text-[10px] sm:text-xs">
                            {log.status}
                          </Badge>
                          {log.status === 'FAILED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto h-7 w-7"
                              disabled={resendMutation.isPending}
                              onClick={() => resendMutation.mutate(log.id)}
                            >
                              <RefreshCw className={`h-3 w-3 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <Mail className="mb-3 h-8 w-8 text-muted-foreground/40 sm:h-10 sm:w-10" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {statusFilter === 'all' ? 'No notifications yet' : `No ${statusFilter.toLowerCase()} notifications`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-3 mt-3 sm:mt-4">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Control what emails you receive</CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-sm">Appointment Reminders</Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Get reminded 10 minutes before</p>
                  </div>
                  <Switch
                    checked={preferences.emailReminders}
                    onCheckedChange={(v) => setPreferences((p) => ({ ...p, emailReminders: v }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-sm">Session Summaries</Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">AI-generated summary after sessions</p>
                  </div>
                  <Switch
                    checked={preferences.sessionSummaryEmail}
                    onCheckedChange={(v) => setPreferences((p) => ({ ...p, sessionSummaryEmail: v }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-sm">Status Updates</Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Appointment confirmations & changes</p>
                  </div>
                  <Switch
                    checked={preferences.statusUpdateEmail}
                    onCheckedChange={(v) => setPreferences((p) => ({ ...p, statusUpdateEmail: v }))}
                  />
                </div>
                <Button className="w-full sm:w-auto" size="sm" disabled={saving} onClick={handleSavePreferences}>
                  {saving ? 'Saving…' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
