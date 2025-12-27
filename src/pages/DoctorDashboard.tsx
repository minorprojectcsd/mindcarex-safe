import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Users, Calendar, Clock, AlertTriangle, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PatientCard } from '@/components/patients/PatientCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { patientApi, scheduleApi } from '@/services/api';
import { Patient, Schedule } from '@/types';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [patientsData, schedulesData] = await Promise.all([
          patientApi.getPatients(user.id),
          scheduleApi.getDoctorSchedules(user.id),
        ]);

        setPatients(patientsData);
        setSchedules(schedulesData);
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
      <DashboardLayout requireRole="DOCTOR">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const todaySchedules = schedules.filter(
    (s) =>
      s.status === 'scheduled' &&
      format(new Date(s.scheduled_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const upcomingSchedules = schedules.filter((s) => s.status === 'scheduled');

  // Simulate risk indicators
  const highRiskPatients = patients.filter((_, i) => i === 0);

  return (
    <DashboardLayout requireRole="DOCTOR">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Button onClick={() => navigate('/schedule')}>
            <Calendar className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Patients"
            value={patients.length}
            icon={<Users className="h-6 w-6" />}
          />
          <StatsCard
            title="Today's Sessions"
            value={todaySchedules.length}
            icon={<Calendar className="h-6 w-6" />}
          />
          <StatsCard
            title="This Week"
            value={upcomingSchedules.length}
            icon={<Clock className="h-6 w-6" />}
          />
          <StatsCard
            title="Needs Attention"
            value={highRiskPatients.length}
            icon={<AlertTriangle className="h-6 w-6" />}
          />
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Schedule</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/schedule')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {todaySchedules.length > 0 ? (
              <div className="space-y-4">
                {todaySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
                        <span className="text-sm font-semibold text-primary">
                          {schedule.patientName?.split(' ').map((n) => n[0]).join('') || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{schedule.patientName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(schedule.scheduled_time), 'h:mm a')} •{' '}
                          {schedule.duration || 50} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="scheduled">Scheduled</Badge>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/video/${schedule.id}`)}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  No sessions scheduled for today
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patients requiring attention */}
        {highRiskPatients.length > 0 && (
          <Card className="border-warning">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle>Patients Requiring Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {highRiskPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  riskLevel="medium"
                  nextSession={schedules[0] ? new Date(schedules[0].scheduled_time) : undefined}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Patients */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Patients</h2>
            <Button variant="outline" onClick={() => navigate('/patients')}>
              View All Patients
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {patients.slice(0, 4).map((patient, index) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                riskLevel={index === 0 ? 'medium' : 'low'}
                lastImprovement={index === 2 ? 12 : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
