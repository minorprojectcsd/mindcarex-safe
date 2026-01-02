import { useEffect, useState } from 'react';
import { Calendar, Filter, Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { sessionApi, scheduleApi } from '@/services/api';
import { Session, Schedule } from '@/types';

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
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
        setSchedules(schedulesData);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const upcomingSchedules = schedules.filter((s) => s.status === 'scheduled');
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const cancelledSessions = sessions.filter((s) => s.status === 'cancelled');

  return (
    <DashboardLayout requireRole="PATIENT">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">My Sessions</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              View and manage your consultation sessions
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none sm:size-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none sm:size-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
              Upcoming ({upcomingSchedules.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">
              Completed ({completedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
              Cancelled ({cancelledSessions.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingSchedules.length > 0 ? (
                  upcomingSchedules.map((schedule) => (
                    <SessionCard key={schedule.id} schedule={schedule} />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed py-16 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      No upcoming sessions scheduled
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Contact your doctor to schedule a new session
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedSessions.length > 0 ? (
                  completedSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed py-16 text-center">
                    <p className="text-muted-foreground">No completed sessions yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4">
                {cancelledSessions.length > 0 ? (
                  cancelledSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed py-16 text-center">
                    <p className="text-muted-foreground">No cancelled sessions</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
