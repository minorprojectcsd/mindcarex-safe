import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Download, TrendingUp, Users, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmotionChart } from '@/components/dashboard/EmotionChart';
import { useAuth } from '@/contexts/AuthContext';
import { sessionApi, patientApi } from '@/services/api';
import { Session, Patient, EmotionMetrics } from '@/types';

export default function Reports() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<EmotionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [sessionsData, patientsData] = await Promise.all([
          sessionApi.getSessions(user.id, 'DOCTOR'),
          patientApi.getPatients(user.id),
        ]);

        setSessions(sessionsData);
        setPatients(patientsData);

        // Load metrics for first completed session
        const completedSession = sessionsData.find((s) => s.status === 'completed');
        if (completedSession) {
          const metrics = await sessionApi.getEmotionMetrics(completedSession.id);
          setSelectedMetrics(metrics);
        }
      } catch (error) {
        console.error('Failed to load reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  };

  return (
    <DashboardLayout requireRole="DOCTOR">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Session analytics and patient insights
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export All Reports
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedSessions.length}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-light">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">78%</p>
                <p className="text-sm text-muted-foreground">Avg. Improvement</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-light">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.length}</p>
                <p className="text-sm text-muted-foreground">Active Patients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Avg. Duration (min)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emotion Analytics */}
        {selectedMetrics && (
          <EmotionChart metrics={selectedMetrics} title="Session Emotion Analysis" />
        )}

        {/* Session Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Session Reports</CardTitle>
            <CardDescription>
              View summaries and analytics from completed sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : completedSessions.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {completedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light sm:h-10 sm:w-10">
                        <FileText className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm sm:text-base">
                          {getPatientName(session.patient_id)}
                        </p>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                          {format(new Date(session.start_time || new Date()), 'MMM d, yyyy')} •{' '}
                          {session.duration || 50} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <Badge variant="completed" className="text-xs">Completed</Badge>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        View Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  No completed sessions yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
