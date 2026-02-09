import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle, Heart, CalendarPlus, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, PatientAppointment } from '@/services/appointmentService';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: appointmentService.getMyAppointments,
  });

  const scheduled = appointments?.filter(a => a.status === 'SCHEDULED') || [];
  const completed = appointments?.filter(a => a.status === 'COMPLETED') || [];

  return (
    <DashboardLayout requireRole="PATIENT">
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Welcome back, {user?.name || 'Patient'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/patient/book-appointment')} className="w-full sm:w-auto">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
            <Button variant="outline" onClick={() => navigate('/patient/appointments')} className="w-full sm:w-auto">
              <Calendar className="mr-2 h-4 w-4" />
              My Appointments
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Sessions" value={appointments?.length || 0} icon={<Calendar className="h-6 w-6" />} />
          <StatsCard title="Completed" value={completed.length} icon={<CheckCircle className="h-6 w-6" />} />
          <StatsCard title="Upcoming" value={scheduled.length} icon={<Clock className="h-6 w-6" />} />
          <StatsCard title="Wellness Score" value="--" icon={<Heart className="h-6 w-6" />} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/patient/appointments')}>View All</Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : scheduled.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No upcoming appointments</p>
                <Button className="mt-4" onClick={() => navigate('/patient/book-appointment')}>
                  Book an Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduled.slice(0, 3).map((apt: PatientAppointment) => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Dr. {apt.doctor?.fullName || 'Doctor'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(apt.scheduledAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{apt.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/video/${apt.id}`)}>
                        <Video className="mr-1 h-3 w-3" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
