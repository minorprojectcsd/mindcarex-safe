import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, ArrowLeft, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { appointmentService, PatientAppointment } from '@/services/appointmentService';

export default function MyAppointments() {
  const navigate = useNavigate();
  
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: appointmentService.getMyAppointments,
  });

  const scheduled = appointments?.filter(a => a.status === 'BOOKED' || a.status === 'SCHEDULED') || [];
  const completed = appointments?.filter(a => a.status === 'COMPLETED') || [];
  const cancelled = appointments?.filter(a => a.status === 'CANCELLED') || [];

  const AppointmentCard = ({ appointment }: { appointment: PatientAppointment }) => (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="font-medium">
          Dr. {appointment.doctor?.name || 'Doctor'}
        </p>
        {appointment.doctor?.specialization && (
          <p className="text-xs text-muted-foreground">{appointment.doctor.specialization}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {format(new Date(appointment.startTime), 'EEEE, MMMM d, yyyy · h:mm a')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant={
            appointment.status === 'SCHEDULED' ? 'default' : 
            appointment.status === 'COMPLETED' ? 'secondary' : 
            'destructive'
          }
        >
          {appointment.status}
        </Badge>
        {appointment.status === 'SCHEDULED' && (
          <Button size="sm" variant="outline" onClick={() => navigate(`/video/${appointment.id}`)}>
            <Video className="mr-1 h-3 w-3" />
            Join
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout requireRole="PATIENT">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/patient/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Appointments</h1>
              <p className="text-muted-foreground">View and manage your appointments</p>
            </div>
          </div>
          <Button onClick={() => navigate('/patient/book-appointment')}>
            <Calendar className="mr-2 h-4 w-4" />
            Book New
          </Button>
        </div>

        <Tabs defaultValue="scheduled">
          <TabsList>
            <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>

          {(['scheduled', 'completed', 'cancelled'] as const).map((tab) => {
            const list = tab === 'scheduled' ? scheduled : tab === 'completed' ? completed : cancelled;
            return (
              <TabsContent key={tab} value={tab} className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : list.length === 0 ? (
                      <div className="py-8 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">No {tab} appointments</p>
                        {tab === 'scheduled' && (
                          <Button className="mt-4" onClick={() => navigate('/patient/book-appointment')}>
                            Book an Appointment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {list.map(apt => (
                          <AppointmentCard key={apt.id} appointment={apt} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
