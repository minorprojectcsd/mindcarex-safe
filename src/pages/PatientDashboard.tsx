import { useEffect, useState } from 'react';
import { Calendar, Clock, TrendingUp, Heart } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { EmotionChart } from '@/components/dashboard/EmotionChart';
import { EmotionSummary } from '@/components/dashboard/EmotionSummary';
import { useAuth } from '@/contexts/AuthContext';
import { sessionApi, scheduleApi } from '@/services/api';
import { Session, Schedule, EmotionMetrics } from '@/types';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [emotionMetrics, setEmotionMetrics] = useState<EmotionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [sessionsData, schedulesData] = await Promise.all([
          sessionApi.getSessions(user.id, 'PATIENT'),
          scheduleApi.getPatientSchedules(user.id),
        ]);

        setSessions(sessionsData);
        setUpcomingSchedules(
          schedulesData.filter((s) => s.status === 'scheduled')
        );

        // Get emotion metrics from last completed session
        const completedSession = sessionsData.find((s) => s.status === 'completed');
        if (completedSession) {
          const metrics = await sessionApi.getEmotionMetrics(completedSession.id);
          setEmotionMetrics(metrics);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <DashboardLayout requireRole="PATIENT">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const completedSessions = sessions.filter((s) => s.status === 'completed').length;

  return (
    <DashboardLayout requireRole="PATIENT">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Here's an overview of your mental health journey
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Sessions"
            value={sessions.length}
            icon={<Calendar className="h-6 w-6" />}
          />
          <StatsCard
            title="Completed"
            value={completedSessions}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatsCard
            title="Upcoming"
            value={upcomingSchedules.length}
            icon={<Clock className="h-6 w-6" />}
          />
          <StatsCard
            title="Wellness Score"
            value="78%"
            trend={{ value: 5, isPositive: true }}
            icon={<Heart className="h-6 w-6" />}
          />
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upcoming sessions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-4">
                {upcomingSchedules.slice(0, 3).map((schedule) => (
                  <SessionCard key={schedule.id} schedule={schedule} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  No upcoming sessions scheduled
                </p>
              </div>
            )}
          </div>

          {/* Emotion summary */}
          <div>
            {emotionMetrics ? (
              <EmotionSummary averages={emotionMetrics.averages} title="Last Session Emotions" />
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Complete a session to see emotion insights
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Emotion timeline */}
        {emotionMetrics && (
          <EmotionChart metrics={emotionMetrics} title="Emotion Timeline - Last Session" />
        )}

        {/* Past sessions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold md:text-xl">Past Sessions</h2>
          {sessions.filter((s) => s.status === 'completed').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions
                .filter((s) => s.status === 'completed')
                .slice(0, 4)
                .map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground">No past sessions yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
